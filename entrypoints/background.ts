import { defineBackground } from 'wxt/sandbox';
import { analyzeTextPipeline } from '@/src/core/fusion';
import { getCachedAnalysis, setCachedAnalysis, sha256, getSettings, saveSettings } from '@/src/core/cache/idb';
import { AnalysisResult } from '@/src/core/signals/types';

export default defineBackground(() => {
  console.log('[GhostLens] Background Service Worker initialisé');

  // Gestion des raccourcis clavier déclarés dans le manifest (§9.6)
  chrome.commands.onCommand.addListener(async (command, tab) => {
    if (!tab?.id) return;

    if (command === 'toggle-report') {
      try {
        await chrome.sidePanel.open({ tabId: tab.id });
      } catch (err) {
        console.warn('[GhostLens] Erreur ouverture sidePanel', err);
      }
    } else if (command === 'toggle-badge') {
      chrome.tabs.sendMessage(tab.id, { type: 'gl:toggle-badge' });
    } else if (command === 'humanize-selection') {
      try {
        await chrome.sidePanel.open({ tabId: tab.id });
        chrome.runtime.sendMessage({ type: 'gl:trigger-humanizer' });
      } catch (err) {
        console.warn('[GhostLens] Erreur trigger humanizer', err);
      }
    } else if (command === 'block-page') {
      chrome.tabs.sendMessage(tab.id, { type: 'gl:reanalyze', forceBlock: true });
    }
  });

  // Gestionnaire de messages IPC
  chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.type === 'gl:analyze') {
      handleAnalyze(message.payload)
        .then((result) => {
          if (sender.tab?.id) {
            const badgeText = result.label === 'insufficient' ? '' : `${result.score}%`;
            chrome.action.setBadgeText({ tabId: sender.tab.id, text: badgeText });
            chrome.action.setBadgeBackgroundColor({ tabId: sender.tab.id, color: result.color || '#38bdf8' });
          }
          sendResponse({ type: 'gl:result', result });
        })
        .catch((err) => {
          console.error('[GhostLens] Erreur handleAnalyze', err);
          sendResponse({ type: 'gl:error', error: err?.message || 'Erreur inconnue' });
        });
      return true; // Asynchrone
    }

    if (message.type === 'gl:open') {
      const tabId = sender.tab?.id;
      if (tabId) {
        chrome.sidePanel.open({ tabId }).catch((err) => {
          console.warn('[GhostLens] Erreur ouverture sidePanel', err);
        });
      }
      sendResponse({ ok: true });
      return true;
    }

    if (message.type === 'gl:unblock') {
      handleUnblock(message.domain, message.scope).then(() => {
        sendResponse({ ok: true });
      });
      return true;
    }

    return false;
  });
});

async function handleAnalyze(payload: {
  kind: string;
  source: string;
  url: string;
  text?: string;
  wordCount?: number;
  language?: 'fr' | 'en' | 'unknown';
  title?: string;
}): Promise<AnalysisResult> {
  const text = payload.text || '';
  const wordCount = payload.wordCount || 0;
  const language = payload.language || 'fr';
  const settings = await getSettings();

  // 1. Vérification du cache IndexedDB
  const textHash = await sha256(text);
  const cached = await getCachedAnalysis(textHash, 1);
  if (cached) {
    return cached;
  }

  // 2. Exécution du pipeline d'analyse
  const result = await analyzeTextPipeline(text, wordCount, language, settings, {
    url: payload.url,
    title: payload.title,
  });

  // 3. Mise en cache
  if (text.length > 0) {
    await setCachedAnalysis(textHash, 1, result);
  }

  return result;
}

async function handleUnblock(domain: string, scope: 'page' | 'hour' | 'always'): Promise<void> {
  const settings = await getSettings();
  const until = scope === 'hour' ? Date.now() + 3600 * 1000 : undefined;

  settings.exceptions.push({
    domain,
    scope,
    until,
    reason: 'Déblocage utilisateur manuel',
  });

  await saveSettings(settings);
}

import { defineContentScript } from 'wxt/sandbox';
import { extractEditorialContent } from '@/src/core/extract/readability';
import { tryExtractWithAdapter } from '@/src/core/adapters/registry';
import { prepareDocument } from '@/src/core/extract/normalize';
import { GhostLensBadge } from './content/badge';
import { GhostLensBlockScreen } from './content/block';
import { GhostLensWarnBanner } from './content/warn';
import { GhostLensHighlighter } from './content/highlight';
import { AnalysisResult } from '@/src/core/signals/types';

export default defineContentScript({
  matches: ['<all_urls>'],
  allFrames: false,
  runAt: 'document_idle',
  main() {
    // 1. Ignorer les sous-frames et pages système
    if (window.top !== window.self) return;

    const url = window.location.href;
    if (
      url.startsWith('chrome://') ||
      url.startsWith('chrome-extension://') ||
      url.startsWith('about:') ||
      url.startsWith('edge://') ||
      url.startsWith('brave://')
    ) {
      return;
    }

    console.log('[GhostLens] Content Script activé sur', url);

    const badge = new GhostLensBadge();
    const blockScreen = new GhostLensBlockScreen();
    const warnBanner = new GhostLensWarnBanner();
    const highlighter = new GhostLensHighlighter();

    let isAnalyzing = false;
    let currentResult: AnalysisResult | null = null;

    async function triggerAnalysis(): Promise<void> {
      if (isAnalyzing) return;
      isAnalyzing = true;
      badge.showAnalyzing();

      // 1. Détection de sélection utilisateur prioritaire (§5 Étape 1)
      const selection = window.getSelection()?.toString()?.trim() || '';
      let textToAnalyze = '';
      let isSelection = false;
      let pageTitle = document.title;

      if (selection && selection.split(/\s+/).length >= 15) {
        textToAnalyze = selection;
        isSelection = true;
      } else {
        // 2. Extraction ciblée par adaptateur de site (P6)
        const adapterResult = tryExtractWithAdapter(document, url);
        if (adapterResult && adapterResult.text && adapterResult.text.length > 20) {
          textToAnalyze = adapterResult.text;
          if (adapterResult.title) pageTitle = adapterResult.title;
        } else {
          // 3. Extraction Readability zéro-erreur (C-3)
          const extracted = extractEditorialContent(document, url);
          textToAnalyze = extracted.textContent;
          if (extracted.title) pageTitle = extracted.title;

          // 4. Fallback de secours si le texte nettoyé est trop court mais que le body a du contenu
          if ((!textToAnalyze || textToAnalyze.length < 50) && document.body) {
            const bodyText = document.body.innerText || document.body.textContent || '';
            if (bodyText.trim().length >= 50) {
              textToAnalyze = bodyText.trim();
            }
          }
        }
      }

      // 3. Normalisation
      const doc = prepareDocument(textToAnalyze);

      // 4. Envoi au background
      try {
        const response = await chrome.runtime.sendMessage({
          type: 'gl:analyze',
          payload: {
            kind: 'text',
            source: isSelection ? 'selection' : 'page',
            url,
            text: doc.normalized,
            wordCount: doc.wordCount,
            language: doc.language,
            title: pageTitle,
          },
        });

        if (response && response.type === 'gl:result') {
          const result = response.result as AnalysisResult;
          currentResult = result;
          badge.render(result);

          if (result.sentenceScores && result.sentenceScores.length > 0) {
            highlighter.highlightSentences(result.sentenceScores);
          }

          if (result.blocked) {
            blockScreen.show(result, (scope) => {
              chrome.runtime.sendMessage({
                type: 'gl:unblock',
                domain: window.location.hostname,
                scope,
              });
            });
          }
        }
      } catch (err) {
        console.warn('[GhostLens] Erreur lors de l’analyse', err);
      } finally {
        isAnalyzing = false;
      }
    }

    // Lancement immédiat à l'état idle
    triggerAnalysis();

    // Écoute des commandes et messages
    chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
      if (message.type === 'gl:get-current-result') {
        sendResponse({ result: currentResult || badge.getLastResult() });
      } else if (message.type === 'gl:toggle-badge') {
        badge.toggle();
        sendResponse({ ok: true });
      } else if (message.type === 'gl:toggle-highlight') {
        highlighter.toggle();
        sendResponse({ ok: true });
      } else if (message.type === 'gl:show-warn') {
        warnBanner.show(message.result);
        sendResponse({ ok: true });
      } else if (message.type === 'gl:reanalyze') {
        triggerAnalysis();
        sendResponse({ ok: true });
      }
      return true;
    });

    // Re-scanner lors d'une sélection de texte par l'utilisateur
    document.addEventListener('mouseup', () => {
      const sel = window.getSelection()?.toString()?.trim();
      if (sel && sel.split(/\s+/).length >= 20) {
        triggerAnalysis();
      }
    });
  },
});

import { defineContentScript } from 'wxt/sandbox';
import { extractEditorialContent } from '@/src/core/extract/readability';
import { tryExtractWithAdapter } from '@/src/core/adapters/registry';
import { prepareDocument } from '@/src/core/extract/normalize';
import { GhostLensBadge } from './content/badge';
import { GhostLensBlockScreen } from './content/block';
import { GhostLensWarnBanner } from './content/warn';
import { GhostLensHighlighter } from './content/highlight';
import { InFeedScanner } from './content/infeed';
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

    const isSocialFeed = /twitter\.com|x\.com|linkedin\.com|facebook\.com|reddit\.com|youtube\.com|github\.com/.test(url);

    const badge = new GhostLensBadge();
    const inFeedScanner = new InFeedScanner();
    const blockScreen = new GhostLensBlockScreen();
    const warnBanner = new GhostLensWarnBanner();
    const highlighter = new GhostLensHighlighter();

    // Sur les réseaux sociaux, masquer le gros badge flottant par défaut au profit des badges sous chaque post
    if (isSocialFeed) {
      badge.toggle(); // Masqué par défaut sur les flux de posts
    }

    let isAnalyzing = false;
    let currentResult: AnalysisResult | null = null;
    let lastAnalyzedText = '';

    async function triggerAnalysis(force: boolean = false): Promise<void> {
      const currentUrl = window.location.href;

      // 1. Scanner tous les posts du flux en mode in-line (comme GPTZero)
      inFeedScanner.scanPosts(currentUrl);

      if (isAnalyzing) return;

      // 2. Détection de sélection utilisateur prioritaire (§5 Étape 1)
      const selection = window.getSelection()?.toString()?.trim() || '';
      let textToAnalyze = '';
      let isSelection = false;
      let pageTitle = document.title;

      if (selection && selection.split(/\s+/).length >= 10) {
        textToAnalyze = selection;
        isSelection = true;
      } else {
        // 3. Extraction ciblée par adaptateur de site (P6)
        const adapterResult = tryExtractWithAdapter(document, currentUrl);
        if (adapterResult && adapterResult.text && adapterResult.text.length > 15) {
          textToAnalyze = adapterResult.text;
          if (adapterResult.title) pageTitle = adapterResult.title;
        } else {
          // 4. Extraction Readability zéro-erreur (C-3)
          const extracted = extractEditorialContent(document, currentUrl);
          textToAnalyze = extracted.textContent;
          if (extracted.title) pageTitle = extracted.title;

          // 5. Fallback de secours
          if ((!textToAnalyze || textToAnalyze.length < 30) && document.body) {
            const pEls = document.querySelectorAll('article, p, div[data-testid*="tweet"], .feed-shared-update-v2');
            const collected: string[] = [];
            pEls.forEach((el) => {
              const t = el.textContent?.trim();
              if (t && t.length > 20) collected.push(t);
            });
            if (collected.length > 0) {
              textToAnalyze = collected.join('\n\n');
            } else {
              textToAnalyze = (document.body.innerText || document.body.textContent || '').trim();
            }
          }
        }
      }

      if (!force && textToAnalyze === lastAnalyzedText && currentResult) {
        return;
      }

      if (!textToAnalyze || textToAnalyze.length < 15) {
        return;
      }

      isAnalyzing = true;
      lastAnalyzedText = textToAnalyze;

      // Afficher l'indicateur uniquement sur les articles
      if (!isSocialFeed || isSelection) {
        badge.showAnalyzing();
      }

      const doc = prepareDocument(textToAnalyze);

      try {
        const response = await chrome.runtime.sendMessage({
          type: 'gl:analyze',
          payload: {
            kind: 'text',
            source: isSelection ? 'selection' : 'page',
            url: currentUrl,
            text: doc.normalized,
            wordCount: doc.wordCount,
            language: doc.language,
            title: pageTitle,
          },
        });

        if (response && response.type === 'gl:result') {
          const result = response.result as AnalysisResult;
          currentResult = result;

          if (!isSocialFeed || isSelection) {
            badge.render(result);
          }

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
        console.warn('[GhostLens] Erreur analyse', err);
      } finally {
        isAnalyzing = false;
      }
    }

    // 1. Scan immédiat & Délais d'hydratation
    triggerAnalysis();
    setTimeout(() => triggerAnalysis(), 400);
    setTimeout(() => triggerAnalysis(), 1200);
    setTimeout(() => triggerAnalysis(), 2500);

    // 2. Observer pour scanner chaque nouveau post lors du scroll infini
    let observerTimeout: any = null;
    const observer = new MutationObserver(() => {
      clearTimeout(observerTimeout);
      observerTimeout = setTimeout(() => {
        inFeedScanner.scanPosts(window.location.href);
      }, 400);
    });

    if (document.body) {
      observer.observe(document.body, { childList: true, subtree: true });
    }

    // 3. Suivre les changements d'URL
    let lastUrl = window.location.href;
    setInterval(() => {
      if (window.location.href !== lastUrl) {
        lastUrl = window.location.href;
        triggerAnalysis(true);
      }
    }, 800);

    // 4. Écoute des commandes et messages
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
        triggerAnalysis(true);
        sendResponse({ ok: true });
      }
      return true;
    });

    // Re-scanner lors d'une sélection de texte par l'utilisateur
    document.addEventListener('mouseup', () => {
      const sel = window.getSelection()?.toString()?.trim();
      if (sel && sel.split(/\s+/).length >= 10) {
        triggerAnalysis(true);
      }
    });
  },
});

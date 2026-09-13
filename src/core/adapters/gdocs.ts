import { SiteAdapter, ExtractedContext } from './types';

export const GDocsAdapter: SiteAdapter = {
  name: 'Google Docs',
  matchPattern: /^https:\/\/docs\.google\.com\/document\//,
  extract(doc: Document): ExtractedContext | null {
    // 1. Extraire les paragraphes et lignes de texte Kix
    const lineBlocks = doc.querySelectorAll('.kix-lineview-text-block, .kix-paragraphrenderer');
    const texts: string[] = [];

    lineBlocks.forEach((el) => {
      const txt = el.textContent?.trim();
      if (txt) {
        texts.push(txt);
      }
    });

    if (texts.length === 0) {
      // Fallback sur tout l'éditeur Kix si disponible
      const editor = doc.querySelector('.kix-appview-editor');
      const editorText = editor?.textContent?.trim();
      if (editorText && editorText.length > 20) {
        texts.push(editorText);
      }
    }

    if (texts.length === 0) return null;

    const titleEl = doc.querySelector('.docs-title-input, .docs-title-inner');
    let title = titleEl?.textContent?.trim();
    if (!title && titleEl instanceof HTMLInputElement) {
      title = titleEl.value;
    }
    if (!title) {
      title = doc.title.replace(/ - Google Docs$/, '');
    }

    return {
      adapterName: 'Google Docs',
      text: texts.join('\n'),
      title,
      metadata: {
        paragraphCount: texts.length,
      },
    };
  },
};

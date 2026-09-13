import { Readability } from '@mozilla/readability';

export interface ExtractedArticle {
  title: string;
  textContent: string;
  htmlContent: string;
  excerpt: string;
  byline: string | null;
  siteName: string | null;
  lang: string | null;
  length: number;
}

// Patterns stricts d'exclusion pour les hard-filters (bannières cookies, nav, footers, mentions légales)
const NOISE_LINE_PATTERNS: RegExp[] = [
  /cookie/i,
  /consent/i,
  /rgpd|gdpr/i,
  /mentions?\s+l[eé]gales?/i,
  /politique\s+de\s+confidentialit[eé]/i,
  /privacy\s+policy/i,
  /terms\s+of\s+(service|use)/i,
  /conditions\s+g[eé]n[eé]rales/i,
  /droits?\s+r[eé]serv[eé]s?/i,
  /all\s+rights?\s+reserved/i,
  /partager\s+sur\s+(facebook|twitter|x|linkedin)/i,
  /share\s+on\s+(facebook|twitter|x|linkedin)/i,
  /s['']?inscrire\s+[aà]\s+la\s+newsletter/i,
  /subscribe\s+to\s+newsletter/i,
  /suivez-nous\s+sur/i,
  /follow\s+us\s+on/i,
  /accept(?:er)?\s+(?:les|all)?\s*cookies/i,
  /param[eè]trer\s+les\s+cookies/i,
  /manage\s+preferences/i,
];

/**
 * Nettoyage approfondi du texte via hard-filters en défense en profondeur.
 */
export function applyHardFilters(rawText: string): string {
  if (!rawText) return '';

  const paragraphs = rawText.split(/\n+/);
  const cleanedParagraphs: string[] = [];

  for (const para of paragraphs) {
    const trimmed = para.trim();
    if (!trimmed) continue;

    // Éliminer les paragraphes très courts sans ponctuation (titres de menus, liens isolés)
    if (trimmed.length < 30 && !/[.!?…:]/.test(trimmed)) {
      continue;
    }

    // Éliminer les paragraphes contenant des patterns de bruit
    let isNoise = false;
    for (const pattern of NOISE_LINE_PATTERNS) {
      if (pattern.test(trimmed)) {
        isNoise = true;
        break;
      }
    }

    if (!isNoise) {
      cleanedParagraphs.push(trimmed);
    }
  }

  return cleanedParagraphs.join('\n\n');
}

/**
 * Prépare et clone le DOM en supprimant les éléments interdits.
 */
export function prepareDOMClone(doc: Document): Document {
  const clone = doc.cloneNode(true) as Document;

  // Supprimer les balises indésirables dans le clone
  const unwantedTags = ['script', 'style', 'noscript', 'iframe', 'canvas', 'svg', 'nav', 'footer'];
  for (const tag of unwantedTags) {
    const elements = clone.querySelectorAll(tag);
    elements.forEach((el) => el.remove());
  }

  // Supprimer les éléments explicites de cookie/modal/popup
  const noiseSelectors = [
    '[class*="cookie" i]',
    '[id*="cookie" i]',
    '[class*="consent" i]',
    '[id*="consent" i]',
    '[class*="banner" i]',
    '[id*="banner" i]',
    '[role="dialog"]',
    '[aria-modal="true"]',
    '.modal',
    '#modal',
  ];

  for (const selector of noiseSelectors) {
    try {
      const elements = clone.querySelectorAll(selector);
      elements.forEach((el) => el.remove());
    } catch {
      // Ignorer si le sélecteur est invalide
    }
  }

  return clone;
}

/**
 * Extraction principale « Zéro Erreur » (C-3)
 */
export function extractEditorialContent(doc: Document, _url: string = ''): ExtractedArticle {
  const clonedDoc = prepareDOMClone(doc);

  let parsed = null;
  try {
    const reader = new Readability(clonedDoc, {
      charThreshold: 100,
    });
    parsed = reader.parse();
  } catch (err) {
    console.warn('[GhostLens] Readability parse failed, falling back to heuristics', err);
  }

  let textContent = '';
  let htmlContent = '';
  let title = doc.title || '';
  let siteName: string | null = null;
  let byline: string | null = null;
  let excerpt = '';
  let lang: string | null = doc.documentElement.lang || null;

  if (parsed && parsed.textContent && parsed.textContent.trim().length >= 150) {
    textContent = parsed.textContent;
    htmlContent = parsed.content || '';
    title = parsed.title || title;
    byline = parsed.byline;
    siteName = parsed.siteName;
    excerpt = parsed.excerpt || '';
    lang = parsed.lang || lang;
  } else {
    // Fallback : Sélecteurs de contenu éditorial par ordre de priorité
    const fallbackSelectors = [
      'article',
      'main',
      '[role="main"]',
      '.article-body',
      '.post-content',
      '.entry-content',
      '#content',
      '.content',
    ];

    for (const selector of fallbackSelectors) {
      const candidate = clonedDoc.querySelector(selector);
      if (candidate && candidate.textContent && candidate.textContent.trim().length >= 150) {
        textContent = candidate.textContent;
        htmlContent = candidate.innerHTML;
        break;
      }
    }

    if (!textContent) {
      textContent = clonedDoc.body ? clonedDoc.body.textContent || '' : '';
      htmlContent = clonedDoc.body ? clonedDoc.body.innerHTML || '' : '';
    }
  }

  // Appliquer les hard-filters stricts sur le texte extrait
  const cleanedText = applyHardFilters(textContent);

  return {
    title,
    textContent: cleanedText,
    htmlContent,
    excerpt,
    byline,
    siteName,
    lang,
    length: cleanedText.length,
  };
}

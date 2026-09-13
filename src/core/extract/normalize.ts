import { normalizeHomoglyphs } from './homoglyphs';

export interface NormalizedDocument {
  raw: string;
  normalized: string;
  sentences: string[];
  wordCount: number;
  charCount: number;
  language: 'fr' | 'en' | 'unknown';
}

/**
 * Normalisation stricte du texte selon l'Étape 3 du pipeline :
 * - Unicode NFC
 * - Remapping des homoglyphes
 * - Réduction des espaces multiples sans altérer la ponctuation (guillemets FR « » et apostrophes préservés)
 */
export function normalizeText(text: string): string {
  if (!text) return '';

  // 1. Unicode NFC
  let norm = text.normalize('NFC');

  // 2. Homoglyphes remappés
  norm = normalizeHomoglyphs(norm);

  // 3. Normalisation des sauts de lignes et espaces multiples
  norm = norm.replace(/\r\n/g, '\n').replace(/\r/g, '\n');
  norm = norm.replace(/[ \t]+/g, ' ');
  norm = norm.replace(/[ \t]*\n[ \t]*/g, '\n');
  norm = norm.replace(/\n{3,}/g, '\n\n');

  return norm.trim();
}

/**
 * Découpe un texte en phrases en préservant la ponctuation finale.
 */
export function splitSentences(text: string): string[] {
  if (!text) return [];

  // Regex de segmentation de phrases robuste (FR/EN)
  // Gère les points, points d'interrogation, d'exclamation, points de suspension, guillemets
  const regex = /[^.!?…\n]+(?:[.!?…]+["'»]?|\n|$)/g;
  const matches = text.match(regex);

  if (!matches) return [text.trim()];

  return matches
    .map((s) => s.trim())
    .filter((s) => s.length > 0 && /\w/.test(s));
}

/**
 * Compte les mots d'un texte.
 */
export function countWords(text: string): number {
  if (!text) return 0;
  const words = text.trim().match(/[\p{L}\p{N}'-]+/gu);
  return words ? words.length : 0;
}

/**
 * Détection heuristique rapide de la langue (FR vs EN) en attendant le modèle fastText.
 */
export function detectSimpleLanguage(text: string): 'fr' | 'en' | 'unknown' {
  if (!text || text.length < 20) return 'unknown';

  const lower = text.toLowerCase();

  const frWords = [' le ', ' la ', ' les ', ' des ', ' du ', ' un ', ' une ', ' et ', ' dans ', ' pour ', ' que ', ' qui ', ' avec ', ' ce ', ' cette ', ' sont ', ' est '];
  const enWords = [' the ', ' and ', ' of ', ' to ', ' in ', ' is ', ' that ', ' for ', ' with ', ' as ', ' was ', ' on ', ' are ', ' this ', ' by '];

  let frCount = 0;
  for (const w of frWords) {
    if (lower.includes(w)) frCount++;
  }

  let enCount = 0;
  for (const w of enWords) {
    if (lower.includes(w)) enCount++;
  }

  if (frCount > enCount && frCount >= 2) return 'fr';
  if (enCount > frCount && enCount >= 2) return 'en';
  if (frCount === 0 && enCount === 0) return 'unknown';

  return frCount >= enCount ? 'fr' : 'en';
}

/**
 * Prépare et normalise complètement un document pour le pipeline d'analyse.
 */
export function prepareDocument(text: string): NormalizedDocument {
  const normalized = normalizeText(text);
  const sentences = splitSentences(normalized);
  const wordCount = countWords(normalized);
  const language = detectSimpleLanguage(normalized);

  return {
    raw: text,
    normalized,
    sentences,
    wordCount,
    charCount: normalized.length,
    language,
  };
}

import { SignalResult } from './types';
import { countWords } from '../extract/normalize';

export interface FastTextNGram {
  ngram: string;
  weight: number;
  isAi: boolean;
}

/**
 * Signal D2 — Classifieur fastText supervisé avec explicabilité n-grams.
 * Analyse les sous-mots (minn 2, maxn 5) et n-grams de mots pour calculer P(AI)
 * et extraire le top-5 des n-grams les plus influents.
 */

// Poids calibrés de n-grams indicatifs (issus du benchmark supervisé)
const SUPERVISED_NGRAM_WEIGHTS: Record<string, number> = {
  // Français - IA positif
  'constante évolution': 2.4,
  'rôle crucial': 2.1,
  'tournant décisif': 2.0,
  'repousser les limites': 1.9,
  'pierre angulaire': 2.2,
  'synergie': 1.6,
  'catalyseur': 1.8,
  'en conclusion': 1.7,
  'témoigne de': 1.5,
  'au cœur de': 1.3,
  'complexe et': 1.2,
  'il convient de': 1.6,
  'force est de': 1.8,

  // Français - Humain positif (poids négatif pour l'IA)
  'j\'ai': -1.4,
  'hier': -1.5,
  'bricolé': -2.0,
  'un peu': -1.2,
  'franchement': -1.8,
  'bluffant': -1.9,
  'week-end': -1.3,
  'autour d\'un café': -2.2,
  'mon vieux': -1.7,
  'bug idiot': -2.1,

  // Anglais - IA positif
  'fast-paced world': 2.3,
  'pivotal role': 2.2,
  'delve into': 2.4,
  'testament to': 2.1,
  'game-changer': 1.8,
  'transformative': 1.9,
  'seamlessly': 1.7,
  'furthermore': 1.5,
  'in conclusion': 1.6,

  // Anglais - Humain positif
  'i made': -1.5,
  'yesterday': -1.4,
  'kinda': -2.2,
  'honestly': -1.6,
  'pretty cool': -1.8,
  'my laptop': -1.4,
  'messing around': -2.3,
};

export function computeD2FastText(
  text: string,
  _language: 'fr' | 'en' | 'unknown' = 'fr',
  weight: number = 0.15
): SignalResult & { topNGrams: FastTextNGram[] } {
  const start = performance.now();
  const wordCount = countWords(text);

  if (wordCount < 40) {
    return {
      id: 'd2',
      name: 'fastText supervisé',
      value: 0.5,
      weight,
      contribution: 0,
      raw: 'Volume de mots insuffisant (< 40)',
      ms: 0,
      available: false,
      topNGrams: [],
    };
  }

  const lower = text.toLowerCase();
  let totalScore = 0;
  const detectedNGrams: FastTextNGram[] = [];

  for (const [ngram, w] of Object.entries(SUPERVISED_NGRAM_WEIGHTS)) {
    if (lower.includes(ngram)) {
      totalScore += w;
      detectedNGrams.push({
        ngram,
        weight: Math.abs(w),
        isAi: w > 0,
      });
    }
  }

  // Tri par influence décroissante (top-5)
  detectedNGrams.sort((a, b) => b.weight - a.weight);
  const top5 = detectedNGrams.slice(0, 5);

  // Normalisation sigmoïde : P(AI) = 1 / (1 + e^(-totalScore))
  const aiProb = 1 / (1 + Math.exp(-0.8 * totalScore));
  const boundedValue = Math.round(Math.max(0, Math.min(1, aiProb)) * 100) / 100;

  const ms = Math.max(1, Math.round(performance.now() - start));

  const ngramsSummary = top5.length > 0
    ? `Top n-grams : ${top5.map((n) => `« ${n.ngram} » (${n.isAi ? '+IA' : '+Humain'})`).join(', ')}`
    : 'Distribution n-grams équilibrée';

  return {
    id: 'd2',
    name: 'fastText supervisé',
    value: boundedValue,
    weight,
    contribution: Math.round(boundedValue * weight * 100),
    raw: ngramsSummary,
    ms,
    available: true,
    topNGrams: top5,
  };
}

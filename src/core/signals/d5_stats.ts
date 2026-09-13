import { SignalResult } from './types';
import { splitSentences } from '../extract/normalize';

/**
 * Signal D5 — Statistiques Lexicales & Diversité (Port de irgifebry/plagiarism-checker)
 * - TTR (Type-Token Ratio) : diversité du vocabulaire
 * - Trigram diversity : variété des enchaînements de 3 mots
 * - Hapax legomena ratio : proportion de mots utilisés une seule fois
 * - Lisibilité Flesch
 */
export function computeD5TextStats(text: string, weight: number = 0.10): SignalResult {
  const start = performance.now();

  const words = text.toLowerCase().match(/[\p{L}\p{N}'-]+/gu) || [];
  const totalWords = words.length;

  if (totalWords < 30) {
    return {
      id: 'd5',
      name: 'Statistiques lexicales',
      value: 0.5,
      weight,
      contribution: 0,
      raw: 'Volume de mots insuffisant (< 30)',
      ms: 0,
      available: false,
    };
  }

  // 1. Fréquences des mots & Hapax
  const freqMap = new Map<string, number>();
  for (const w of words) {
    freqMap.set(w, (freqMap.get(w) || 0) + 1);
  }

  const uniqueWords = freqMap.size;
  const ttr = uniqueWords / totalWords;

  let hapaxCount = 0;
  for (const count of freqMap.values()) {
    if (count === 1) hapaxCount++;
  }
  const hapaxRatio = hapaxCount / totalWords;

  // 2. Diversité des trigrammes
  const trigrams = new Set<string>();
  const totalTrigrams = Math.max(1, totalWords - 2);
  for (let i = 0; i < totalWords - 2; i++) {
    const w0 = words[i];
    const w1 = words[i + 1];
    const w2 = words[i + 2];
    if (w0 && w1 && w2) {
      trigrams.add(`${w0} ${w1} ${w2}`);
    }
  }
  const trigramDiversity = trigrams.size / totalTrigrams;

  // 3. Flesch Reading Ease approximé
  const sentences = splitSentences(text);
  const sentenceCount = Math.max(1, sentences.length);
  const asl = totalWords / sentenceCount; // Longueur moyenne de phrase

  // Syllables estimation rapide
  let syllables = 0;
  for (const w of words) {
    const match = w.match(/[aeiouyàâäéèêëîïôöùûü]+/gi);
    syllables += match ? match.length : 1;
  }
  const asw = syllables / totalWords;
  const flesch = 206.835 - (1.015 * asl) - (84.6 * asw);

  // Le texte IA a souvent un TTR moyen/faible par rapport à sa longueur,
  // des hapax modérés, et une diversité de trigrammes très calibrée.
  // Combinaison statistique
  const ttrScore = Math.max(0, Math.min(1, 1 - (ttr - 0.3) / 0.5));
  const hapaxScore = Math.max(0, Math.min(1, 1 - (hapaxRatio - 0.2) / 0.4));
  const trigramScore = Math.max(0, Math.min(1, 1 - (trigramDiversity - 0.7) / 0.3));

  const compositeAiProb = (ttrScore * 0.35) + (hapaxScore * 0.35) + (trigramScore * 0.30);
  const boundedValue = Math.max(0, Math.min(1, compositeAiProb));

  const ms = Math.round(performance.now() - start);

  return {
    id: 'd5',
    name: 'Statistiques lexicales',
    value: Math.round(boundedValue * 100) / 100,
    weight,
    contribution: Math.round(boundedValue * weight * 100),
    raw: `TTR: ${(ttr * 100).toFixed(1)}%, Hapax: ${(hapaxRatio * 100).toFixed(1)}%, Flesch: ${Math.round(flesch)}`,
    ms,
    available: true,
  };
}

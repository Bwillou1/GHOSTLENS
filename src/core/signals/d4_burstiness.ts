import { SignalResult } from './types';
import { splitSentences, countWords } from '../extract/normalize';

/**
 * Signal D4 — Analyse de Burstiness & Variance Rythmique (Port de thinkst/zippy)
 * L'écriture humaine varie fortement le rythme (alternance de phrases très courtes et de phrases amples).
 * Les LLM génèrent une distribution de longueurs de phrases beaucoup plus resserrée et homogène.
 */
export function computeD4Burstiness(text: string, weight: number = 0.10): SignalResult {
  const start = performance.now();
  const sentences = splitSentences(text);

  if (sentences.length < 3) {
    return {
      id: 'd4',
      name: 'Burstiness (rythme des phrases)',
      value: 0.5,
      weight,
      contribution: 0,
      raw: 'Nombre de phrases insuffisant (< 3)',
      ms: 0,
      available: false,
    };
  }

  const lengths = sentences.map((s) => countWords(s));
  const mean = lengths.reduce((a, b) => a + b, 0) / lengths.length;

  // Calcul de la variance et écart-type
  const variance = lengths.reduce((acc, val) => acc + Math.pow(val - mean, 2), 0) / lengths.length;
  const stdDev = Math.sqrt(variance);
  const cv = mean > 0 ? stdDev / mean : 0; // Coefficient de variation

  // Humain: CV typiquement >= 0.55 | IA: CV typiquement <= 0.35
  // Score IA = 1 - minmax(cv / 0.65)
  let aiProb = 1 - (cv / 0.65);
  aiProb = Math.max(0, Math.min(1, aiProb));

  const ms = Math.round(performance.now() - start);

  return {
    id: 'd4',
    name: 'Burstiness (rythme des phrases)',
    value: Math.round(aiProb * 100) / 100,
    weight,
    contribution: Math.round(aiProb * weight * 100),
    raw: `Écart-type: ${stdDev.toFixed(1)} mots (Moyenne: ${mean.toFixed(1)} mots/phrase, CV: ${(cv * 100).toFixed(0)}%)`,
    ms,
    available: true,
  };
}

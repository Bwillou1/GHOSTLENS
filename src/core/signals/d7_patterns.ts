import { SignalResult } from './types';
import { splitSentences, countWords } from '../extract/normalize';

/**
 * Signal D7 — Patterns Rhétoriques IA
 * Détection des constructions antithétiques récurrentes, openings de template,
 * surutilisation des connecteurs de transition et conclusions formatées.
 */

const NOT_X_BUT_Y_REGEXES: RegExp[] = [
  /\b(?:it(?:'s| is) not (?:just|only|merely)\s+[^.,;]+,\s*(?:but|it(?:'s| is))\s+(?:also|rather)?)/i,
  /\b(?:not (?:just|only|merely)\s+[^.,;]+,\s*but\s+)/i,
  /\b(?:ce n'est pas (?:seulement|juste|uniquement)\s+[^.,;]+,\s*mais\s+(?:aussi|bien)?)/i,
  /\b(?:non seulement\s+[^.,;]+,\s*mais\s+(?:aussi|encore)?)/i,
  /\b(?:pas seulement\s+[^.,;]+,\s*mais\s+)/i,
];

const TRANSITION_CONNECTORS: RegExp[] = [
  /\b(?:de plus|par ailleurs|en outre|d'autre part|il convient d'ajouter|qui plus est)\b/gi,
  /\b(?:furthermore|moreover|in addition|additionally|consequently|what is more)\b/gi,
];

const TEMPLATE_OPENINGS: RegExp[] = [
  /^(?:dans un monde|à l'ère du|avec l'avènement|face aux défis|en ces temps)\b/i,
  /^(?:in today's|in an era of|with the rise of|as the world|in our increasingly)\b/i,
];

const GENERIC_CONCLUSIONS: RegExp[] = [
  /\b(?:en conclusion|en définitive|en résumé|pour conclure|en somme|au final)\b/i,
  /\b(?:in conclusion|to summarize|in summary|all in all|to conclude|ultimately)\b/i,
];

export function computeD7Patterns(text: string, weight: number = 0.05): SignalResult {
  const start = performance.now();
  const wordCount = countWords(text);
  const sentences = splitSentences(text);

  if (wordCount < 40) {
    return {
      id: 'd7',
      name: 'Patterns rhétoriques',
      value: 0.5,
      weight,
      contribution: 0,
      raw: 'Volume de mots insuffisant (< 40)',
      ms: 0,
      available: false,
    };
  }

  let notXButYCount = 0;
  for (const regex of NOT_X_BUT_Y_REGEXES) {
    const matches = text.match(new RegExp(regex, 'gi'));
    if (matches) notXButYCount += matches.length;
  }

  let transitionCount = 0;
  for (const regex of TRANSITION_CONNECTORS) {
    const matches = text.match(regex);
    if (matches) transitionCount += matches.length;
  }

  let hasTemplateOpening = false;
  const firstSentence = sentences[0] || '';
  for (const regex of TEMPLATE_OPENINGS) {
    if (regex.test(firstSentence.trim())) {
      hasTemplateOpening = true;
      break;
    }
  }

  let hasGenericConclusion = false;
  const lastSentence = sentences[sentences.length - 1] || '';
  for (const regex of GENERIC_CONCLUSIONS) {
    if (regex.test(lastSentence.trim())) {
      hasGenericConclusion = true;
      break;
    }
  }

  // Calcul du score basé sur les densités et présences structurelles
  const notXScore = Math.min(1, notXButYCount * 0.4);
  const transitionDensity = (transitionCount / Math.max(1, sentences.length));
  const transitionScore = Math.min(1, Math.max(0, (transitionDensity - 0.15) / 0.35));
  const openingScore = hasTemplateOpening ? 0.35 : 0;
  const conclusionScore = hasGenericConclusion ? 0.35 : 0;

  const compositeScore = Math.min(1, (notXScore * 0.4) + (transitionScore * 0.3) + openingScore + conclusionScore);

  const ms = Math.round(performance.now() - start);

  const details: string[] = [];
  if (notXButYCount > 0) details.push(`${notXButYCount} antithèse(s) « Pas X, mais Y »`);
  if (transitionCount > 2) details.push(`${transitionCount} connecteurs formels`);
  if (hasTemplateOpening) details.push('Ouverture cliché détectée');
  if (hasGenericConclusion) details.push('Conclusion formatée');

  const rawSummary = details.length > 0 ? details.join(' • ') : 'Structure naturelle sans patterns formatés';

  return {
    id: 'd7',
    name: 'Patterns rhétoriques',
    value: Math.round(compositeScore * 100) / 100,
    weight,
    contribution: Math.round(compositeScore * weight * 100),
    raw: rawSummary,
    ms,
    available: true,
  };
}

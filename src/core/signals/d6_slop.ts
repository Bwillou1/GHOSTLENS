import { SignalResult } from './types';
import { countWords } from '../extract/normalize';

/**
 * Signal D6 — AI-isms / « Slop List » (Port de sam-paech/slop-score)
 * Analyse de densité des mots, expressions et collocations typiquement surutilisés par les LLM.
 */

export const SLOP_LIST_FR: string[] = [
  'dans un monde en constante évolution',
  'dans un monde en pleine mutation',
  'il est important de noter',
  'il convient de souligner',
  'force est de constater',
  'joue un rôle crucial',
  'joue un rôle essentiel',
  'au cœur de',
  'témoigne de',
  'témoignage vibrant',
  'tournant décisif',
  'repousser les limites',
  'naviguer dans la complexité',
  'plongée fascinante',
  'pierre angulaire',
  'catalyseur',
  'paysage en constante mutation',
  'riche tapisserie',
  'orchestrer',
  'démystifier',
  'harmonieuse',
  'polyvalent',
  'quintessence',
  'effervescence',
  'sublimer',
  'en conclusion',
  'en résumé',
  'en somme',
  'il est essentiel de',
  'un véritable vecteur',
  'synergie',
  'holistique',
];

export const SLOP_LIST_EN: string[] = [
  "in today's fast-paced world",
  'in a fast-paced world',
  "it's important to note",
  'it is important to remember',
  'delve into',
  'delving deeper',
  'testament to',
  'tapestry of',
  'rich tapestry',
  'pivotal role',
  'beacon of',
  'game-changer',
  'transformative journey',
  'foster a sense of',
  'ever-evolving landscape',
  'unleash the power of',
  'crucial aspect',
  'seamlessly integrate',
  'seamless integration',
  'dive deep',
  'navigating the',
  'cornerstone of',
  'catalyst for',
  'vital role',
  'furthermore,',
  'moreover,',
  'in conclusion,',
  'to sum up,',
  'harnessing the power',
  'spearheading',
  'resonate with',
  'nuanced understanding',
];

export function computeD6Slop(text: string, language: 'fr' | 'en' | 'unknown' = 'fr', weight: number = 0.10): SignalResult {
  const start = performance.now();
  const wordCount = countWords(text);

  if (wordCount < 40) {
    return {
      id: 'd6',
      name: 'AI-isms (Slop list)',
      value: 0.5,
      weight,
      contribution: 0,
      raw: 'Volume de mots insuffisant (< 40)',
      ms: 0,
      available: false,
    };
  }

  const lower = text.toLowerCase();
  const list = language === 'en' ? SLOP_LIST_EN : [...SLOP_LIST_FR, ...SLOP_LIST_EN];

  let matchesCount = 0;
  const matchedPhrases: string[] = [];

  for (const slop of list) {
    let pos = 0;
    while ((pos = lower.indexOf(slop, pos)) !== -1) {
      matchesCount++;
      if (!matchedPhrases.includes(slop)) {
        matchedPhrases.push(slop);
      }
      pos += slop.length;
    }
  }

  // Densité de slop pour 1000 mots
  const density = (matchesCount / wordCount) * 1000;

  // Humain: < 1.5 matches / 1000 mots | IA: > 4.5 matches / 1000 mots
  let aiProb = Math.min(1, Math.max(0, (density - 1.0) / 4.0));

  const ms = Math.round(performance.now() - start);

  const rawSummary = matchedPhrases.length > 0
    ? `${matchesCount} occurrence(s) (${matchedPhrases.slice(0, 3).join(', ')}${matchedPhrases.length > 3 ? '…' : ''})`
    : 'Aucune collocation IA typique détectée';

  return {
    id: 'd6',
    name: 'AI-isms (Slop list)',
    value: Math.round(aiProb * 100) / 100,
    weight,
    contribution: Math.round(aiProb * weight * 100),
    raw: rawSummary,
    ms,
    available: true,
  };
}

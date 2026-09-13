import { splitSentences, countWords } from '../extract/normalize';

/**
 * Étape H2 — Restructuration & Restauration de la Burstiness
 * - Fractionnement des phrases trop longues (> 30 mots)
 * - Fusion des phrases très courtes consécutives (< 6 mots)
 * - Suppression des connecteurs de transition redondants
 */

const REDUNDANT_CONNECTORS_FR = [
  /^(?:De plus|En outre|Par ailleurs|Qui plus est|D'autre part),\s*/i,
  /^(?:Il est à noter que|Il convient d'ajouter que)\s*/i,
];

const REDUNDANT_CONNECTORS_EN = [
  /^(?:Furthermore|Moreover|In addition|Additionally),\s*/i,
  /^(?:It should be noted that|It is worth mentioning that)\s*/i,
];

export function restructureSentences(text: string, language: 'fr' | 'en' | 'unknown' = 'fr'): string {
  const rawSentences = splitSentences(text);
  if (rawSentences.length === 0) return text;

  const connectorList = language === 'en' ? REDUNDANT_CONNECTORS_EN : REDUNDANT_CONNECTORS_FR;

  const processedSentences: string[] = [];

  for (const s of rawSentences) {
    let cleanSentence = s.trim();

    // 1. Nettoyage des connecteurs de tête artificiels
    for (const pattern of connectorList) {
      if (pattern.test(cleanSentence)) {
        cleanSentence = cleanSentence.replace(pattern, '');
        // Remettre la 1ère lettre en majuscule
        if (cleanSentence.length > 0) {
          cleanSentence = cleanSentence.charAt(0).toUpperCase() + cleanSentence.slice(1);
        }
      }
    }

    const words = countWords(cleanSentence);

    // 2. Fractionnement des phrases trop longues (> 30 mots) aux conjonctions
    if (words > 28) {
      const splitPoint = findNaturalSplitPoint(cleanSentence);
      if (splitPoint) {
        processedSentences.push(splitPoint[0]);
        processedSentences.push(splitPoint[1]);
        continue;
      }
    }

    processedSentences.push(cleanSentence);
  }

  // 3. Fusion des phrases très courtes consécutives (< 6 mots)
  const mergedSentences: string[] = [];
  let i = 0;
  while (i < processedSentences.length) {
    const current = processedSentences[i] || '';
    const next = processedSentences[i + 1] || '';

    if (countWords(current) < 6 && countWords(next) < 8 && next.length > 0) {
      // Fusionner avec virgule ou conjonction naturelle
      const merged = `${current.replace(/[.!?…]+$/, '')}, et ${next.charAt(0).toLowerCase() + next.slice(1)}`;
      mergedSentences.push(merged);
      i += 2;
    } else {
      mergedSentences.push(current);
      i++;
    }
  }

  return mergedSentences.join(' ');
}

function findNaturalSplitPoint(sentence: string): [string, string] | null {
  // Recherche de conjonctions médianes naturelles
  const markers = [
    { target: ', car ', replace: '. Car ' },
    { target: ', mais ', replace: '. Mais ' },
    { target: ', alors que ', replace: '. Alors que ' },
    { target: '; ', replace: '. ' },
  ];

  for (const m of markers) {
    const idx = sentence.indexOf(m.target);
    if (idx > 25 && idx < sentence.length - 25) {
      const part1 = sentence.slice(0, idx) + '.';
      const rawPart2 = sentence.slice(idx + m.target.length);
      const part2 = m.replace + rawPart2;
      return [part1.trim(), part2.trim()];
    }
  }

  return null;
}

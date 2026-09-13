import { SignalResult } from './types';

export interface PlagiarismResult extends SignalResult {
  simhash: string;
  minhashSignatures: number[];
  duplicateRatio: number;
  longestDuplicateSpan: number;
  matchedBoilerplateCount: number;
}

/**
 * Hachage 32-bit pour n-grams
 */
function hash32(str: string, seed: number = 0): number {
  let h = seed ^ 0xdeadbeef;
  for (let i = 0; i < str.length; i++) {
    h = Math.imul(h ^ str.charCodeAt(i), 2654435761);
  }
  return (h ^ (h >>> 16)) >>> 0;
}

/**
 * Calcul du SimHash 64-bit sous forme de chaîne hexadécimale de 16 caractères
 */
export function computeSimHash64(text: string): string {
  const words = text
    .toLowerCase()
    .replace(/[^\w\s\u00C0-\u017F]/g, ' ')
    .split(/\s+/)
    .filter((w) => w.length > 2);

  if (words.length === 0) return '0000000000000000';

  const v: number[] = new Array<number>(64).fill(0);

  // Évaluation des 3-grams et des mots
  for (let i = 0; i < words.length; i++) {
    const word = words[i]!;
    const h1 = hash32(word, 1);
    const h2 = hash32(word, 2);

    for (let bit = 0; bit < 32; bit++) {
      if ((h1 >>> bit) & 1) {
        v[bit] = (v[bit] ?? 0) + 1;
      } else {
        v[bit] = (v[bit] ?? 0) - 1;
      }
    }
    for (let bit = 0; bit < 32; bit++) {
      const idx = 32 + bit;
      if ((h2 >>> bit) & 1) {
        v[idx] = (v[idx] ?? 0) + 1;
      } else {
        v[idx] = (v[idx] ?? 0) - 1;
      }
    }
  }

  // Construction de l'empreinte 64-bit
  let high = 0;
  let low = 0;
  for (let i = 0; i < 32; i++) {
    if ((v[i] ?? 0) > 0) high |= 1 << (31 - i);
  }
  for (let i = 0; i < 32; i++) {
    if ((v[32 + i] ?? 0) > 0) low |= 1 << (31 - i);
  }

  const hexHigh = (high >>> 0).toString(16).padStart(8, '0');
  const hexLow = (low >>> 0).toString(16).padStart(8, '0');
  return hexHigh + hexLow;
}

/**
 * Calcule la distance de Hamming entre deux SimHashes 64-bit
 */
export function computeHammingDistance(hashA: string, hashB: string): number {
  if (hashA.length !== 16 || hashB.length !== 16) return 64;

  let dist = 0;
  for (let i = 0; i < 4; i++) {
    const chunkA = parseInt(hashA.slice(i * 4, (i + 1) * 4), 16);
    const chunkB = parseInt(hashB.slice(i * 4, (i + 1) * 4), 16);
    let xor = chunkA ^ chunkB;
    while (xor > 0) {
      dist += xor & 1;
      xor >>>= 1;
    }
  }
  return dist;
}

/**
 * Calcul du MinHash (32 fonctions de hachage) pour approximation Jaccard
 */
export function computeMinHash(shingles: string[], numHashes: number = 32): number[] {
  if (shingles.length === 0) return new Array(numHashes).fill(0);

  const sigs = new Array(numHashes).fill(0xffffffff);
  for (const shingle of shingles) {
    for (let i = 0; i < numHashes; i++) {
      const h = hash32(shingle, i * 7919 + 31);
      if (h < sigs[i]) {
        sigs[i] = h;
      }
    }
  }
  return sigs;
}

/**
 * Liste de structures types / templates de prompt et réponses IA dupliquées
 */
const KNOWN_AI_TEMPLATES = [
  'in summary the key takeaways are as follows',
  'in conclusion it is important to remember that',
  'as an ai language model i do not have',
  'here is a breakdown of the pros and cons',
  'it is worth noting that while some argue',
  'delving into the intricacies of this multifaceted topic',
  'en conclusion il convient de souligner que',
  'en résumé voici les points clés à retenir',
  'il est essentiel de noter que dans ce contexte',
];

/**
 * Détection de plagiat de templates IA et duplications internes
 */
export function computePlagiarismScore(text: string, weight: number = 0.05): PlagiarismResult {
  const startTime = performance.now();
  const lower = text.toLowerCase();

  const words = lower
    .replace(/[^\w\s\u00C0-\u017F]/g, ' ')
    .split(/\s+/)
    .filter((w) => w.length > 0);

  // 1. Calcul du SimHash
  const simhash = computeSimHash64(text);

  // 2. Shingling 4-grams
  const shingles: string[] = [];
  for (let i = 0; i <= words.length - 4; i++) {
    shingles.push(words.slice(i, i + 4).join(' '));
  }
  const minhashSignatures = computeMinHash(shingles, 32);

  // 3. Détection de répétition interne
  const uniqueShingles = new Set(shingles);
  const duplicateRatio = shingles.length > 0 ? 1 - uniqueShingles.size / shingles.length : 0;

  // 4. Détection de phrases / templates génératifs connus
  let matchedBoilerplateCount = 0;
  for (const template of KNOWN_AI_TEMPLATES) {
    if (lower.includes(template)) {
      matchedBoilerplateCount++;
    }
  }

  // 5. Recherche de la plus longue répétition exacte
  let longestDuplicateSpan = 0;
  const seenSequences = new Map<string, number>();
  for (let len = 5; len <= 12; len++) {
    for (let i = 0; i <= words.length - len; i++) {
      const seq = words.slice(i, i + len).join(' ');
      if (seenSequences.has(seq)) {
        longestDuplicateSpan = Math.max(longestDuplicateSpan, len);
      } else {
        seenSequences.set(seq, 1);
      }
    }
  }

  let aiScore = 0.1;
  if (matchedBoilerplateCount > 0) {
    aiScore += matchedBoilerplateCount * 0.25;
  }
  if (duplicateRatio > 0.15) {
    aiScore += duplicateRatio * 0.8;
  }
  if (longestDuplicateSpan >= 8) {
    aiScore += 0.2;
  }
  const boundedValue = Math.min(1.0, Math.max(0.05, aiScore));
  const ms = Math.round(performance.now() - startTime);

  return {
    id: 'd10',
    name: 'Plagiat & templates IA',
    value: Math.round(boundedValue * 100) / 100,
    weight,
    contribution: Math.round(boundedValue * weight * 100),
    raw: `SimHash: ${simhash}, répétition: ${(duplicateRatio * 100).toFixed(1)}%, templates: ${matchedBoilerplateCount}`,
    ms,
    available: words.length >= 15,
    simhash,
    minhashSignatures,
    duplicateRatio,
    longestDuplicateSpan,
    matchedBoilerplateCount,
  };
}

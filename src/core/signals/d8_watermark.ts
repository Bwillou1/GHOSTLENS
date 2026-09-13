import { SignalResult } from './types';

export interface WatermarkResult extends SignalResult {
  zScore: number;
  pValue: number;
  greenCount: number;
  totalTokens: number;
  greenRatio: number;
  isWatermarked: boolean;
  detectedScheme: 'kgw' | 'unigram' | 'sweet' | 'none';
  extractedPayload?: string;
}

/**
 * Fonction de hachage simple 32-bit (Murmur-like / FNV-1a)
 */
function hashString(str: string): number {
  let hash = 2166136261;
  for (let i = 0; i < str.length; i++) {
    hash ^= str.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

/**
 * Pseudo-random generator (xorshift32) initialisé par une seed
 */
function pseudoRandom(seed: number): number {
  let x = seed || 1;
  x ^= x << 13;
  x ^= x >>> 17;
  x ^= x << 5;
  return (x >>> 0) / 4294967296;
}

/**
 * Calcule la fonction d'erreur complémentaire (erfc) pour déduire la p-value gaussienne
 */
export function erfc(x: number): number {
  const z = Math.abs(x);
  const t = 1.0 / (1.0 + 0.5 * z);
  const ans =
    t *
    Math.exp(
      -z * z -
        1.26551223 +
        t *
          (1.00002368 +
            t *
              (0.37409196 +
                t *
                  (0.09678418 +
                    t *
                      (-0.18628806 +
                        t *
                          (0.27886807 +
                            t *
                              (-1.13520393 +
                                t *
                                  (1.48851587 +
                                    t * (-0.82215223 + t * 0.17087277))))))))
    );
  return x >= 0 ? ans : 2.0 - ans;
}

/**
 * Détection de filigrane statistique KGW (Kirchenbauer et al., 2023) & SWEET
 * Détermine si le texte suit une règle de partitionnement Green/Red pseudo-aléatoire.
 */
export function computeWatermarkScore(
  text: string,
  gamma: number = 0.5,
  windowSize: number = 1,
  weight: number = 0.10
): WatermarkResult {
  const startTime = performance.now();

  const tokens = text
    .toLowerCase()
    .replace(/[^\w\s\u00C0-\u017F]/g, ' ')
    .split(/\s+/)
    .filter((t) => t.length > 0);

  const T = tokens.length;
  if (T < 25) {
    return {
      id: 'd8',
      name: 'Filigrane statistique (KGW/SWEET)',
      value: 0.5,
      weight,
      contribution: 0,
      raw: 'Texte trop court pour analyse statistique de filigrane (min 25 tokens)',
      ms: Math.round(performance.now() - startTime),
      available: false,
      zScore: 0,
      pValue: 1.0,
      greenCount: 0,
      totalTokens: T,
      greenRatio: 0.5,
      isWatermarked: false,
      detectedScheme: 'none',
    };
  }

  let greenCount = 0;
  const payloadBits: number[] = [];

  for (let i = windowSize; i < T; i++) {
    const currentToken = tokens[i]!;
    const context = tokens.slice(i - windowSize, i).join(' ');
    const seed = hashString(context);

    const tokenHash = hashString(`${seed}_${currentToken}`);
    const rand = pseudoRandom(tokenHash);

    if (rand < gamma) {
      greenCount++;
      payloadBits.push(1);
    } else {
      payloadBits.push(0);
    }
  }

  const effectiveT = T - windowSize;
  const expectedGreen = gamma * effectiveT;
  const variance = effectiveT * gamma * (1 - gamma);
  const stdDev = Math.sqrt(variance);

  const zScore = stdDev > 0 ? (greenCount - expectedGreen) / stdDev : 0;
  const pValue = 0.5 * erfc(zScore / Math.SQRT2);
  const greenRatio = effectiveT > 0 ? greenCount / effectiveT : 0.5;

  const isWatermarked = zScore > 3.0;

  let aiScore = 0.5;
  if (zScore <= 0) {
    aiScore = Math.max(0.05, 0.5 + zScore * 0.1);
  } else {
    aiScore = 1 / (1 + Math.exp(-1.2 * (zScore - 2.0)));
  }

  let extractedPayload: string | undefined;
  if (isWatermarked && payloadBits.length >= 16) {
    const bytes: number[] = [];
    for (let b = 0; b < Math.min(payloadBits.length - 7, 64); b += 8) {
      let byte = 0;
      for (let bit = 0; bit < 8; bit++) {
        byte = (byte << 1) | payloadBits[b + bit]!;
      }
      if (byte >= 32 && byte <= 126) {
        bytes.push(byte);
      }
    }
    if (bytes.length >= 2) {
      extractedPayload = String.fromCharCode(...bytes);
    }
  }

  const boundedValue = Math.min(1, Math.max(0, aiScore));
  const ms = Math.round(performance.now() - startTime);

  return {
    id: 'd8',
    name: 'Filigrane statistique (KGW/SWEET)',
    value: Math.round(boundedValue * 100) / 100,
    weight,
    contribution: Math.round(boundedValue * weight * 100),
    raw: `z-score: ${zScore.toFixed(2)}, p-val: ${pValue.toExponential(2)}, ratio vert: ${(greenRatio * 100).toFixed(1)}%`,
    ms,
    available: true,
    zScore,
    pValue,
    greenCount,
    totalTokens: effectiveT,
    greenRatio,
    isWatermarked,
    detectedScheme: isWatermarked ? 'kgw' : 'none',
    extractedPayload,
  };
}

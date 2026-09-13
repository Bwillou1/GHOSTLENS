/**
 * Sous-module I2 — Analyse Fréquentielle & Marques Invisibles (2D DCT)
 * Détection des artefacts de grille des modèles de diffusion et GAN dans les hautes fréquences.
 */

export interface FrequencyAnalysisResult {
  artifactScore: number; // 0..1
  highFreqEnergyRatio: number;
  hasGridArtifact: boolean;
  spectralWhiteness: number;
  ms: number;
}

/**
 * Calcul de la DCT-II 1D pour 8 éléments
 */
function dct8(input: number[]): number[] {
  const output = new Array<number>(8).fill(0);
  const N = 8;
  for (let k = 0; k < N; k++) {
    let sum = 0;
    for (let n = 0; n < N; n++) {
      sum += (input[n] ?? 0) * Math.cos((Math.PI / N) * (n + 0.5) * k);
    }
    const alpha = k === 0 ? Math.sqrt(1 / N) : Math.sqrt(2 / N);
    output[k] = alpha * sum;
  }
  return output;
}

/**
 * Analyse spectrale d'un buffer de pixels (RGBA) extrait d'un canvas
 */
export function analyzeFrequencyArtifacts(
  pixels: Uint8ClampedArray | number[],
  width: number,
  height: number
): FrequencyAnalysisResult {
  const start = performance.now();

  if (width < 16 || height < 16) {
    return {
      artifactScore: 0.5,
      highFreqEnergyRatio: 0,
      hasGridArtifact: false,
      spectralWhiteness: 0,
      ms: 0,
    };
  }

  // Échantillonnage de blocs 8x8 en luminance (Y = 0.299R + 0.587G + 0.114B)
  const blocksX = Math.min(8, Math.floor(width / 8));
  const blocksY = Math.min(8, Math.floor(height / 8));

  let totalDcEnergy = 0;
  let totalHighFreqEnergy = 0;
  let fineCoefficientVariance = 0;

  for (let by = 0; by < blocksY; by++) {
    for (let bx = 0; bx < blocksX; bx++) {
      // Extraire bloc 8x8
      const block: number[][] = [];
      for (let y = 0; y < 8; y++) {
        const row: number[] = [];
        for (let x = 0; x < 8; x++) {
          const pxIdx = ((by * 8 + y) * width + (bx * 8 + x)) * 4;
          const r = pixels[pxIdx] ?? 0;
          const g = pixels[pxIdx + 1] ?? 0;
          const b = pixels[pxIdx + 2] ?? 0;
          const lum = (0.299 * r) + (0.587 * g) + (0.114 * b);
          row.push(lum);
        }
        // DCT sur les lignes
        block.push(dct8(row));
      }

      // DCT sur les colonnes
      const finalDct: number[][] = [];
      for (let x = 0; x < 8; x++) {
        const col: number[] = [];
        for (let y = 0; y < 8; y++) {
          col.push(block[y]?.[x] ?? 0);
        }
        const colDct = dct8(col);
        finalDct.push(colDct);
      }

      // Mesure de l'énergie DC vs High-Freq (coins supérieurs droits et inférieurs)
      const dc = Math.abs(finalDct[0]?.[0] ?? 0);
      totalDcEnergy += dc;

      let highSum = 0;
      for (let y = 4; y < 8; y++) {
        for (let x = 4; x < 8; x++) {
          const val = Math.abs(finalDct[x]?.[y] ?? 0);
          highSum += val;
        }
      }
      totalHighFreqEnergy += highSum;
      fineCoefficientVariance += Math.pow(highSum / 16, 2);
    }
  }

  const numBlocks = Math.max(1, blocksX * blocksY);
  const avgHighRatio = totalDcEnergy > 0 ? (totalHighFreqEnergy / totalDcEnergy) : 0;
  const varianceNorm = Math.sqrt(fineCoefficientVariance / numBlocks);

  // Les images IA de diffusion présentent un ratio haute fréquence anomalement élevé
  // et des pics périodiques liés aux upscalers de convolution / grilles de latents
  const hasGridArtifact = avgHighRatio > 0.18 || varianceNorm > 12.0;
  const artifactScore = Math.min(1.0, Math.max(0.0, (avgHighRatio * 3.5) + (varianceNorm / 30.0)));

  const ms = Math.max(1, Math.round(performance.now() - start));

  return {
    artifactScore: Math.round(artifactScore * 100) / 100,
    highFreqEnergyRatio: Math.round(avgHighRatio * 1000) / 1000,
    hasGridArtifact,
    spectralWhiteness: Math.round(varianceNorm * 10) / 10,
    ms,
  };
}

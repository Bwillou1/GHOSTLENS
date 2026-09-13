import { ImageResult } from '../signals/types';
import { analyzeImageMetadata } from './c2pa';
import { analyzeFrequencyArtifacts } from './freq';
import { classifyImageBuffer } from './classify';

/**
 * Pipeline d'analyse d'image complet I1 + I2 + I3 -> I4 (§7)
 */
export async function analyzeImage(
  url: string,
  pixels: Uint8ClampedArray | number[],
  width: number,
  height: number,
  altText?: string,
  srcElementId?: string
): Promise<ImageResult> {
  // I1 — Métadonnées & C2PA
  const i1 = analyzeImageMetadata(url, altText);

  // I2 — Analyse fréquentielle DCT
  const i2 = analyzeFrequencyArtifacts(pixels, width, height);

  // I3 — Classifieur vision ONNX
  const i3 = await classifyImageBuffer(pixels, width, height);

  // I4 — Fusion pondérée des sous-scores images
  // S_img = 100 * (0.35 * I1 + 0.25 * I2 + 0.40 * I3)
  let w1 = 0.35;
  let w2 = 0.25;
  let w3 = 0.40;

  // Si pas de métadonnées discriminantes, redistribution
  if (!i1.isAiGenerated && !i1.hasC2PA) {
    w1 = 0.10;
    w2 = 0.40;
    w3 = 0.50;
  }

  const rawScore = (w1 * i1.score) + (w2 * i2.artifactScore) + (w3 * i3.score);
  const finalScore = Math.round(Math.max(0, Math.min(100, rawScore * 100)));

  const tags: string[] = [...i1.rawTags];
  if (i2.artifactScore >= 0.6 || i2.hasGridArtifact) {
    tags.push('Marque invisible / Artefact de grille probable');
  }
  if (i1.generator) {
    tags.push(`C2PA : ${i1.generator}`);
  }

  return {
    url,
    srcElementId,
    score: finalScore,
    tags,
    c2pa: {
      present: i1.hasC2PA,
      generator: i1.generator,
      isAi: i1.isAiGenerated,
    },
    freqArtifactScore: i2.artifactScore,
    classifierScore: i3.score,
  };
}

/**
 * Injecte une mini-pilule sur une image dans le DOM de la page
 */
export function injectImageBadge(imgElement: HTMLImageElement, imageResult: ImageResult): void {
  // Vérifier dimensions minimales (>= 64x64 px)
  if (imgElement.naturalWidth < 64 || imgElement.naturalHeight < 64) return;

  const existingBadge = imgElement.parentElement?.querySelector('.__gl_img_badge');
  if (existingBadge) existingBadge.remove();

  const badgeWrapper = document.createElement('div');
  badgeWrapper.className = '__gl_img_badge';
  const shadow = badgeWrapper.attachShadow({ mode: 'closed' });

  const isAi = imageResult.score >= 60;
  const color = isAi ? '#dc2626' : (imageResult.score >= 30 ? '#eab308' : '#16a34a');
  const label = isAi ? `${imageResult.score}% IA` : `${imageResult.score}%`;

  shadow.innerHTML = `
    <style>
      :host {
        position: absolute;
        top: 6px;
        right: 6px;
        z-index: 10000;
        pointer-events: auto;
      }
      .pill {
        display: flex;
        align-items: center;
        gap: 4px;
        padding: 3px 8px;
        border-radius: 999px;
        background: rgba(15, 23, 42, 0.88);
        border: 1px solid ${color};
        color: #f8fafc;
        font-size: 10px;
        font-weight: 600;
        font-family: system-ui, sans-serif;
        box-shadow: 0 2px 6px rgba(0,0,0,0.3);
        cursor: pointer;
        backdrop-filter: blur(8px);
      }
    </style>
    <div class="pill" title="GhostLens : Image analysée (${imageResult.score}%) — ${imageResult.tags.join(', ')}">
      <span>👁️ ${label}</span>
    </div>
  `;

  // Positionner en conteneur relatif
  if (imgElement.parentElement && getComputedStyle(imgElement.parentElement).position === 'static') {
    imgElement.parentElement.style.position = 'relative';
  }
  imgElement.parentElement?.appendChild(badgeWrapper);
}

/**
 * Sous-module I1 — Analyse Métadonnées & C2PA Content Credentials
 * Analyse locale des en-têtes EXIF, ICC et détection des signatures de générateurs d'images IA
 * (DALL-E, Midjourney, Stable Diffusion, Imagen, Adobe Firefly).
 */

export interface C2PAMetadataResult {
  hasC2PA: boolean;
  generator?: string;
  isAiGenerated: boolean;
  rawTags: string[];
  score: number; // 0..1 (1 = IA prouvée, 0 = Humain/Inconnu)
}

const AI_GENERATOR_SIGNATURES: Array<{ name: string; pattern: RegExp }> = [
  { name: 'Midjourney', pattern: /midjourney|mj_/i },
  { name: 'DALL·E', pattern: /dall[-·]?e|openai/i },
  { name: 'Stable Diffusion', pattern: /stable diffusion|automatic1111|comfyui|novelai/i },
  { name: 'Google Imagen', pattern: /imagen|google deepmind/i },
  { name: 'Adobe Firefly', pattern: /adobe firefly|generative fill/i },
  { name: 'Flux', pattern: /flux\.1|black forest labs/i },
];

/**
 * Analyse les métadonnées brutes d'une image ou son URL/attributs
 */
export function analyzeImageMetadata(src: string, altText?: string, exifString?: string): C2PAMetadataResult {
  const combined = `${src} ${altText || ''} ${exifString || ''}`.toLowerCase();
  const rawTags: string[] = [];

  let isAi = false;
  let detectedGenerator: string | undefined;

  for (const gen of AI_GENERATOR_SIGNATURES) {
    if (gen.pattern.test(combined)) {
      isAi = true;
      detectedGenerator = gen.name;
      rawTags.push(`Générateur détecté : ${gen.name}`);
      break;
    }
  }

  // Détection d'assertion C2PA / Content Credentials
  const hasC2PA = combined.includes('c2pa') || combined.includes('content credentials');
  if (hasC2PA) {
    rawTags.push('C2PA Content Credentials');
  }

  const score = isAi ? 1.0 : (hasC2PA ? 0.2 : 0.0);

  return {
    hasC2PA,
    generator: detectedGenerator,
    isAiGenerated: isAi,
    rawTags,
    score,
  };
}

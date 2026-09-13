import { describe, it, expect } from 'vitest';
import { analyzeImageMetadata } from '@/src/core/images/c2pa';
import { analyzeFrequencyArtifacts } from '@/src/core/images/freq';
import { classifyImageBuffer } from '@/src/core/images/classify';
import { analyzeImage } from '@/src/core/images/pipeline';

describe('Module Détection d\'Images IA (I1 à I4)', () => {
  it('I1 (Métadonnées) : détecte les signatures de générateurs (Midjourney, DALL-E) et C2PA', () => {
    const mjRes = analyzeImageMetadata('https://cdn.discordapp.com/attachments/123/midjourney_render_upscaled.png');
    expect(mjRes.isAiGenerated).toBe(true);
    expect(mjRes.generator).toBe('Midjourney');
    expect(mjRes.score).toBe(1.0);

    const normalRes = analyzeImageMetadata('https://example.com/family_vacation_photo.jpg');
    expect(normalRes.isAiGenerated).toBe(false);
    expect(normalRes.score).toBe(0.0);
  });

  it('I2 (Fréquence DCT) : calcule l\'énergie haute fréquence et les artefacts de grille', () => {
    // Créer un buffer de pixels synthétique 64x64
    const pixels = new Uint8ClampedArray(64 * 64 * 4);
    for (let i = 0; i < pixels.length; i += 4) {
      pixels[i] = (i % 256); // R
      pixels[i + 1] = (i % 128); // G
      pixels[i + 2] = 200; // B
      pixels[i + 3] = 255; // A
    }

    const freqRes = analyzeFrequencyArtifacts(pixels, 64, 64);
    expect(freqRes.artifactScore).toBeGreaterThanOrEqual(0);
    expect(freqRes.artifactScore).toBeLessThanOrEqual(1);
    expect(freqRes.ms).toBeGreaterThanOrEqual(0);
  });

  it('I3 (Classifieur Visuel) : analyse les gradients et renvoie un score', async () => {
    const pixels = new Uint8ClampedArray(64 * 64 * 4).fill(128);
    const classRes = await classifyImageBuffer(pixels, 64, 64);
    expect(classRes.score).toBeGreaterThanOrEqual(0);
    expect(classRes.score).toBeLessThanOrEqual(1);
    expect(classRes.confidence).toBe(0.85);
  });

  it('I4 (Fusion Image) : calcule le score agrégé et génère les tags appropriés', async () => {
    const pixels = new Uint8ClampedArray(64 * 64 * 4);
    const res = await analyzeImage(
      'https://example.com/dalle3_generated_art.png',
      pixels,
      64,
      64,
      'A futuristic city generated with DALL-E'
    );

    expect(res.score).toBeGreaterThan(60);
    expect(res.tags.some((t) => t.includes('DALL·E'))).toBe(true);
    expect(res.c2pa?.isAi).toBe(true);
  });
});

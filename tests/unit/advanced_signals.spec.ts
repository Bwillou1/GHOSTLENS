import { describe, it, expect } from 'vitest';
import { JSDOM } from 'jsdom';
import { computeWatermarkScore, erfc } from '@/src/core/signals/d8_watermark';
import { computeSimHash64, computeHammingDistance, computePlagiarismScore } from '@/src/core/signals/d10_plagiarism';
import { analyzeVibeCodedDOM } from '@/src/core/signals/d11_vibecoded';

describe('Signaux Avancés (P7 & P8)', () => {
  describe('D8 — Watermarking & Statistique KGW/SWEET', () => {
    it('calcule la fonction erfc correctement', () => {
      expect(erfc(0)).toBeCloseTo(1.0, 3);
      expect(erfc(1.0)).toBeCloseTo(0.157, 2);
      expect(erfc(3.0)).toBeCloseTo(0.000022, 5);
    });

    it('gère les textes courts avec une disponibilité fausse', () => {
      const short = 'Court texte.';
      const res = computeWatermarkScore(short);
      expect(res.name).toBe('Filigrane statistique (KGW/SWEET)');
      expect(res.isWatermarked).toBe(false);
      expect(res.available).toBe(false);
    });

    it('analyse un texte standard sans faux positif de filigrane', () => {
      const naturalText = `
        Les forêts boréales constituent l'un des plus grands écosystèmes terrestres de la planète.
        Elles abritent une diversité biologique impressionnante et jouent un rôle écologique déterminant
        dans le cycle du carbone global. De nombreux chercheurs étudient l'impact du changement climatique
        sur ces zones septentrionales afin de préserver la faune et la flore locales.
      `;
      const res = computeWatermarkScore(naturalText);
      expect(res.totalTokens).toBeGreaterThan(20);
      expect(res.zScore).toBeDefined();
      expect(res.pValue).toBeGreaterThan(0);
    });
  });

  describe('D10 — Plagiarism, SimHash & Templates', () => {
    it('génère des SimHashes identiques pour le même texte', () => {
      const text = 'GhostLens protège les utilisateurs contre le contenu généré automatiquement par IA.';
      const hash1 = computeSimHash64(text);
      const hash2 = computeSimHash64(text);
      expect(hash1).toBe(hash2);
      expect(hash1.length).toBe(16);
      expect(computeHammingDistance(hash1, hash2)).toBe(0);
    });

    it('calcule une distance de Hamming faible pour des textes quasi-identiques', () => {
      const text1 = 'GhostLens protège les utilisateurs contre le contenu généré automatiquement par intelligence artificielle.';
      const text2 = 'GhostLens protège les internautes contre le contenu généré automatiquement par intelligence artificielle.';
      const hash1 = computeSimHash64(text1);
      const hash2 = computeSimHash64(text2);
      const dist = computeHammingDistance(hash1, hash2);
      expect(dist).toBeLessThanOrEqual(15);
    });

    it('détecte les templates génératifs connus', () => {
      const textWithTemplate = `
        As an AI language model I do not have personal opinions.
        In summary the key takeaways are as follows for the modern developer ecosystem.
      `;
      const res = computePlagiarismScore(textWithTemplate);
      expect(res.matchedBoilerplateCount).toBeGreaterThanOrEqual(1);
      expect(res.value).toBeGreaterThan(0.3);
    });
  });

  describe('D11 — Détecteur Vibe-Coded & Landing Pages IA', () => {
    it('détecte un site créé avec v0 et des classes Tailwind', () => {
      const dom = new JSDOM(`
        <html>
          <head><title>Awesome AI App</title></head>
          <body>
            <div data-v0="true" class="flex flex-col items-center justify-center min-h-screen bg-slate-900 text-white p-8">
              <h1 class="text-4xl font-bold mb-4">Supercharge your workflow</h1>
              <p class="text-lg text-slate-400 max-w-xl text-center">
                Revolutionize the way you work with our cutting-edge AI tools.
              </p>
              <button class="mt-6 px-6 py-3 bg-blue-600 rounded-lg shadow-lg hover:bg-blue-500 transition-colors">
                Get Started
              </button>
            </div>
          </body>
        </html>
      `);
      const res = analyzeVibeCodedDOM(dom.window.document);
      expect(res.name).toBe('Empreinte Vibe-Coded & Landing IA');
      expect(res.detectedGenerators).toContain('v0 (Vercel)');
      expect(res.genericPlaceholderCount).toBeGreaterThanOrEqual(2);
      expect(res.isVibeCoded).toBe(true);
      expect(res.value).toBeGreaterThanOrEqual(0.7);
    });

    it('attribue un score bas à un document HTML standard et naturel', () => {
      const dom = new JSDOM(`
        <html>
          <head><title>Documentation Technique</title></head>
          <body>
            <main>
              <h1>Introduction au protocole TCP/IP</h1>
              <p>Le protocole TCP garantit la remise ordonnée et fiable des paquets d'informations à travers le réseau.</p>
            </main>
          </body>
        </html>
      `);
      const res = analyzeVibeCodedDOM(dom.window.document);
      expect(res.detectedGenerators.length).toBe(0);
      expect(res.genericPlaceholderCount).toBe(0);
      expect(res.isVibeCoded).toBe(false);
      expect(res.value).toBeLessThan(0.4);
    });
  });
});

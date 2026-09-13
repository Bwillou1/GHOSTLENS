import { describe, it, expect } from 'vitest';
import { computeD1Deep } from '@/src/core/signals/d1_deep';
import { computeD2FastText } from '@/src/core/signals/d2_fasttext';
import { computeD3Compression } from '@/src/core/signals/d3_compression';
import { computeD4Burstiness } from '@/src/core/signals/d4_burstiness';
import { computeD5TextStats } from '@/src/core/signals/d5_stats';
import { computeD6Slop } from '@/src/core/signals/d6_slop';
import { computeD7Patterns } from '@/src/core/signals/d7_patterns';

describe('Signaux de Détection (D1 à D7)', () => {
  const AI_SAMPLE_FR = `
    Dans un monde en constante évolution, l'intelligence artificielle joue un rôle crucial dans la transformation numérique de notre société.
    Il est important de noter que cette technologie représente un tournant décisif pour repousser les limites de la créativité.
    Ce n'est pas seulement un outil puissant, mais aussi un catalyseur d'innovation pour naviguer dans la complexité du paysage moderne.
    En outre, il convient de souligner que les architectures modernes apportent une synergie harmonieuse et polyvalente.
    En conclusion, l'adoption de ces solutions constitue une pierre angulaire indispensable pour l'avenir.
  `;

  const HUMAN_SAMPLE_FR = `
    Hier soir, j'ai bricolé un script en bash pour trier mes photos de vacances.
    Ça ramait un peu au début avec les fichiers RAW de 50 Mo, alors j'ai rajouté du parallélisme avec xargs.
    Franchement, le résultat est bluffant : 15 000 photos traitées en moins de deux minutes sur mon vieux portable.
    Par contre, j'ai oublié de gérer les espaces dans les noms de dossiers, ce qui a causé un bug idiot sur trois répertoires. Je corrigerai ça ce week-end autour d'un café.
  `;

  it('D1 (Classifieur Profond) : s\'exécute et agrège les probabilités par lots de tokens', async () => {
    const aiRes = await computeD1Deep(AI_SAMPLE_FR, 'fr');
    const humanRes = await computeD1Deep(HUMAN_SAMPLE_FR, 'fr');
    expect(aiRes.available).toBe(true);
    expect(humanRes.available).toBe(true);
    expect(aiRes.value).toBeGreaterThan(0.5);
    expect(humanRes.value).toBeLessThan(0.6);
  });

  it('D2 (fastText supervisé) : extrait les n-grams responsables et calcule P(AI)', () => {
    const aiRes = computeD2FastText(AI_SAMPLE_FR, 'fr');
    const humanRes = computeD2FastText(HUMAN_SAMPLE_FR, 'fr');
    expect(aiRes.available).toBe(true);
    expect(humanRes.available).toBe(true);
    expect(aiRes.value).toBeGreaterThan(0.5);
    expect(humanRes.value).toBeLessThan(0.5);
    expect(aiRes.topNGrams.length).toBeGreaterThan(0);
    expect(aiRes.raw).toContain('Top n-grams');
  });

  it('D3 (Compression) : doit être borné entre 0 et 1 et disponible sur texte suffisant', () => {
    const res = computeD3Compression(AI_SAMPLE_FR);
    expect(res.available).toBe(true);
    expect(res.value).toBeGreaterThanOrEqual(0);
    expect(res.value).toBeLessThanOrEqual(1);
    expect(res.ms).toBeGreaterThanOrEqual(0);
  });

  it('D4 (Burstiness) : le texte humain doit avoir une variance plus forte (score IA plus faible) que le texte IA calibré', () => {
    const aiRes = computeD4Burstiness(AI_SAMPLE_FR);
    const humanRes = computeD4Burstiness(HUMAN_SAMPLE_FR);
    expect(aiRes.available).toBe(true);
    expect(humanRes.available).toBe(true);
    expect(aiRes.value).toBeGreaterThanOrEqual(humanRes.value);
  });

  it('D5 (Statistiques lexicales) : calcule le TTR, Hapax et Flesch', () => {
    const res = computeD5TextStats(AI_SAMPLE_FR);
    expect(res.available).toBe(true);
    expect(res.raw).toContain('TTR:');
    expect(res.raw).toContain('Hapax:');
  });

  it('D6 (Slop List) : détecte les collocations IA typiques avec un score élevé', () => {
    const aiRes = computeD6Slop(AI_SAMPLE_FR, 'fr');
    const humanRes = computeD6Slop(HUMAN_SAMPLE_FR, 'fr');
    expect(aiRes.value).toBeGreaterThan(0.5);
    expect(humanRes.value).toBeLessThan(0.3);
  });

  it('D7 (Patterns Rhétoriques) : détecte les constructions « Pas X mais Y », ouvertures et conclusions formatées', () => {
    const aiRes = computeD7Patterns(AI_SAMPLE_FR);
    const humanRes = computeD7Patterns(HUMAN_SAMPLE_FR);
    expect(aiRes.value).toBeGreaterThan(0.4);
    expect(humanRes.value).toBeLessThan(0.2);
  });
});

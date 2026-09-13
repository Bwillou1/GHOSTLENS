import { describe, it, expect } from 'vitest';
import { humanizeTextPipeline } from '@/src/core/humanizer/pipeline';
import { extractFacts, verifyFactualIntegrity, computeSemanticSimilarity, generateWordDiff } from '@/src/core/humanizer/verify';

describe('Humaniseur de Texte (H1 à H5)', () => {
  const AI_TEXT_WITH_FACTS = `
    Dans un monde en constante évolution, l'entreprise Acme Corp a enregistré une croissance de 42% en 2026.
    Il est important de noter que ce résultat représente un tournant décisif pour repousser les limites du marché.
    Ce n'est pas seulement un succès commercial, mais aussi un catalyseur d'innovation pour naviguer dans la complexité actuelle.
    En conclusion, l'investissement de 15 millions d'euros a joué un rôle crucial dans cette réussite.
  `;

  it('Garde-fou factuel : doit extraire et préserver fidèlement les nombres, dates et noms propres', () => {
    const facts = extractFacts(AI_TEXT_WITH_FACTS);
    expect(facts.numbers).toContain('42%');
    expect(facts.numbers).toContain('15');
    expect(facts.dates).toContain('2026');

    const preserved = verifyFactualIntegrity(AI_TEXT_WITH_FACTS, AI_TEXT_WITH_FACTS);
    expect(preserved).toBe(true);

    const corrupted = AI_TEXT_WITH_FACTS.replace('42%', '50%');
    const rejected = verifyFactualIntegrity(AI_TEXT_WITH_FACTS, corrupted);
    expect(rejected).toBe(false);
  });

  it('Similarité sémantique : doit être >= 0.85', () => {
    const textB = AI_TEXT_WITH_FACTS.replace('Dans un monde en constante évolution', 'Aujourd\'hui');
    const sim = computeSemanticSimilarity(AI_TEXT_WITH_FACTS, textB);
    expect(sim).toBeGreaterThanOrEqual(0.85);
  });

  it('Pipeline complet : fait chuter le score IA tout en conservant les faits', async () => {
    const res = await humanizeTextPipeline(AI_TEXT_WITH_FACTS, 'fr');
    expect(res.factualIntegrity).toBe(true);
    expect(res.similarity).toBeGreaterThanOrEqual(0.85);
    expect(res.afterScore).toBeLessThan(res.beforeScore);
    expect(res.humanized).toContain('42%');
    expect(res.humanized).toContain('2026');
  });

  it('Diff visuel : produit des blocs de suppression et d\'insertion', () => {
    const diff = generateWordDiff('mon vieux PC', 'mon nouvel ordinateur');
    expect(diff.some((d) => d.type === 'delete')).toBe(true);
    expect(diff.some((d) => d.type === 'insert')).toBe(true);
  });
});

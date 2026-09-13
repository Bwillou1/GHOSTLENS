import { describe, it, expect } from 'vitest';
import { normalizeText, splitSentences, countWords, detectSimpleLanguage } from '@/src/core/extract/normalize';
import { normalizeHomoglyphs } from '@/src/core/extract/homoglyphs';

describe('Extraction & Normalisation', () => {
  it('doit remapper correctement les homoglyphes Cyrilliques et Grecs vers le latin', () => {
    // 'а' cyrillique (U+0430) vs 'a' latin
    const mixed = 'Cеci еst un tеst аvеc dеs homoglyphеs';
    const cleaned = normalizeHomoglyphs(mixed);
    expect(cleaned).toBe('Ceci est un test avec des homoglyphes');
  });

  it('doit normaliser les espaces multiples et sauts de lignes tout en conservant la ponctuation', () => {
    const raw = '  Voici un   texte  avec   beaucoup d’espaces.  \n\n\n\nEt   un autre paragraphe !  ';
    const norm = normalizeText(raw);
    expect(norm).toBe('Voici un texte avec beaucoup d’espaces.\n\nEt un autre paragraphe !');
  });

  it('doit découper les phrases en conservant la ponctuation finale', () => {
    const text = 'GhostLens est un détecteur d\'IA. Il fonctionne à 100% en local ! Est-ce rapide ? Oui, absolument…';
    const sentences = splitSentences(text);
    expect(sentences.length).toBe(4);
    expect(sentences[0]).toBe('GhostLens est un détecteur d\'IA.');
    expect(sentences[1]).toBe('Il fonctionne à 100% en local !');
    expect(sentences[2]).toBe('Est-ce rapide ?');
    expect(sentences[3]).toBe('Oui, absolument…');
  });

  it('doit compter précisément les mots', () => {
    const text = 'GhostLens protège la véracité du web en temps réel.';
    expect(countWords(text)).toBe(9);
    expect(countWords('')).toBe(0);
  });

  it('doit détecter correctement le français et l\'anglais', () => {
    const fr = 'Dans ce monde en constante évolution, la technologie joue un rôle crucial pour la société.';
    const en = 'In today fast-paced world, artificial intelligence is playing a pivotal role in modern technology.';
    expect(detectSimpleLanguage(fr)).toBe('fr');
    expect(detectSimpleLanguage(en)).toBe('en');
  });
});

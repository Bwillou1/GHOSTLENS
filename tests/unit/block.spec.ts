import { describe, it, expect } from 'vitest';
import { evaluateBlockDecision } from '@/src/core/block/manager';
import { AnalysisResult, DEFAULT_SETTINGS } from '@/src/core/signals/types';

describe('Gestionnaire de Blocage et d\'Exceptions (§9.4)', () => {
  const dummyResult: AnalysisResult = {
    analysisId: 'test-123',
    schema: 'gl/v1',
    score: 88,
    label: 'ai',
    color: '#dc2626',
    confidence: 'high',
    language: 'fr',
    wordCount: 300,
    vibeScore: null,
    blocked: true,
    signals: [],
    sentenceScores: [],
    images: [],
    cache: 'miss',
    durationMs: 12,
    models: { version: 2, providers: [] },
  };

  it('Mode "off" : ne bloque jamais même si le score IA est à 88%', () => {
    const settings = { ...DEFAULT_SETTINGS, blockMode: 'off' as const };
    const decision = evaluateBlockDecision('https://example.com/article', dummyResult, settings);
    expect(decision.shouldBlock).toBe(false);
    expect(decision.shouldWarn).toBe(false);
  });

  it('Mode "warn" : déclenche un avertissement non bloquant', () => {
    const settings = { ...DEFAULT_SETTINGS, blockMode: 'warn' as const };
    const decision = evaluateBlockDecision('https://example.com/article', dummyResult, settings);
    expect(decision.shouldBlock).toBe(false);
    expect(decision.shouldWarn).toBe(true);
  });

  it('Mode "block" : bloque la page si score >= 80%', () => {
    const settings = { ...DEFAULT_SETTINGS, blockMode: 'block' as const };
    const decision = evaluateBlockDecision('https://example.com/article', dummyResult, settings);
    expect(decision.shouldBlock).toBe(true);
    expect(decision.shouldWarn).toBe(false);
    expect(decision.reason).toBeDefined();
  });

  it('Exceptions actives : autorise le domaine si présent dans les exceptions', () => {
    const settings = {
      ...DEFAULT_SETTINGS,
      blockMode: 'block' as const,
      exceptions: [
        { domain: 'trusted-site.com', scope: 'always' as const, reason: 'Test' },
      ],
    };

    const decision = evaluateBlockDecision('https://trusted-site.com/ai-post', dummyResult, settings);
    expect(decision.shouldBlock).toBe(false);
    expect(decision.isException).toBe(true);
  });

  it('Exceptions temporaires expirées : bloque à nouveau après expiration', () => {
    const settings = {
      ...DEFAULT_SETTINGS,
      blockMode: 'block' as const,
      exceptions: [
        { domain: 'temp-site.com', scope: 'hour' as const, until: Date.now() - 1000 },
      ],
    };

    const decision = evaluateBlockDecision('https://temp-site.com/ai-post', dummyResult, settings);
    expect(decision.shouldBlock).toBe(true);
  });
});

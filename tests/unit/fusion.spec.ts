import { describe, it, expect } from 'vitest';
import { fuseSignals } from '@/src/core/fusion';
import { DEFAULT_SETTINGS, SignalResult } from '@/src/core/signals/types';

describe('Moteur de Fusion & Règles Dures (§6)', () => {
  it('Règle < 8 mots : doit renvoyer "insufficient" et badge gris', () => {
    const signals: SignalResult[] = [
      { id: 'd3', name: 'Compression', value: 0.9, weight: 0.5, contribution: 45, raw: '', ms: 1, available: true },
      { id: 'd6', name: 'Slop', value: 0.8, weight: 0.5, contribution: 40, raw: '', ms: 1, available: true },
    ];

    const res = fuseSignals(signals, 5, DEFAULT_SETTINGS);
    expect(res.label).toBe('insufficient');
    expect(res.color).toBe('#6b7280');
    expect(res.blocked).toBe(false);
  });

  it('Redistribution des poids : les signaux indisponibles redistribuent leur masse proportionnellement', () => {
    const signals: SignalResult[] = [
      { id: 'd1', name: 'ONNX', value: 0.0, weight: 0.20, contribution: 0, raw: '', ms: 0, available: false },
      { id: 'd2', name: 'fastText', value: 0.0, weight: 0.15, contribution: 0, raw: '', ms: 0, available: false },
      { id: 'd3', name: 'Compression', value: 0.8, weight: 0.10, contribution: 0, raw: '', ms: 1, available: true },
      { id: 'd6', name: 'Slop', value: 0.9, weight: 0.10, contribution: 0, raw: '', ms: 1, available: true },
    ];

    const res = fuseSignals(signals, 250, DEFAULT_SETTINGS);
    expect(res.score).toBeGreaterThan(80);
    // Somme des poids ajustés des signaux disponibles doit égaler 1.00 (0.50 + 0.50)
    const activeWeights = res.processedSignals.filter((s) => s.available).map((s) => s.weight);
    expect(activeWeights.reduce((a, b) => a + b, 0)).toBeCloseTo(1.0, 1);
  });

  it('Règle Watermark : un watermark détecté (z > 3) élève le score à au moins 80%', () => {
    const signals: SignalResult[] = [
      { id: 'd3', name: 'Compression', value: 0.2, weight: 0.5, contribution: 10, raw: '', ms: 1, available: true },
      { id: 'd6', name: 'Slop', value: 0.3, weight: 0.5, contribution: 15, raw: '', ms: 1, available: true },
    ];

    const res = fuseSignals(signals, 300, DEFAULT_SETTINGS, {
      watermarkDetected: true,
      watermarkZScore: 3.8,
    });

    expect(res.score).toBeGreaterThanOrEqual(80);
  });
});

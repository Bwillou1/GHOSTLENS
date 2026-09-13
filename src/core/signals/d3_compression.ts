import pako from 'pako';
import { SignalResult } from './types';

/**
 * Signal D3 — Analyse de Compressibilité (Port de thinkst/zippy)
 * Le texte généré par les LLM présente une entropie plus faible et se compresse
 * significativement mieux que le texte rédigé par un humain.
 */
export function computeD3Compression(text: string, weight: number = 0.10): SignalResult {
  const start = performance.now();

  if (!text || text.length < 100) {
    return {
      id: 'd3',
      name: 'Compressibilité (entropie)',
      value: 0.5,
      weight,
      contribution: 0,
      raw: 'Texte trop court (< 100 car.)',
      ms: 0,
      available: false,
    };
  }

  const rawBytes = new TextEncoder().encode(text);
  const rawLength = rawBytes.length;

  // 1. Ratio Deflate standard
  const compressedDeflate = pako.deflate(rawBytes, { level: 9 });
  const ratioDeflate = compressedDeflate.length / rawLength;

  // 2. Ratio sur texte sans ponctuation (isole la redondance lexicale)
  const noPunctText = text.replace(/[^\p{L}\p{N}\s]/gu, '');
  const noPunctBytes = new TextEncoder().encode(noPunctText);
  const compressedNoPunct = pako.deflate(noPunctBytes, { level: 9 });
  const ratioNoPunct = noPunctBytes.length > 0 ? compressedNoPunct.length / noPunctBytes.length : ratioDeflate;

  // Calibration zippy : un ratio faible (< 0.55) indique une forte probabilité d'IA
  // Humain typique: 0.58–0.72 | IA typique: 0.42–0.54
  const combinedRatio = (ratioDeflate * 0.6) + (ratioNoPunct * 0.4);

  // Normalisation sigmoïde inverse (plus le ratio est faible, plus le score IA est haut)
  // Centre à 0.56, pente -25
  const k = -24;
  const x0 = 0.56;
  const aiProb = 1 / (1 + Math.exp(-k * (combinedRatio - x0)));
  const boundedValue = Math.max(0, Math.min(1, aiProb));

  const ms = Math.round(performance.now() - start);

  return {
    id: 'd3',
    name: 'Compressibilité (entropie)',
    value: Math.round(boundedValue * 100) / 100,
    weight,
    contribution: Math.round(boundedValue * weight * 100),
    raw: `Ratio Deflate: ${(combinedRatio * 100).toFixed(1)}% (Original: ${rawLength} o → Comp: ${compressedDeflate.length} o)`,
    ms,
    available: true,
  };
}

import {
  AnalysisResult,
  ConfidenceLevel,
  SentenceScore,
  SettingsSchema,
  SignalResult,
  VerdictColor,
  VerdictLabel,
} from './signals/types';
import { splitSentences } from './extract/normalize';
import { computeD3Compression } from './signals/d3_compression';
import { computeD4Burstiness } from './signals/d4_burstiness';
import { computeD5TextStats } from './signals/d5_stats';
import { computeD6Slop } from './signals/d6_slop';
import { computeD7Patterns } from './signals/d7_patterns';

/**
 * Moteur de Fusion et Scoring de GhostLens (§6)
 */
export function fuseSignals(
  rawSignals: SignalResult[],
  wordCount: number,
  settings: SettingsSchema,
  options?: {
    watermarkDetected?: boolean;
    watermarkZScore?: number;
    watermarkProvider?: string;
    vibeScore?: number | null;
    isCacheHit?: boolean;
    durationMs?: number;
    url?: string;
    title?: string;
  }
): {
  score: number;
  label: VerdictLabel;
  color: VerdictColor;
  confidence: ConfidenceLevel;
  blocked: boolean;
  blockReason?: string;
  processedSignals: SignalResult[];
} {
  // Règle dure : < 50 mots -> Données insuffisantes
  if (wordCount < 50) {
    return {
      score: 0,
      label: 'insufficient',
      color: '#6b7280',
      confidence: 'low',
      blocked: false,
      processedSignals: rawSignals.map((s) => ({ ...s, contribution: 0 })),
    };
  }

  // 1. Filtrer les signaux disponibles
  const availableSignals = rawSignals.filter((s) => s.available);
  const totalWeight = availableSignals.reduce((acc, s) => acc + s.weight, 0);

  if (availableSignals.length === 0 || totalWeight === 0) {
    return {
      score: 0,
      label: 'insufficient',
      color: '#6b7280',
      confidence: 'low',
      blocked: false,
      processedSignals: rawSignals,
    };
  }

  // 2. Redistribution proportionnelle des poids
  let aggregatedScore = 0;
  const processedSignals: SignalResult[] = rawSignals.map((s) => {
    if (!s.available) {
      return { ...s, contribution: 0 };
    }
    const adjustedWeight = s.weight / totalWeight;
    const contribution = s.value * adjustedWeight * 100;
    aggregatedScore += contribution;

    return {
      ...s,
      weight: Math.round(adjustedWeight * 100) / 100,
      contribution: Math.round(contribution * 10) / 10,
    };
  });

  let finalScore = Math.round(Math.max(0, Math.min(100, aggregatedScore)));

  // 3. Règles dures après fusion
  // Règle Watermark (D8 z > 3)
  if (options?.watermarkDetected || (options?.watermarkZScore && options.watermarkZScore > 3)) {
    finalScore = Math.max(finalScore, 80);
  }

  // Calcul de la dispersion (écart-type des signaux)
  const values = availableSignals.map((s) => s.value);
  const mean = values.reduce((a, b) => a + b, 0) / values.length;
  const variance = values.reduce((acc, v) => acc + Math.pow(v - mean, 2), 0) / values.length;
  const stdDev = Math.sqrt(variance);

  // Confiance
  let confidence: ConfidenceLevel = wordCount > 200 && availableSignals.length >= 4 ? 'high' : 'medium';
  if (stdDev > 0.45) {
    // Dispersion forte -> baisse de confiance
    confidence = confidence === 'high' ? 'medium' : 'low';
  }

  // 4. Attribution du label et de la couleur selon seuils
  let label: VerdictLabel = 'human';
  let color: VerdictColor = '#16a34a';

  if (finalScore >= settings.thresholds.block) {
    label = 'ai';
    color = '#dc2626';
  } else if (finalScore >= settings.thresholds.strong) {
    label = 'likely-ai';
    color = '#f97316';
  } else if (finalScore >= settings.thresholds.warn) {
    label = 'mixed';
    color = '#eab308';
  } else {
    label = 'human';
    color = '#16a34a';
  }

  // 5. Décision de blocage (§9.4)
  let blocked = false;
  let blockReason: string | undefined;

  const vibeScore = options?.vibeScore ?? null;
  const isVibeBlocked = vibeScore !== null && vibeScore >= settings.thresholds.vibeBlock;
  const isScoreBlocked = finalScore >= settings.thresholds.block;

  if (settings.blockMode === 'block' && (isScoreBlocked || isVibeBlocked)) {
    blocked = true;
    blockReason = isScoreBlocked
      ? `${availableSignals.length} signaux convergents détectent un texte synthétique (${finalScore}%)`
      : `Empreinte de site vibe-codé détectée (${vibeScore}/100)`;
  }

  return {
    score: finalScore,
    label,
    color,
    confidence,
    blocked,
    blockReason,
    processedSignals,
  };
}

/**
 * Calcule le score individuel de chaque phrase pour l'affichage virtualisé et le highlighting.
 */
export function computeSentenceScores(text: string, globalScore: number): SentenceScore[] {
  const sentences = splitSentences(text);
  if (sentences.length === 0) return [];

  return sentences.map((s, index) => {
    // Évaluation rapide locale par phrase
    const d3 = computeD3Compression(s, 0.4);
    const d6 = computeD6Slop(s, 'fr', 0.6);

    let localScore = globalScore;
    if (d3.available && d6.available) {
      localScore = Math.round(((d3.value * 0.4) + (d6.value * 0.6)) * 100);
    } else if (d6.available) {
      localScore = Math.round(d6.value * 100);
    }

    return {
      index,
      score: localScore,
      text: s,
    };
  });
}

/**
 * Pipeline complet d'analyse heuristique P1
 */
export function analyzeTextPipeline(
  normalizedText: string,
  wordCount: number,
  language: 'fr' | 'en' | 'unknown',
  settings: SettingsSchema,
  metadata?: { url?: string; title?: string; vibeScore?: number | null }
): AnalysisResult {
  const start = performance.now();

  // Exécution des signaux heuristiques D3, D4, D5, D6, D7
  const d3 = computeD3Compression(normalizedText, settings.weights.d3);
  const d4 = computeD4Burstiness(normalizedText, settings.weights.d4);
  const d5 = computeD5TextStats(normalizedText, settings.weights.d5);
  const d6 = computeD6Slop(normalizedText, language, settings.weights.d6);
  const d7 = computeD7Patterns(normalizedText, settings.weights.d7);

  const rawSignals: SignalResult[] = [
    // Placeholder pour D1 et D2 (activés en P2 avec ONNX)
    {
      id: 'd1',
      name: 'Classifieur profond (ONNX)',
      value: 0,
      weight: settings.weights.d1,
      contribution: 0,
      raw: 'En attente modèle ONNX P2',
      ms: 0,
      available: false,
    },
    {
      id: 'd2',
      name: 'fastText supervisé',
      value: 0,
      weight: settings.weights.d2,
      contribution: 0,
      raw: 'En attente modèle fastText P2',
      ms: 0,
      available: false,
    },
    d3,
    d4,
    d5,
    d6,
    d7,
    {
      id: 'd8',
      name: 'Watermark numérique',
      value: 0,
      weight: settings.weights.d8,
      contribution: 0,
      raw: 'Désactivé par défaut',
      ms: 0,
      available: false,
    },
    {
      id: 'd9',
      name: 'Fluidité & syntaxe',
      value: 0,
      weight: settings.weights.d9,
      contribution: 0,
      raw: 'Standard local',
      ms: 0,
      available: false,
    },
    {
      id: 'd10',
      name: 'Plagiat local',
      value: 0,
      weight: settings.weights.d10,
      contribution: 0,
      raw: 'Aucun index local actif',
      ms: 0,
      available: false,
    },
  ];

  const fused = fuseSignals(rawSignals, wordCount, settings, {
    vibeScore: metadata?.vibeScore,
    url: metadata?.url,
    title: metadata?.title,
  });

  const durationMs = Math.round(performance.now() - start);
  const sentenceScores = computeSentenceScores(normalizedText, fused.score);

  return {
    analysisId: typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : `gl-${Date.now()}`,
    schema: 'gl/v1',
    score: fused.score,
    label: fused.label,
    color: fused.color,
    confidence: fused.confidence,
    language,
    wordCount,
    vibeScore: metadata?.vibeScore ?? null,
    blocked: fused.blocked,
    blockReason: fused.blockReason,
    signals: fused.processedSignals,
    sentenceScores,
    images: [],
    cache: 'miss',
    durationMs,
    models: {
      version: 1,
      providers: ['heuristic-wasm'],
    },
    url: metadata?.url,
    title: metadata?.title,
  };
}

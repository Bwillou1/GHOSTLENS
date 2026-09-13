/**
 * Types & Contrats de données GhostLens (v1.0)
 */

export interface SignalResult {
  id: string;
  name: string;
  value: number; // 0..1 (0 = humain, 1 = IA)
  weight: number; // Poids dans la fusion
  contribution: number; // Contribution en points (0..100)
  raw: string; // Valeur brute lisible
  ms: number; // Temps de calcul en millisecondes
  available: boolean; // Si le signal a pu être calculé
}

export interface SentenceScore {
  index: number;
  score: number; // 0..100
  text?: string;
}

export interface ImageResult {
  url: string;
  srcElementId?: string;
  score: number; // 0..100
  tags: string[];
  c2pa?: {
    present: boolean;
    generator?: string;
    isAi?: boolean;
  };
  freqArtifactScore?: number;
  classifierScore?: number;
}

export type VerdictLabel = 'human' | 'mixed' | 'likely-ai' | 'ai' | 'insufficient';
export type VerdictColor = '#16a34a' | '#eab308' | '#f97316' | '#dc2626' | '#6b7280';
export type ConfidenceLevel = 'low' | 'medium' | 'high';

export interface AnalysisResult {
  analysisId: string;
  schema: 'gl/v1';
  score: number; // 0..100
  label: VerdictLabel;
  color: VerdictColor;
  confidence: ConfidenceLevel;
  language: string;
  wordCount: number;
  vibeScore: number | null; // D11 (pages)
  blocked: boolean;
  blockReason?: string;
  signals: SignalResult[];
  sentenceScores: SentenceScore[];
  images: ImageResult[];
  humanizer?: {
    before: number;
    after: number;
    similarity: number;
  };
  cache: 'hit' | 'miss';
  durationMs: number;
  models: {
    version: number;
    providers: string[];
  };
  url?: string;
  title?: string;
}

export interface SettingsSchema {
  language: 'fr' | 'en';
  blockMode: 'off' | 'info' | 'warn' | 'block';
  thresholds: {
    warn: number; // Défaut: 30
    strong: number; // Défaut: 60
    block: number; // Défaut: 80
    vibeBlock: number; // Défaut: 80
  };
  weights: {
    d1: number; // 0.20
    d2: number; // 0.15
    d3: number; // 0.10
    d4: number; // 0.10
    d5: number; // 0.10
    d6: number; // 0.10
    d7: number; // 0.05
    d8: number; // 0.10
    d9: number; // 0.05
    d10: number; // 0.05
  };
  signals: {
    d8: boolean;
    d10Web: boolean;
    d9LocalServer: boolean;
  };
  models: {
    consented: string[];
    autoUpdate: boolean;
  };
  humanizer: {
    llmEnabled: boolean;
    targetScore: number;
    similarityFloor: number;
  };
  highlight: boolean;
  badge: boolean;
  exceptions: Array<{
    domain: string;
    scope: 'page' | 'hour' | 'always';
    until?: number;
    reason?: string;
  }>;
}

export const DEFAULT_SETTINGS: SettingsSchema = {
  language: 'fr',
  blockMode: 'off',
  thresholds: {
    warn: 30,
    strong: 60,
    block: 80,
    vibeBlock: 80,
  },
  weights: {
    d1: 0.20,
    d2: 0.15,
    d3: 0.10,
    d4: 0.10,
    d5: 0.10,
    d6: 0.10,
    d7: 0.05,
    d8: 0.10,
    d9: 0.05,
    d10: 0.05,
  },
  signals: {
    d8: false,
    d10Web: false,
    d9LocalServer: false,
  },
  models: {
    consented: ['gl-det-ai-base', 'gl-fasttext-lin', 'gl-fasttext-ai', 'gl-minilm'],
    autoUpdate: false,
  },
  humanizer: {
    llmEnabled: false,
    targetScore: 30,
    similarityFloor: 0.85,
  },
  highlight: true,
  badge: true,
  exceptions: [],
};

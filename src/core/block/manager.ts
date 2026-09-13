import { SettingsSchema, AnalysisResult } from '../signals/types';

export interface BlockDecision {
  shouldBlock: boolean;
  shouldWarn: boolean;
  reason?: string;
  isException: boolean;
}

/**
 * Gestionnaire des règles de blocage et des exceptions (§9.4)
 */
export function evaluateBlockDecision(
  url: string,
  result: AnalysisResult,
  settings: SettingsSchema
): BlockDecision {
  const domain = extractDomain(url);
  const now = Date.now();

  // 1. Vérification des exceptions utilisateur actives
  const activeException = settings.exceptions.find((ex) => {
    if (ex.domain !== domain && !url.includes(ex.domain)) return false;
    // Si expiration temporelle (ex. autoriser 1 h)
    if (ex.until && ex.until < now) return false;
    return true;
  });

  if (activeException) {
    return {
      shouldBlock: false,
      shouldWarn: false,
      reason: `Exception active (${activeException.scope})`,
      isException: true,
    };
  }

  // 2. Évaluation selon le blockMode
  if (settings.blockMode === 'off' || settings.blockMode === 'info') {
    return {
      shouldBlock: false,
      shouldWarn: false,
      isException: false,
    };
  }

  const isScoreHigh = result.score >= settings.thresholds.block;
  const isVibeHigh = result.vibeScore !== null && result.vibeScore >= settings.thresholds.vibeBlock;
  const isSuspicious = result.score >= settings.thresholds.warn;

  if (settings.blockMode === 'warn') {
    return {
      shouldBlock: false,
      shouldWarn: isSuspicious || isScoreHigh || isVibeHigh,
      reason: `Contenu suspect détecté (${result.score}%)`,
      isException: false,
    };
  }

  if (settings.blockMode === 'block') {
    const shouldBlock = isScoreHigh || isVibeHigh;
    let reason: string | undefined;

    if (shouldBlock) {
      reason = isScoreHigh
        ? `${result.signals.filter((s) => s.available).length} signaux convergents détectent un contenu synthétique (${result.score}%)`
        : `Empreinte de site vibe-codé détectée (${result.vibeScore}/100)`;
    }

    return {
      shouldBlock,
      shouldWarn: false,
      reason,
      isException: false,
    };
  }

  return {
    shouldBlock: false,
    shouldWarn: false,
    isException: false,
  };
}

export function extractDomain(url: string): string {
  try {
    const parsed = new URL(url);
    return parsed.hostname;
  } catch {
    return url;
  }
}

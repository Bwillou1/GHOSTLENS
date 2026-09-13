import { purgeAiIsms } from './rules';
import { restructureSentences } from './structure';
import { applyTypographyRules } from './languagetool';
import {
  computeSemanticSimilarity,
  verifyFactualIntegrity,
  generateWordDiff,
  DiffChunk,
} from './verify';
import { analyzeTextPipeline } from '../fusion';
import { countWords } from '../extract/normalize';
import { DEFAULT_SETTINGS, SettingsSchema } from '../signals/types';

export interface HumanizationResult {
  original: string;
  humanized: string;
  beforeScore: number;
  afterScore: number;
  scoreDrop: number;
  similarity: number;
  factualIntegrity: boolean;
  diff: DiffChunk[];
  rollbackApplied: boolean;
  rollbackReason?: string;
  replacementsCount: number;
}

/**
 * Pipeline complet d'humanisation vérifiée (H1 -> H2 -> H4 -> H5)
 */
export async function humanizeTextPipeline(
  text: string,
  language: 'fr' | 'en' | 'unknown' = 'fr',
  settings: SettingsSchema = DEFAULT_SETTINGS
): Promise<HumanizationResult> {
  const wordCount = countWords(text);

  // 1. Analyse du score initial avant modification
  const initialAnalysis = await analyzeTextPipeline(text, wordCount, language, settings);
  const beforeScore = initialAnalysis.score;

  // 2. Étape H1 — Purge des AI-isms
  const h1 = purgeAiIsms(text, language);

  // 3. Étape H2 — Restructuration & burstiness
  const h2 = restructureSentences(h1.purgedText, language);

  // 4. Étape H4 — Finition typographique
  const h4 = applyTypographyRules(h2, language);

  // 5. Étape H5 — Vérification sémantique et factuelle
  const factualIntegrity = verifyFactualIntegrity(text, h4);
  const similarity = computeSemanticSimilarity(text, h4);

  let finalHumanized = h4;
  let rollbackApplied = false;
  let rollbackReason: string | undefined;

  // Règle de sécurité : rollback si altération de faits ou chute de similarité sous 0.85
  if (!factualIntegrity) {
    rollbackApplied = true;
    rollbackReason = 'Altération détectée sur des valeurs chiffrées ou entités factuelles.';
    finalHumanized = text;
  } else if (similarity < 0.85) {
    rollbackApplied = true;
    rollbackReason = `Similarité sémantique insuffisante (${(similarity * 100).toFixed(1)}% < 85%).`;
    finalHumanized = text;
  }

  // Re-calcul du score après humanisation
  const finalAnalysis = await analyzeTextPipeline(
    finalHumanized,
    countWords(finalHumanized),
    language,
    settings
  );
  const afterScore = finalAnalysis.score;
  const scoreDrop = beforeScore - afterScore;

  const diff = generateWordDiff(text, finalHumanized);

  return {
    original: text,
    humanized: finalHumanized,
    beforeScore,
    afterScore,
    scoreDrop,
    similarity: Math.round(similarity * 100) / 100,
    factualIntegrity,
    diff,
    rollbackApplied,
    rollbackReason,
    replacementsCount: h1.replacementsCount,
  };
}

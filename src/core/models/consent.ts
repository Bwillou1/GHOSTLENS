import { getSettings, saveSettings } from '../cache/idb';
import { MANIFEST, isModelCached } from './registry';

export interface ModelConsentStatus {
  name: string;
  task: string;
  size: number;
  sizeHuman: string;
  consented: boolean;
  cached: boolean;
  core: boolean;
}

function formatBytes(bytes: number): string {
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} Ko`;
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} Mo`;
  return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} Go`;
}

/**
 * Récupère le statut de consentement et de présence locale de tous les modèles.
 */
export async function getModelsConsentStatus(): Promise<ModelConsentStatus[]> {
  const settings = await getSettings();
  const consentedList = settings.models.consented || [];

  const statuses: ModelConsentStatus[] = [];

  for (const model of MANIFEST.models) {
    const consented = consentedList.includes(model.name);
    const cached = await isModelCached(model.name);

    statuses.push({
      name: model.name,
      task: model.task,
      size: model.size,
      sizeHuman: formatBytes(model.size),
      consented,
      cached,
      core: !!model.core,
    });
  }

  return statuses;
}

/**
 * Modifie le consentement utilisateur pour un modèle donné.
 */
export async function setModelConsent(modelName: string, enable: boolean): Promise<void> {
  const settings = await getSettings();
  let consented = settings.models.consented || [];

  if (enable) {
    if (!consented.includes(modelName)) {
      consented.push(modelName);
    }
  } else {
    consented = consented.filter((m) => m !== modelName);
  }

  settings.models.consented = consented;
  await saveSettings(settings);
}

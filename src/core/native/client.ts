/**
 * Client de communication avec le Native Messaging Host (GhostLens Native Bridge)
 */

export interface NativeHostStatus {
  available: boolean;
  version?: string;
  platform?: string;
  error?: string;
}

export interface BinocularsResult {
  score: number;
  binocularsRatio: number;
  isAi: boolean;
  confidence: number;
}

const NATIVE_HOST_NAME = 'com.ghostlens.native';

/**
 * Vérifie si le host natif est disponible
 */
export async function checkNativeHost(): Promise<NativeHostStatus> {
  if (typeof chrome === 'undefined' || !chrome.runtime?.sendNativeMessage) {
    return { available: false, error: 'Native Messaging non supporté dans cet environnement' };
  }

  return new Promise((resolve) => {
    try {
      chrome.runtime.sendNativeMessage(
        NATIVE_HOST_NAME,
        { type: 'ping' },
        (response) => {
          if (chrome.runtime.lastError || !response) {
            resolve({
              available: false,
              error: chrome.runtime.lastError?.message || 'Hôte non trouvé',
            });
          } else {
            resolve({
              available: true,
              version: response.version,
              platform: response.platform,
            });
          }
        }
      );
    } catch (e: any) {
      resolve({ available: false, error: e.message });
    }
  });
}

/**
 * Exécute l'analyse Binoculars (D9) via le host natif
 */
export async function runNativeBinoculars(text: string): Promise<BinocularsResult | null> {
  if (typeof chrome === 'undefined' || !chrome.runtime?.sendNativeMessage) {
    return null;
  }

  return new Promise((resolve) => {
    try {
      chrome.runtime.sendNativeMessage(
        NATIVE_HOST_NAME,
        { type: 'binoculars:eval', text },
        (response) => {
          if (chrome.runtime.lastError || !response || response.error) {
            resolve(null);
          } else {
            resolve(response.result as BinocularsResult);
          }
        }
      );
    } catch {
      resolve(null);
    }
  });
}

/**
 * Exécute la réécriture H3 par LLM local via le host natif
 */
export async function runNativeLLMHumanize(
  text: string,
  model = 'llama3:8b'
): Promise<string | null> {
  if (typeof chrome === 'undefined' || !chrome.runtime?.sendNativeMessage) {
    return null;
  }

  return new Promise((resolve) => {
    try {
      chrome.runtime.sendNativeMessage(
        NATIVE_HOST_NAME,
        { type: 'humanize:llm', text, model },
        (response) => {
          if (chrome.runtime.lastError || !response || response.type === 'humanize:error') {
            resolve(null);
          } else {
            resolve(response.text || null);
          }
        }
      );
    } catch {
      resolve(null);
    }
  });
}

import { openDB, DBSchema, IDBPDatabase } from 'idb';
import { AnalysisResult, SettingsSchema, DEFAULT_SETTINGS } from '../signals/types';

interface GhostLensDB extends DBSchema {
  analyses: {
    key: string;
    value: {
      result: AnalysisResult;
      timestamp: number;
      url: string;
    };
  };
  models: {
    key: string;
    value: {
      name: string;
      blob: Blob;
      sha256: string;
      version: number;
    };
  };
  settings: {
    key: string;
    value: SettingsSchema;
  };
  exceptions: {
    key: string;
    value: {
      domain: string;
      scope: 'page' | 'hour' | 'always';
      until?: number;
      reason?: string;
    };
  };
  docIndex: {
    key: string;
    value: {
      docId: string;
      simHash: string;
      title: string;
    };
  };
  history: {
    key: string;
    value: {
      analysisId: string;
      title: string;
      url: string;
      score: number;
      color: string;
      label: string;
      timestamp: number;
    };
  };
}

const DB_NAME = 'ghostlens';
const DB_VERSION = 1;

let dbPromise: Promise<IDBPDatabase<GhostLensDB>> | null = null;

export async function getDB(): Promise<IDBPDatabase<GhostLensDB>> {
  if (!dbPromise) {
    dbPromise = openDB<GhostLensDB>(DB_NAME, DB_VERSION, {
      upgrade(db) {
        if (!db.objectStoreNames.contains('analyses')) {
          db.createObjectStore('analyses');
        }
        if (!db.objectStoreNames.contains('models')) {
          db.createObjectStore('models');
        }
        if (!db.objectStoreNames.contains('settings')) {
          db.createObjectStore('settings');
        }
        if (!db.objectStoreNames.contains('exceptions')) {
          db.createObjectStore('exceptions');
        }
        if (!db.objectStoreNames.contains('docIndex')) {
          db.createObjectStore('docIndex');
        }
        if (!db.objectStoreNames.contains('history')) {
          db.createObjectStore('history');
        }
      },
    });
  }
  return dbPromise;
}

/**
 * Calcul SHA-256 en Web Crypto pour les clés de cache
 */
export async function sha256(text: string): Promise<string> {
  if (typeof crypto === 'undefined' || !crypto.subtle) {
    // Fallback simple si subtle crypto non disponible
    let hash = 0;
    for (let i = 0; i < text.length; i++) {
      hash = ((hash << 5) - hash) + text.charCodeAt(i);
      hash |= 0;
    }
    return Math.abs(hash).toString(16);
  }

  const msgUint8 = new TextEncoder().encode(text);
  const hashBuffer = await crypto.subtle.digest('SHA-256', msgUint8);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
}

export async function getCachedAnalysis(textHash: string, modelsVersion: number): Promise<AnalysisResult | null> {
  try {
    const db = await getDB();
    const entry = await db.get('analyses', `${textHash}:${modelsVersion}`);
    if (entry) {
      return { ...entry.result, cache: 'hit' };
    }
  } catch (err) {
    console.warn('[GhostLens] Erreur lecture cache IndexedDB', err);
  }
  return null;
}

export async function setCachedAnalysis(textHash: string, modelsVersion: number, result: AnalysisResult): Promise<void> {
  try {
    const db = await getDB();
    await db.put('analyses', {
      result,
      timestamp: Date.now(),
      url: result.url || '',
    }, `${textHash}:${modelsVersion}`);

    // Ajouter à l'historique
    await db.put('history', {
      analysisId: result.analysisId,
      title: result.title || 'Page analysée',
      url: result.url || '',
      score: result.score,
      color: result.color,
      label: result.label,
      timestamp: Date.now(),
    }, result.analysisId);
  } catch (err) {
    console.warn('[GhostLens] Erreur écriture cache IndexedDB', err);
  }
}

export async function getSettings(): Promise<SettingsSchema> {
  try {
    const db = await getDB();
    const settings = await db.get('settings', 'app');
    if (settings) {
      return { ...DEFAULT_SETTINGS, ...settings };
    }
  } catch (err) {
    console.warn('[GhostLens] Erreur lecture settings IndexedDB', err);
  }
  return DEFAULT_SETTINGS;
}

export async function saveSettings(settings: SettingsSchema): Promise<void> {
  try {
    const db = await getDB();
    await db.put('settings', settings, 'app');
  } catch (err) {
    console.warn('[GhostLens] Erreur sauvegarde settings IndexedDB', err);
  }
}

export async function clearAllLocalData(): Promise<void> {
  try {
    const db = await getDB();
    const tx = db.transaction(['analyses', 'history', 'exceptions', 'docIndex'], 'readwrite');
    await Promise.all([
      tx.objectStore('analyses').clear(),
      tx.objectStore('history').clear(),
      tx.objectStore('exceptions').clear(),
      tx.objectStore('docIndex').clear(),
      tx.done,
    ]);
  } catch (err) {
    console.warn('[GhostLens] Erreur suppression IndexedDB', err);
  }
}

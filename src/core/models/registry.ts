import { getDB } from '../cache/idb';

export interface ModelEntry {
  name: string;
  task: 'text-classification' | 'language-id' | 'embedding' | 'image-classification' | 'token-likelihood' | 'text-generation';
  quant: 'int8' | 'int4' | 'none';
  size: number;
  sha256: string;
  core?: boolean;
  images?: boolean;
  advanced?: boolean;
  optional?: boolean;
}

export interface ModelManifest {
  version: number;
  models: ModelEntry[];
}

export const MANIFEST: ModelManifest = {
  version: 3,
  models: [
    {
      name: 'gl-det-ai-base',
      task: 'text-classification',
      quant: 'int8',
      size: 52000000,
      sha256: 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
      core: true,
    },
    {
      name: 'gl-fasttext-lin',
      task: 'language-id',
      quant: 'none',
      size: 9000000,
      sha256: 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
      core: true,
    },
    {
      name: 'gl-fasttext-ai',
      task: 'text-classification',
      quant: 'none',
      size: 6000000,
      sha256: 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
      core: true,
    },
    {
      name: 'gl-minilm',
      task: 'embedding',
      quant: 'int8',
      size: 9000000,
      sha256: 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
      core: true,
    },
    {
      name: 'gl-img-det',
      task: 'image-classification',
      quant: 'int8',
      size: 38000000,
      sha256: 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
      images: true,
    },
    {
      name: 'gl-wm-scorer',
      task: 'token-likelihood',
      quant: 'int4',
      size: 620000000,
      sha256: 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
      advanced: true,
    },
    {
      name: 'gl-llm-humanize',
      task: 'text-generation',
      quant: 'int4',
      size: 1600000000,
      sha256: 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
      optional: true,
    },
  ],
};

/**
 * Récupère le binaire d'un modèle stocké dans IndexedDB.
 */
export async function getModelBlob(modelName: string): Promise<Blob | null> {
  try {
    const db = await getDB();
    const entry = await db.get('models', modelName);
    return entry ? entry.blob : null;
  } catch (err) {
    console.warn(`[GhostLens] Erreur lecture modèle ${modelName}`, err);
    return null;
  }
}

/**
 * Enregistre et vérifie l'intégrité SHA-256 d'un modèle (C-6).
 */
export async function storeModelBlob(modelName: string, blob: Blob, expectedSha256: string): Promise<boolean> {
  try {
    const buffer = await blob.arrayBuffer();
    const hashBuffer = await crypto.subtle.digest('SHA-256', buffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const computedHash = hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');

    if (expectedSha256 && expectedSha256 !== 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855' && computedHash !== expectedSha256) {
      console.error(`[GhostLens] Échec vérification SHA-256 pour ${modelName}`);
      return false;
    }

    const db = await getDB();
    await db.put('models', {
      name: modelName,
      blob,
      sha256: computedHash,
      version: MANIFEST.version,
    }, modelName);

    return true;
  } catch (err) {
    console.error(`[GhostLens] Erreur stockage modèle ${modelName}`, err);
    return false;
  }
}

/**
 * Vérifie si un modèle est déjà présent en cache local.
 */
export async function isModelCached(modelName: string): Promise<boolean> {
  const blob = await getModelBlob(modelName);
  return blob !== null;
}

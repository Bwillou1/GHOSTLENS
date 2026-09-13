import fr from './fr.json';
import en from './en.json';

export type Language = 'fr' | 'en';
export type TranslationTree = typeof fr;

const translations: Record<Language, TranslationTree> = { fr, en };

let currentLanguage: Language = 'fr';

export function setLanguage(lang: Language): void {
  currentLanguage = lang;
}

export function getLanguage(): Language {
  return currentLanguage;
}

type NestedKeyOf<ObjectType extends object> = {
  [Key in keyof ObjectType & (string | number)]: ObjectType[Key] extends object
    ? `${Key}.${NestedKeyOf<ObjectType[Key]>}`
    : `${Key}`;
}[keyof ObjectType & (string | number)];

export type TranslationKey = NestedKeyOf<TranslationTree>;

export function t(key: TranslationKey, params?: Record<string, string | number>): string {
  const keys = key.split('.');
  let current: unknown = translations[currentLanguage] ?? translations.fr;

  for (const k of keys) {
    if (current && typeof current === 'object' && k in current) {
      current = (current as Record<string, unknown>)[k];
    } else {
      current = key;
      break;
    }
  }

  let text = typeof current === 'string' ? current : key;

  if (params) {
    for (const [pKey, pVal] of Object.entries(params)) {
      text = text.replace(new RegExp(`\\{${pKey}\\}`, 'g'), String(pVal));
    }
  }

  return text;
}

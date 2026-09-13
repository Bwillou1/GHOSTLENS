/**
 * Étape H4 — Finition Typographique & Correction Locale
 * Support du serveur LanguageTool local auto-hébergé (http://localhost:8010)
 * avec règles typographiques locales strictes en fallback.
 */

export async function checkLanguageToolServer(): Promise<boolean> {
  try {
    const res = await fetch('http://localhost:8010/v2/languages', {
      method: 'GET',
      headers: { Accept: 'application/json' },
    });
    return res.ok;
  } catch {
    return false;
  }
}

/**
 * Applique les règles de finition typographique locale (FR et EN).
 */
export function applyTypographyRules(text: string, language: 'fr' | 'en' | 'unknown' = 'fr'): string {
  let result = text;

  if (language === 'fr') {
    // 1. Guillemets français avec espaces insécables
    result = result.replace(/"([^"]+)"/g, '« $1 »');

    // 2. Ponctuation double précédée d'une espace insécable (?, !, :, ;)
    result = result.replace(/ +([?!:;])/g, '\u00A0$1');
    result = result.replace(/(?<!\u00A0)([?!:;])/g, '\u00A0$1');

    // 3. Apostrophes typographiques
    result = result.replace(/(\w)'(\w)/g, '$1’$2');
  } else {
    // Anglais : apostrophes courbes
    result = result.replace(/(\w)'(\w)/g, '$1’$2');
  }

  // 4. Espaces multiples et propreté générale
  result = result.replace(/[ \t]{2,}/g, ' ');
  result = result.replace(/\s+\./g, '.');
  result = result.replace(/\s+,/g, ',');

  return result.trim();
}

/**
 * Table de remapping d'homoglyphes (anti-contournement de détection et watermark, inspiré de SemaMark).
 * Mappe les caractères Cyrilliques, Grecs et symboles similaires vers leurs équivalents latins de base.
 */

const HOMOGLYPH_MAP: Record<string, string> = {
  // Cyrillique minuscule vers Latin
  'а': 'a', 'с': 'c', 'е': 'e', 'о': 'o', 'р': 'p', 'ѕ': 's', 'х': 'x', 'у': 'y',
  'і': 'i', 'ј': 'j', 'ԁ': 'd', 'ԛ': 'q', 'ԝ': 'w',
  // Cyrillique majuscule vers Latin
  'А': 'A', 'В': 'B', 'С': 'C', 'Е': 'E', 'Н': 'H', 'І': 'I', 'Ј': 'J', 'К': 'K',
  'М': 'M', 'О': 'O', 'Р': 'P', 'Ѕ': 'S', 'Т': 'T', 'Х': 'X', 'Ү': 'Y',
  // Grec minuscule vers Latin
  'α': 'a', 'β': 'b', 'γ': 'g', 'ε': 'e', 'η': 'n', 'ι': 'i', 'κ': 'k', 'ν': 'v',
  'ο': 'o', 'ρ': 'p', 'τ': 't', 'υ': 'u', 'χ': 'x',
  // Grec majuscule vers Latin
  'Α': 'A', 'Β': 'B', 'Γ': 'G', 'Δ': 'D', 'Ε': 'E', 'Ζ': 'Z', 'Η': 'H', 'Ι': 'I',
  'Κ': 'K', 'Μ': 'M', 'Ν': 'N', 'Ο': 'O', 'Ρ': 'P', 'Τ': 'T', 'Υ': 'Y', 'Χ': 'X',
  // Espaces insécables / zéro largeur spéciaux
  '\u200B': '', // zero-width space
  '\u200C': '', // zero-width non-joiner
  '\u200D': '', // zero-width joiner
  '\uFEFF': '', // zero-width no-break space
  '\u00A0': ' ', // no-break space -> normalisé pour les calculs internes
};

/**
 * Remplace tous les homoglyphes par leurs caractères de base.
 */
export function normalizeHomoglyphs(text: string): string {
  let result = '';
  for (const char of text) {
    result += HOMOGLYPH_MAP[char] ?? char;
  }
  return result;
}

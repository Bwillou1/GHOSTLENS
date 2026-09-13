/**
 * Étape H1 — Purge des AI-isms & Remplacement Lexical
 * Remplace les collocations et expressions typiquement surutilisées par l'IA
 * par des alternatives naturelles issues de la fréquence humaine.
 */

const REPLACEMENT_MAP_FR: Array<{ pattern: RegExp; replacements: string[] }> = [
  {
    pattern: /\bdans un monde en (?:constante évolution|pleine mutation)\b/gi,
    replacements: ['aujourd\'hui', 'actuellement', 'de nos jours'],
  },
  {
    pattern: /\bil est (?:important|essentiel|crucial) de (?:noter|souligner) que\b/gi,
    replacements: ['notons que', 'il faut remarquer que', 'précisons que'],
  },
  {
    pattern: /\bil convient de (?:souligner|noter) que\b/gi,
    replacements: ['soulignons que', 'rappelons que'],
  },
  {
    pattern: /\bforce est de constater que\b/gi,
    replacements: ['on constate que', 'il est clair que'],
  },
  {
    pattern: /\bjoue un rôle (?:crucial|essentiel|majeur)\b/gi,
    replacements: ['compte beaucoup', 'pèse lourdement', 'est déterminant'],
  },
  {
    pattern: /\bau cœur de\b/gi,
    replacements: ['au centre de', 'dans'],
  },
  {
    pattern: /\btournant décisif\b/gi,
    replacements: ['changement notable', 'étape clé'],
  },
  {
    pattern: /\brepousser les limites de la créativité et de l'innovation\b/gi,
    replacements: ['stimuler la créativité et concevoir de nouvelles idées'],
  },
  {
    pattern: /\brepousser les limites\b/gi,
    replacements: ['dépasser les contraintes', 'progresser'],
  },
  {
    pattern: /\bnaviguer dans la complexité\b/gi,
    replacements: ['gérer la complexité', 'avancer'],
  },
  {
    pattern: /\bpierre angulaire\b/gi,
    replacements: ['base solide', 'élément clé', 'socle'],
  },
  {
    pattern: /\bcatalyseur d'opportunités\b/gi,
    replacements: ['source concrète d\'opportunités'],
  },
  {
    pattern: /\bcatalyseur d'innovation\b/gi,
    replacements: ['moteur d\'innovation', 'vecteur'],
  },
  {
    pattern: /\bcatalyseur\b/gi,
    replacements: ['moteur', 'déclencheur'],
  },
  {
    pattern: /\bpaysage en constante mutation\b/gi,
    replacements: ['contexte actuel', 'secteur'],
  },
  {
    pattern: /\bpaysage actuel\b/gi,
    replacements: ['marché actuel', 'secteur'],
  },
  {
    pattern: /\briche tapisserie\b/gi,
    replacements: ['grande diversité', 'ensemble varié'],
  },
  {
    pattern: /\bsynergie harmonieuse et polyvalente\b/gi,
    replacements: ['bonne complémentarité pratique'],
  },
  {
    pattern: /\bsynergie\b/gi,
    replacements: ['complémentarité', 'alliance'],
  },
  {
    pattern: /\ben conclusion\b/gi,
    replacements: ['pour finir', 'au bout du compte', 'en somme'],
  },
  {
    pattern: /\bce n'est pas seulement ([^,]+), mais aussi ([^.]+)\b/gi,
    replacements: ['au-delà de $1, $2'],
  },
];

const REPLACEMENT_MAP_EN: Array<{ pattern: RegExp; replacements: string[] }> = [
  {
    pattern: /\bin today's fast-paced world\b/gi,
    replacements: ['today', 'nowadays', 'currently'],
  },
  {
    pattern: /\bit is important to (?:note|remember) that\b/gi,
    replacements: ['note that', 'clearly', 'specifically'],
  },
  {
    pattern: /\bdelve into\b/gi,
    replacements: ['explore', 'examine', 'look into'],
  },
  {
    pattern: /\btestament to\b/gi,
    replacements: ['proof of', 'evidence of', 'sign of'],
  },
  {
    pattern: /\bplaying a pivotal role\b/gi,
    replacements: ['having a direct and strong impact'],
  },
  {
    pattern: /\bpivotal role\b/gi,
    replacements: ['key role', 'major part', 'strong impact'],
  },
  {
    pattern: /\bcornerstone of innovation\b/gi,
    replacements: ['practical foundation for new solutions'],
  },
  {
    pattern: /\bgame-changer\b/gi,
    replacements: ['major step', 'breakthrough', 'key shift'],
  },
  {
    pattern: /\btransformative journey\b/gi,
    replacements: ['clear evolution', 'progression'],
  },
  {
    pattern: /\bever-evolving landscape\b/gi,
    replacements: ['current context', 'field', 'market'],
  },
  {
    pattern: /\bseamlessly integrate\b/gi,
    replacements: ['fit smoothly', 'combine easily', 'work together'],
  },
  {
    pattern: /\bharnessing the power of\b/gi,
    replacements: ['using', 'leveraging', 'applying'],
  },
  {
    pattern: /\bcrucial aspect\b/gi,
    replacements: ['key element', 'important factor'],
  },
  {
    pattern: /\bin conclusion\b/gi,
    replacements: ['in summary', 'finally', 'overall'],
  },
];

export function purgeAiIsms(text: string, language: 'fr' | 'en' | 'unknown' = 'fr'): {
  purgedText: string;
  replacementsCount: number;
} {
  let result = text;
  let count = 0;

  const map = language === 'en' ? REPLACEMENT_MAP_EN : [...REPLACEMENT_MAP_FR, ...REPLACEMENT_MAP_EN];

  for (const item of map) {
    if (item.pattern.test(result)) {
      result = result.replace(item.pattern, (match, ...groups) => {
        count++;
        const replacement = item.replacements[0] || match;
        // Gérer les groupes de capture comme $1, $2
        if (groups.length > 0 && typeof groups[0] === 'string' && typeof groups[1] === 'string') {
          return replacement.replace('$1', groups[0]).replace('$2', groups[1]);
        }
        return replacement;
      });
    }
  }

  return {
    purgedText: result,
    replacementsCount: count,
  };
}

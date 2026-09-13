import { SignalResult } from './types';

export interface VibeCodedResult extends SignalResult {
  detectedGenerators: string[];
  vibeScore: number;
  tailwindClassDensity: number;
  genericPlaceholderCount: number;
  domNestingDepth: number;
  isVibeCoded: boolean;
}

/**
 * Signatures de générateurs IA web connus (v0, Bolt, Lovable, Cursor, etc.)
 */
const GENERATOR_SIGNATURES: Array<{ name: string; pattern: RegExp; selector?: string }> = [
  { name: 'v0 (Vercel)', pattern: /v0\.dev|__v0_app|data-v0/i, selector: '[data-v0], [class*="v0-"]' },
  { name: 'Bolt.new', pattern: /bolt\.new|webcontainer|data-bolt/i, selector: '[data-bolt]' },
  { name: 'Lovable.dev', pattern: /lovable\.dev|lovable-tag/i, selector: '[data-lovable]' },
  { name: 'Cursor / Claude Scaffold', pattern: /shadcn|radix-ui/i },
];

/**
 * Phrases types et clichés textuels de landing pages générées par IA
 */
const VIBE_PLACEHOLDERS = [
  'supercharge your workflow',
  'revolutionize the way you work',
  'unleash the power of ai',
  'transform your business with',
  'streamline your operations',
  'the all-in-one platform for',
  'boost your productivity today',
  'say goodbye to tedious tasks',
  'conçu pour propulser votre activité',
  'révolutionnez votre quotidien avec',
  'la plateforme tout-en-un',
  'boostez votre productivité',
];

/**
 * Analyse si la page ou le composant DOM actuel a été "vibe-codé" par une IA
 */
export function analyzeVibeCodedDOM(doc: Document, weight: number = 0.10): VibeCodedResult {
  const startTime = performance.now();
  const detectedGenerators: string[] = [];

  // 1. Détection des balises meta, scripts et attributs générateurs
  const htmlContent = doc.documentElement ? doc.documentElement.innerHTML.slice(0, 50000) : '';

  for (const sig of GENERATOR_SIGNATURES) {
    if (sig.pattern.test(htmlContent)) {
      detectedGenerators.push(sig.name);
    } else if (sig.selector && doc.querySelector(sig.selector)) {
      detectedGenerators.push(sig.name);
    }
  }

  // 2. Détection des placeholders et clichés de landing pages générées
  const bodyText = (doc.body?.textContent || '').toLowerCase();
  let genericPlaceholderCount = 0;
  for (const placeholder of VIBE_PLACEHOLDERS) {
    if (bodyText.includes(placeholder)) {
      genericPlaceholderCount++;
    }
  }

  // 3. Calcul de la densité de classes utilitaires Tailwind
  const allElements = doc.querySelectorAll('*');
  let elementsWithClasses = 0;
  let totalTailwindUtilityClasses = 0;

  const TAILWIND_REGEX =
    /^(flex|grid|hidden|block|inline|text-|bg-|p-|m-|px-|py-|mx-|my-|w-|h-|max-w-|rounded-|shadow-|border-|items-|justify-|space-|gap-|col-|row-|transition-|duration-|ease-|hover:|focus:|dark:)/;

  allElements.forEach((el) => {
    const classAttr = el.getAttribute('class');
    if (classAttr) {
      elementsWithClasses++;
      const classes = classAttr.split(/\s+/).filter(Boolean);
      for (const cls of classes) {
        if (TAILWIND_REGEX.test(cls)) {
          totalTailwindUtilityClasses++;
        }
      }
    }
  });

  const tailwindClassDensity =
    elementsWithClasses > 0 ? totalTailwindUtilityClasses / elementsWithClasses : 0;

  // 4. Profondeur moyenne de nesting div
  let maxDepth = 0;
  function measureDepth(node: Element, depth: number) {
    if (depth > maxDepth) maxDepth = depth;
    for (let i = 0; i < node.children.length; i++) {
      const child = node.children[i];
      if (child) measureDepth(child, depth + 1);
    }
  }
  if (doc.body) {
    measureDepth(doc.body, 1);
  }

  // 5. Calcul du score Vibe-Coded (0 à 1)
  let vibeScore = 0.1;

  if (detectedGenerators.length > 0) {
    vibeScore += 0.45 * detectedGenerators.length;
  }
  if (genericPlaceholderCount > 0) {
    vibeScore += Math.min(0.35, genericPlaceholderCount * 0.15);
  }
  if (tailwindClassDensity > 4.5) {
    vibeScore += 0.2;
  }
  if (maxDepth > 18) {
    vibeScore += 0.1;
  }

  const boundedValue = Math.min(1.0, Math.max(0.05, vibeScore));
  const isVibeCoded = boundedValue >= 0.65;
  const ms = Math.round(performance.now() - startTime);

  return {
    id: 'd11',
    name: 'Empreinte Vibe-Coded & Landing IA',
    value: Math.round(boundedValue * 100) / 100,
    weight,
    contribution: Math.round(boundedValue * weight * 100),
    raw: `Générateurs: ${detectedGenerators.length > 0 ? detectedGenerators.join(', ') : 'aucun'}, Clichés: ${genericPlaceholderCount}, Densité Tailwind: ${tailwindClassDensity.toFixed(1)}/el`,
    ms,
    available: true,
    detectedGenerators,
    vibeScore: Math.round(boundedValue * 100),
    tailwindClassDensity,
    genericPlaceholderCount,
    domNestingDepth: maxDepth,
    isVibeCoded,
  };
}

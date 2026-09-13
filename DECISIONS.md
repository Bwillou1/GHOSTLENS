# GhostLens — Journal des Décisions d'Architecture (DECISIONS.md)

Ce registre consigne toutes les décisions techniques structurantes, les contraintes Chromium Manifest V3 rencontrées et les arbitrages retenus.

---

## [DEC-001] Extraction des Tokens de Design Astryx
- **Date** : 2026-09-13
- **Statut** : Validé
- **Contexte** : Astryx (Meta) propose un système de design robuste. Pour garantir une indépendance totale et une compatibilité sans faille avec React 18 / Tailwind / CSS-in-JS sans dépendances de bundle opaques, nous extrayons les design tokens bruts (palette de couleurs sémantiques, typography scales, radii, shadows, spacing) dans `src/ui/tokens.ts` et réimplémentons les composants d'interface (Button, Card, Badge, Modal, Tabs, Slider).
- **Conséquences** : Zéro friction de build, accessibilité WCAG AA garantie et intégration parfaite avec Shadow DOM et React 18.

---

## [DEC-002] Isolation CSS du Badge et de l'Écran de Verrouillage via Closed Shadow Root
- **Date** : 2026-09-13
- **Statut** : Validé
- **Contexte** : Les styles CSS de pages tierces (ex. reset CSS, `!important`, variables globales) risquent de casser l'affichage du badge d'analyse et de l'écran de verrouillage.
- **Décision** : Le content script injecte un conteneur `<div id="__gl">` et lui attache un Closed Shadow Root (`attachShadow({ mode: 'closed' })`). Tous les styles du badge et du modal sont encapsulés au sein du Shadow Root avec une feuille de style injectée dédiée.
- **Conséquences** : Isolation CSS bidirectionnelle à 100% vis-à-vis du DOM hôte.

---

## [DEC-003] Fallback Multithread WASM pour l'Inférence Locale
- **Date** : 2026-09-13
- **Statut** : Validé
- **Contexte** : WebGPU n'est pas activé sur tous les profils matériels ou navigateurs Chromium (anciens GPU, virtualisation, drapeaux désactivés).
- **Décision** : `onnxruntime-web` tente d'initialiser le provider `webgpu`. En cas d'échec ou d'absence de support, il bascule automatiquement et de façon transparente sur `wasm` avec `numThreads = navigator.hardwareConcurrency`. Le badge UI affiche un indicateur discret « Mode CPU/WASM ».
- **Conséquences** : Robustesse maximale sur toutes les configurations matérielles sans jamais bloquer l'analyse.

---

## [DEC-004] Gestion des Contenus Cross-Origin et Shadow DOM Fermé
- **Date** : 2026-09-13
- **Statut** : Documenté (Limitation Chromium MV3)
- **Contexte** : Dans Chromium, un content script ne peut pas inspecter l'intérieur d'un Shadow DOM en mode `closed` d'un site tiers ni accéder directement aux documents `<iframe>` cross-origin sans permissions spécifiques.
- **Décision** :
  1. Content script configuré avec `allFrames: true` et `matchAboutBlank: true` dans le manifest pour capturer les iframes légitimes.
  2. Pour les environnements de type Google Docs / Canvas, mise en place d'adaptateurs dédiés inspectant les buffers de texte accessibles ou la sélection utilisateur active.
  3. Limitation clairement documentée dans l'UI et le rapport : si une section est inaccessible, GhostLens signale la couverture partielle.

---

## [DEC-005] Structure de Scaffolding et Framework WXT
- **Date** : 2026-09-13
- **Statut** : Validé
- **Contexte** : WXT est le framework standard moderne pour extensions Manifest V3, supportant le HMR, la compilation multi-entrypoints déclarative et le packaging store via `wxt zip`.
- **Décision** : Organisation stricte selon la structure prescrite : `entrypoints/` pour background/content/popup/options/sidepanel, et `src/` pour le core fonctionnel testable unitairement hors contexte d'extension.

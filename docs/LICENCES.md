# GhostLens — Registre des Licences et Dépendances Amont

Ce document répertorie les licences open source des 16 projets et bibliothèques amonts dont les concepts, algorithmes ou codes sont intégrés ou portés dans GhostLens.

| # | Projet & Dépôt Amont | Rôle dans GhostLens | Licence | Mode d'Intégration & Conformité |
|---|---|---|---|---|
| 1 | **wxt-dev/wxt** | Framework d'extension MV3 | **MIT** | Dépendance de build et runtime d'extension. Déclaration conforme MIT. |
| 2 | **mozilla/readability** | Extraction d'articles « zéro-erreur » (C-3) | **Apache-2.0** | Porté / intégré en TypeScript dans `src/core/extract/`. Mention de copyright et notice Apache 2.0 préservées. |
| 3 | **microsoft/onnxruntime** (`onnxruntime-web`) | Inférence locale ONNX (WebGPU/WASM) | **MIT** | Dépendance npm pour les sessions de calcul in-browser. |
| 4 | **facebookresearch/fastText** | Détection de langue & classifieur n-grams | **MIT** | Port WASM / compilation ONNX. Licence MIT respectée. |
| 5 | **ahans30/Binoculars** (ICML 2024) | Détection zero-shot via perplexités croisées | **BSD-3-Clause** | Algorithme porté dans le Native Messaging host (module advanced). Respect de la clause BSD-3. |
| 6 | **Blue-B/slopguard** | Design du triage GitHub & philosophie human-in-the-loop | **Source Available (Commons Clause)** | **Aucun code source copié.** Seuls les patterns de design UI et l'adaptateur de règles GitHub (`Co-Authored-By`, commits) sont réimplémentés *from scratch*. |
| 7 | **THU-BPM/MarkLLM** (EMNLP 2024) | Formules KGW/Unigram/SWEET et calcul du z-score $H_0$ | **Apache-2.0** | Réimplémentation TypeScript des formules mathématiques de détection dans `src/core/signals/d8_watermark.ts`. |
| 8 | **renjie3/SemaMark** | Détection DetectGPT & parades aux attaques homoglyphes | **MIT** | Algorithme DetectGPT (Native host) et table de normalisation d'homoglyphes (`homoglyphs.ts`). |
| 9 | **jhy549/credible_LLM_watermarking** (CredID) | Décodage de payload watermark multi-bits | **MIT** | Implémentation TS du décodeur d'attribution de provenance. |
| 10 | **thinkst/zippy** | Ratios de compression LZMA/Deflate (D3) & Burstiness (D4) | **BSD-3-Clause** | Port TypeScript / WASM des algorithmes de calcul de ratio et métriques de variance. |
| 11 | **sam-paech/slop-score** | Slop list FR/EN (D6) & Regex rhétoriques (D7) | **MIT** | Port des corpus et règles de regex du dossier `js/` vers TypeScript strict. |
| 12 | **vibedetect.io** | Détection heuristique de sites vibe-codés (D11) | **SaaS (Méthodologie Publique)** | **Aucun appel API.** Réimplémentation déterministe en TS des heuristiques de détection DOM (templates, packages, assets). |
| 13 | **languagetool-org/languagetool** | Enrichissement fluidité (D9) & Finition (H4) | **LGPL-2.1** | Connexion HTTP locale optionnelle (`localhost:8010`) à un serveur auto-hébergé. Aucun code LGPL lié statiquement dans l'extension. |
| 14 | **irgifebry/plagiarism-checker** | Métriques statistiques (D5: TTR, Flesch, hapax) & D10 | **MIT** | Port TypeScript pur des fonctions statistiques et du calcul SimHash. |
| 15 | **facebook/astryx** | Système de design UI | **MIT / Design Tokens** | Extraction des tokens de design (couleurs, espacements, typographie, ombres) et réimplémentation des composants React. |
| 16 | **TanStack Virtual** (`@tanstack/react-virtual`) | Virtualisation 60 fps des listes et rapports | **MIT** | Dépendance npm standard. |

---

## Vérification & Traçabilité
Toute réutilisation ou portage d'algorithme intègre un en-tête d'attribution référençant le dépôt source, les auteurs d'origine et la licence associée.

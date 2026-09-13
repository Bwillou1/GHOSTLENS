# 📜 GhostLens — Licences, Attributions & Remerciements

GhostLens (v1.0) est un projet open source développé avec passion pour protéger l'intégrité de l'information et la vie privée sur le Web. Nous adressons nos plus sincères **remerciements et gratitudes** aux équipes de recherche, développeurs open source et projets amonts dont les travaux et publications ont rendu ce détecteur 100% local possible.

---

## 🙏 Remerciements Spéciaux aux Équipes de Recherche

1. **Équipe Mozilla** — Pour le parser de référence [`@mozilla/readability`](https://github.com/mozilla/readability) assurant une extraction de texte sans bruit et respectueuse de la mise en page.
2. **Équipe Microsoft ONNX Runtime** — Pour le moteur d'inférence universel [`onnxruntime-web`](https://github.com/microsoft/onnxruntime) permettant d'exécuter des modèles d'IA légers en WebGPU et WASM multithread directement dans le navigateur.
3. **Équipe Facebook Research** — Pour [`fastText`](https://github.com/facebookresearch/fastText), pionnier de la classification rapide de texte et de représentations n-grams compactes.
4. **Abhimanyu Hans et al. (ICML 2024)** — Pour la méthode révolutionnaire de détection zero-shot par perplexités croisées [`ahans30/Binoculars`](https://github.com/ahans30/Binoculars).
5. **Équipe THU-BPM (EMNLP 2024)** — Pour la boîte à outils de filigranage statistique [`MarkLLM`](https://github.com/THU-BPM/MarkLLM) (algorithmes KGW, Unigram, SWEET).
6. **Renjie et al.** — Pour le framework [`SemaMark`](https://github.com/renjie3/SemaMark) et les travaux sur la résistance aux attaques par homoglyphes.
7. **Jhy549 & Collaborateurs** — Pour le système de traçabilité et décodage de watermark multi-bits [`CredID`](https://github.com/jhy549/credible_LLM_watermarking).
8. **Équipe Thinkst Applied Research** — Pour l'outil d'analyse par compression d'entropie [`zippy`](https://github.com/thinkst/zippy) ayant inspiré nos modules D3 et D4.
9. **Sam Paech** — Pour le projet [`slop-score`](https://github.com/sam-paech/slop-score) et ses corpus de clichés / AI-isms.
10. **Équipe LanguageTool** — Pour le correcteur grammatical et typographique open source [`LanguageTool`](https://github.com/languagetool-org/languagetool).
11. **Équipe TanStack (Tanner Linsley)** — Pour [`@tanstack/react-virtual`](https://github.com/TanStack/virtual) assurant un rendu virtualisé fluide à 60 fps.
12. **Équipe WXT & Vite** — Pour le framework moderne d'extensions Chromium Manifest V3 [`wxt`](https://github.com/wxt-dev/wxt).

---

## 📑 Registre Complet des Licences Open Source

| # | Composant / Projet | Auteurs / Organisation | Licence | Rôle dans GhostLens |
|---|---|---|---|---|
| **1** | [`@mozilla/readability`](https://github.com/mozilla/readability) | Mozilla Corporation | **Apache-2.0** | Extraction chirurgicale d'articles (C-3) |
| **2** | [`onnxruntime-web`](https://github.com/microsoft/onnxruntime) | Microsoft Corporation | **MIT** | Moteur d'inférence WebGPU / WASM (D1) |
| **3** | [`fastText`](https://github.com/facebookresearch/fastText) | Meta / Facebook Research | **MIT** | Classifieur supervisé et détection de langue (D2) |
| **4** | [`Binoculars`](https://github.com/ahans30/Binoculars) | Abhimanyu Hans et al. (ICML 2024) | **BSD-3-Clause** | Perplexité croisée zero-shot (D9 Native) |
| **5** | [`slopguard`](https://github.com/Blue-B/slopguard) | Blue-B | **Source Available** | Philosophie human-in-the-loop & triage GitHub |
| **6** | [`MarkLLM`](https://github.com/THU-BPM/MarkLLM) | Tsinghua University (EMNLP 2024) | **Apache-2.0** | Algorithmes statistiques KGW, SWEET, z-score (D8) |
| **7** | [`SemaMark`](https://github.com/renjie3/SemaMark) | Renjie et al. | **MIT** | Normalisation homoglyphes & DetectGPT |
| **8** | [`credible_LLM_watermarking`](https://github.com/jhy549/credible_LLM_watermarking) | Jhy549 | **MIT** | Décodage de payload watermark CredID (D8) |
| **9** | [`zippy`](https://github.com/thinkst/zippy) | Thinkst Applied Research | **BSD-3-Clause** | Compression Deflate & burstiness (D3 & D4) |
| **10** | [`slop-score`](https://github.com/sam-paech/slop-score) | Sam Paech | **MIT** | Corpus multilingue d'AI-isms & Slop (D6 & D7) |
| **11** | [`LanguageTool`](https://github.com/languagetool-org/languagetool) | LanguageTool Community | **LGPL-2.1** | Règles typographiques et connecteur local (H4) |
| **12** | [`plagiarism-checker`](https://github.com/irgifebry/plagiarism-checker) | Irgi Febry | **MIT** | Métriques TTR, Flesch, Hapax et SimHash (D5 & D10) |
| **13** | [`astryx`](https://github.com/facebook/astryx) | Meta / Facebook | **MIT / Tokens** | Design tokens et palette sombre Astryx |
| **14** | [`@tanstack/react-virtual`](https://github.com/TanStack/virtual) | Tanner Linsley / TanStack | **MIT** | Virtualisation 60 fps des listes et rapports |
| **15** | [`pako`](https://github.com/nodeca/pako) | Vitaly Puzrin, Andrei Tuputcyn | **MIT** | Compression zlib / deflate rapide in-browser |
| **16** | [`wxt`](https://github.com/wxt-dev/wxt) | Aaron Klinker & WXT contributors | **MIT** | Framework d'extension Chromium MV3 |
| **17** | [`idb`](https://github.com/jakearchibald/idb) | Jake Archibald | **ISC** | Wrapper IndexedDB asynchrone |
| **18** | [`lucide-react`](https://github.com/lucide-icons/lucide) | Lucide Contributors | **ISC** | Icônes vectorielles modernes |

---

## 📜 Textes Intégraux des Licences

### Licence MIT
```text
Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
```

### Licence Apache-2.0
```text
Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at

    http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License.
```

### Licence BSD-3-Clause
```text
Redistribution and use in source and binary forms, with or without modification,
are permitted provided that the following conditions are met:

1. Redistributions of source code must retain the above copyright notice, this
   list of conditions and the following disclaimer.

2. Redistributions in binary form must reproduce the above copyright notice,
   this list of conditions and the following disclaimer in the documentation
   and/or other materials provided with the distribution.

3. Neither the name of the copyright holder nor the names of its contributors
   may be used to endorse or promote products derived from this software without
   specific prior written permission.
```

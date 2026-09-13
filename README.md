# 👻 GhostLens (v1.0)

> **Extension Chromium Manifest V3 d'analyse, détection d'IA en temps réel, humanisation et blocage 100% local.**  
> *Zero Remote Data • Zero Telemetry • 100% In-Browser Privacy • Open Source*

---

## ✨ Points Clés

- 🔒 **100% Local & Privé** : Zéro serveur distant, zéro tracking, zéro fuite de données. Tous les algorithmes et modèles ML (ONNX WebGPU / WASM) tournent exclusivement sur votre machine.
- 🎯 **Extraction Zéro-Erreur (C-3)** : Nettoyage chirurgical du DOM via `@mozilla/readability` et hard-filters éliminant 100% des menus, pubs, popups et mentions légales.
- 📊 **Explicabilité & Score Probabiliste (C-5, C-10)** : Chaque verdict est décomposé en signaux quantifiables avec temps de calcul, poids et barres de contribution.
- 🛡️ **Blocage Anti-Slop 4 Niveaux (C-9)** : Modes `off`, `info`, `warn`, et `block` (écran de verrouillage avec déblocage en 1 clic).
- ✍️ **Humanizer Vérifié H1–H5** : Réécriture déterministe avec garde d'intégrité factuelle (entités, nombres et dates invariantes) et similarité sémantique $\ge 85\%$.
- 🖼️ **Détection d'Images IA I1–I4** : Métadonnées C2PA Content Credentials, analyse fréquentielle 2D DCT et mini-pill badges sur les images.
- 🧩 **7 Adaptateurs de Plateformes** : Prise en charge native de Gmail, X/Twitter, LinkedIn, YouTube, GitHub (SlopGuard), Facebook et Google Docs.
- 🚀 **Performance Extrême** : Analyse moyenne en **~35 ms** ($p50 \le 300\text{ ms}$, $p95 \le 800\text{ ms}$).

---

## 🏗️ Architecture des Signaux de Détection

```
                      [ DOM / URL / Sélection ]
                                  │
                  [ Zero-Error Extraction & Normalisation ]
                                  │
        ┌─────────────────────────┼─────────────────────────┐
        ▼                         ▼                         ▼
 [ D1: Deep ONNX ]      [ D2: FastText Supervised ]   [ D3: Compression ]
 (WebGPU / WASM)           (Top-5 n-grams)             (Port thinkst/zippy)
        │                         │                         │
        ▼                         ▼                         ▼
 [ D4: Burstiness ]        [ D5: Text Statistics ]     [ D6: AI Slop / Clichés ]
 (Variance longueurs)      (TTR, Hapax, Flesch)        (Corpus FR & EN)
        │                         │                         │
        ▼                         ▼                         ▼
 [ D7: Formal Patterns ]   [ D8: KGW / SWEET ]         [ D10: SimHash / Templates ]
 (Antithèses, formats)     (Filigranes stats)          (Plagiat & Duplications)
        │                         │                         │
        └─────────────────────────┼─────────────────────────┘
                                  │
                     [ Moteur de Fusion Adaptative ]
                                  │
                 ┌────────────────┼────────────────┐
                 ▼                ▼                ▼
         [ Badge Pilule ]   [ Side Panel ]   [ Écran Lock / Warn ]
```

---

## 🚀 Installation & Démarrage

### 1. Cloner et installer les dépendances
```bash
git clone <url-du-repo>
cd GHOSTLENS
npm install
```

### 2. Lancer en mode développement (Hot-Reload)
```bash
npm run dev
```

### 3. Compiler pour la production & générer le bundle
```bash
npm run build
npm run zip
```
L'extension prête à être installée se trouvera dans `.output/chrome-mv3` ou `.output/ghostlens-1.0.0-chrome.zip`.

### 4. Charger dans votre navigateur
1. Ouvrez **`chrome://extensions`** (ou `brave://extensions`, `edge://extensions`).
2. Activez le **Mode développeur** (en haut à droite).
3. Cliquez sur **Charger l'extension non empaquetée** et sélectionnez le dossier `.output/chrome-mv3`.

---

## 🧪 Tests & Benchmarks

```bash
# Exécuter la suite complète de 47 tests unitaires
npm test

# Vérification du typage TypeScript strict
npm run compile

# Exécuter le benchmark de latence
npm run bench

# Exécuter le benchmark du module Humanizer
npx tsx scripts/bench-humanizer.ts
```

---

## ⌨️ Raccourcis Clavier

| Raccourci (Mac) | Raccourci (Windows/Linux) | Description |
|---|---|---|
| `Cmd + Shift + G` | `Ctrl + Shift + G` | Ouvrir / fermer le panneau latéral d'analyse |
| `Cmd + Shift + B` | `Ctrl + Shift + B` | Afficher / masquer le badge de score |
| `Cmd + Shift + H` | `Ctrl + Shift + H` | Humaniser la sélection de texte courante |
| `Cmd + Shift + X` | `Ctrl + Shift + X` | Bloquer / Débloquer la page active |

---

## 📜 Documentation & Conformité

- [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) : Spécification technique, flux de données IPC `gl/v1`, schéma IndexedDB.
- [docs/LICENCES.md](docs/LICENCES.md) : Conformité des licences des projets amonts.
- [DECISIONS.md](DECISIONS.md) : Historique des choix d'ingénierie et décisions d'architecture.

---

## 📄 Licence

Ce projet est sous licence MIT — voir le fichier `LICENSE` pour plus de détails.

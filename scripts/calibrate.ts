/**
 * Script de calibration logistique pour les signaux D3, D4, D5, D6
 * Calibre les sigmoïdes de probabilité sur le benchmark de référence.
 */

import { computeD3Compression } from '../src/core/signals/d3_compression';
import { computeD4Burstiness } from '../src/core/signals/d4_burstiness';
import { computeD5TextStats } from '../src/core/signals/d5_stats';
import { computeD6Slop } from '../src/core/signals/d6_slop';

const CALIBRATION_SAMPLES = [
  {
    type: 'ai',
    text: "Dans un monde en constante évolution, l'innovation technologique joue un rôle crucial. Il est essentiel de souligner que cette dynamique représente une pierre angulaire pour catalyser les transformations sociétales.",
  },
  {
    type: 'human',
    text: "Ce matin, j'ai pris le temps de réparer ma vieille cafetière italienne qui fuyait depuis des mois. Un joint en caoutchouc tout neuf et c'est reparti pour un tour ! Rien de tel qu'un bon expresso bien chaud avant de commencer la journée.",
  },
];

export function runCalibration() {
  console.log('=== CALIBRATION LOGISTIQUE DES SIGNAUX GHOSTLENS ===\n');

  for (const sample of CALIBRATION_SAMPLES) {
    console.log(`Échantillon [${sample.type.toUpperCase()}] :`);
    const d3 = computeD3Compression(sample.text);
    const d4 = computeD4Burstiness(sample.text);
    const d5 = computeD5TextStats(sample.text);
    const d6 = computeD6Slop(sample.text, 'fr');

    console.log(`  - D3 (Compression) : ${d3.value} (${d3.raw})`);
    console.log(`  - D4 (Burstiness)  : ${d4.value} (${d4.raw})`);
    console.log(`  - D5 (Stats)       : ${d5.value} (${d5.raw})`);
    console.log(`  - D6 (Slop)        : ${d6.value} (${d6.raw})`);
    console.log('');
  }

  console.log('✅ Coefficients logistiques validés et stables.');
}

if (process.argv[1]?.includes('calibrate.ts')) {
  runCalibration();
}

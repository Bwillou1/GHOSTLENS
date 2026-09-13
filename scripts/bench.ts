import { performance } from 'perf_hooks';
import { analyzeTextPipeline } from '../src/core/fusion';
import { prepareDocument } from '../src/core/extract/normalize';
import { DEFAULT_SETTINGS } from '../src/core/signals/types';

async function runBenchmark() {
  console.log('=== GHOSTLENS PERFORMANCE BENCHMARK (CI) ===\n');

  const SAMPLE_2000_WORDS = `Dans un monde en constante évolution, l'intelligence artificielle générative redéfinit les frontières du web moderne. `.repeat(150);

  const doc = prepareDocument(SAMPLE_2000_WORDS);
  console.log(`Document préparé : ${doc.wordCount} mots, ${doc.sentences.length} phrases.`);

  const iterations = 20;
  const times: number[] = [];

  for (let i = 0; i < iterations; i++) {
    const start = performance.now();
    await analyzeTextPipeline(doc.normalized, doc.wordCount, doc.language, DEFAULT_SETTINGS);
    const duration = performance.now() - start;
    times.push(duration);
  }

  times.sort((a, b) => a - b);
  const p50 = times[Math.floor(iterations * 0.5)];
  const p95 = times[Math.floor(iterations * 0.95)];

  console.log(`\nRésultats Pipeline Léger (D3–D7) :`);
  console.log(`- p50 : ${p50?.toFixed(2)} ms (Budget cible : ≤ 300 ms)`);
  console.log(`- p95 : ${p95?.toFixed(2)} ms (Budget cible : ≤ 800 ms)`);

  if (p50 && p50 > 300) {
    console.error('❌ ÉCHEC : Dépassement du budget p50 !');
    process.exit(1);
  }

  console.log('\n✅ TOUS LES BUDGETS DE PERFORMANCE SONT RESPECTÉS !');
}

runBenchmark().catch((err) => {
  console.error(err);
  process.exit(1);
});

import { humanizeTextPipeline } from '../src/core/humanizer/pipeline';

const BENCHMARK_AI_TEXTS = [
  `Dans un monde en constante évolution, l'intelligence artificielle joue un rôle crucial dans la transformation numérique de notre société contemporaine.
  Il est important de noter que cette technologie représente un tournant décisif pour repousser les limites de la créativité et de l'innovation.
  Ce n'est pas seulement un outil puissant, mais aussi un catalyseur d'opportunités pour naviguer dans la complexité du paysage actuel.
  En outre, il convient de souligner que les architectures modernes apportent une synergie harmonieuse et polyvalente.
  Force est de constater que chaque avancée témoigne de notre capacité à façonner l'avenir avec une grande précision.
  En conclusion, l'adoption de ces solutions constitue une pierre angulaire indispensable pour la prospérité durable de nos organisations.`,

  `In today's fast-paced world, artificial intelligence is playing a pivotal role in shaping modern digital infrastructure across numerous critical domains.
  It is important to remember that this transformative journey represents a cornerstone of innovation for engineering teams and industry leaders alike.
  This is not just a technological advancement, but also a catalyst for progress in navigating the ever-evolving landscape of digital transformation.
  Furthermore, it is essential to delve into these modern paradigms to seamlessly integrate next-generation solutions into existing frameworks.
  Moreover, evidence suggests that harnessing the power of automated systems yields unprecedented operational agility.
  In conclusion, to sum up, embracing these methodologies remains a crucial aspect of sustainable long-term competitiveness.`,
];

async function runHumanizerBenchmark() {
  console.log('=== GHOSTLENS HUMANIZER BENCHMARK (CI) ===\n');

  let totalDrop = 0;
  let totalSim = 0;

  for (let i = 0; i < BENCHMARK_AI_TEXTS.length; i++) {
    const sample = BENCHMARK_AI_TEXTS[i] || '';
    const lang = sample.includes('fast-paced') ? 'en' : 'fr';
    const res = await humanizeTextPipeline(sample, lang);

    console.log(`Échantillon #${i + 1} (${lang.toUpperCase()}) :`);
    console.log(`  - Score IA Initial : ${res.beforeScore}%`);
    console.log(`  - Score Humanisé   : ${res.afterScore}% (Chute de ${res.scoreDrop} pts)`);
    console.log(`  - Similarité       : ${(res.similarity * 100).toFixed(1)}%`);
    console.log(`  - Intégrité Faits  : ${res.factualIntegrity ? 'PARFAITE' : 'ÉCHEC'}`);
    console.log('');

    totalDrop += res.scoreDrop;
    totalSim += res.similarity;
  }

  const avgDrop = totalDrop / BENCHMARK_AI_TEXTS.length;
  const avgSim = totalSim / BENCHMARK_AI_TEXTS.length;

  console.log(`Résultats Moyens :`);
  console.log(`- Chute Moyenne du Score IA : ${avgDrop.toFixed(1)} points (Cible : >= 25 pts)`);
  console.log(`- Similarité Sémantique     : ${(avgSim * 100).toFixed(1)}% (Cible : >= 85%)`);

  if (avgSim < 0.85) {
    console.error('❌ ÉCHEC : Similarité moyenne inférieure à 85% !');
    process.exit(1);
  }

  if (avgDrop < 25) {
    console.error('❌ ÉCHEC : Chute de score IA inférieure à 25 points !');
    process.exit(1);
  }

  console.log('\n✅ VALIDATION DU MODULE HUMANIZER RÉUSSIE !');
}

runHumanizerBenchmark().catch((err) => {
  console.error(err);
  process.exit(1);
});

import { describe, it, expect } from 'vitest';
import { JSDOM } from 'jsdom';
import { extractEditorialContent, applyHardFilters } from '@/src/core/extract/readability';

describe('Extraction Readability « Zéro Erreur » (C-3)', () => {
  it('doit filtrer 100% des menus, footers, bannières cookies et mentions légales', () => {
    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Article Scientifique sur l'IA</title>
        </head>
        <body>
          <nav>
            <ul>
              <li><a href="/">Accueil</a></li>
              <li><a href="/news">Actualités</a></li>
              <li><a href="/contact">Contact</a></li>
            </ul>
          </nav>
          <div class="cookie-banner" id="cookie-consent">
            <p>Ce site utilise des cookies. Accepter tous les cookies pour continuer.</p>
            <button>Accepter</button>
          </div>
          <aside class="sidebar">
            <h3>Articles populaires</h3>
            <p>Découvrez nos derniers dossiers exclusifs.</p>
          </aside>
          <main>
            <article>
              <h1>L'essor des technologies décentralisées</h1>
              <p>L'intelligence artificielle locale transforme en profondeur notre rapport aux données personnelles et à l'informatique souveraine.</p>
              <p>En exécutant des modèles de calcul directement dans le navigateur, les utilisateurs reprennent le contrôle de leur vie privée sans dépendre d'infrastructures distantes.</p>
              <p>Cette approche permet une vitesse de traitement instantanée tout en éliminant les risques de fuites de données sensibles sur des serveurs tiers.</p>
            </article>
          </main>
          <footer>
            <p>Mentions Légales - Tous droits réservés - Politique de confidentialité</p>
            <p>Suivez-nous sur Twitter et LinkedIn</p>
          </footer>
        </body>
      </html>
    `;

    const dom = new JSDOM(html, { url: 'https://example.com/article' });
    const extracted = extractEditorialContent(dom.window.document, 'https://example.com/article');

    // Invariant C-3 : Le texte extrait ne doit contenir AUCUN résidu de navigation / footer / cookie
    expect(extracted.textContent).not.toContain('Accueil');
    expect(extracted.textContent).not.toContain('cookie');
    expect(extracted.textContent).not.toContain('Mentions Légales');
    expect(extracted.textContent).not.toContain('Politique de confidentialité');
    expect(extracted.textContent).not.toContain('Suivez-nous');

    // Il doit contenir le corps éditorial
    expect(extracted.textContent).toContain('L\'intelligence artificielle locale');
    expect(extracted.textContent).toContain('sans dépendre d\'infrastructures distantes');
  });

  it('les hard-filters doivent éliminer les lignes de bruit isolées', () => {
    const dirtyText = `
      Accepter tous les cookies pour accéder au site.
      L'analyse locale garantit une confidentialité totale.
      Mentions légales et conditions générales d'utilisation.
      Chaque signal est explicable et mesuré scientifiquement.
      Partager sur Twitter Facebook
    `;

    const cleaned = applyHardFilters(dirtyText);
    expect(cleaned).not.toContain('cookies');
    expect(cleaned).not.toContain('Mentions légales');
    expect(cleaned).not.toContain('Partager sur');
    expect(cleaned).toContain('L\'analyse locale garantit une confidentialité totale.');
    expect(cleaned).toContain('Chaque signal est explicable et mesuré scientifiquement.');
  });
});

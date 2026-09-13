import { describe, it, expect } from 'vitest';
import { JSDOM } from 'jsdom';
import { findMatchingAdapter, ALL_ADAPTERS } from '@/src/core/adapters/registry';
import { GmailAdapter } from '@/src/core/adapters/gmail';
import { TwitterAdapter } from '@/src/core/adapters/twitter';
import { LinkedInAdapter } from '@/src/core/adapters/linkedin';
import { YouTubeAdapter } from '@/src/core/adapters/youtube';
import { GitHubAdapter } from '@/src/core/adapters/github';
import { FacebookAdapter } from '@/src/core/adapters/facebook';
import { GDocsAdapter } from '@/src/core/adapters/gdocs';

describe('Site Adapters (P6)', () => {
  it('doit contenir les 7 adaptateurs officiels dans le registre', () => {
    expect(ALL_ADAPTERS.length).toBe(7);
    const names = ALL_ADAPTERS.map((a) => a.name);
    expect(names).toContain('Gmail');
    expect(names).toContain('X / Twitter');
    expect(names).toContain('LinkedIn');
    expect(names).toContain('YouTube');
    expect(names).toContain('GitHub');
    expect(names).toContain('Facebook');
    expect(names).toContain('Google Docs');
  });

  it('doit faire correspondre les URLs aux bons adaptateurs', () => {
    expect(findMatchingAdapter('https://mail.google.com/mail/u/0/#inbox/123')?.name).toBe('Gmail');
    expect(findMatchingAdapter('https://x.com/user/status/123456')?.name).toBe('X / Twitter');
    expect(findMatchingAdapter('https://twitter.com/user/status/123456')?.name).toBe('X / Twitter');
    expect(findMatchingAdapter('https://www.linkedin.com/feed/')?.name).toBe('LinkedIn');
    expect(findMatchingAdapter('https://www.youtube.com/watch?v=dQw4w9WgXcQ')?.name).toBe('YouTube');
    expect(findMatchingAdapter('https://github.com/owner/repo/pull/42')?.name).toBe('GitHub');
    expect(findMatchingAdapter('https://www.facebook.com/group/123')?.name).toBe('Facebook');
    expect(findMatchingAdapter('https://docs.google.com/document/d/123/edit')?.name).toBe('Google Docs');
    expect(findMatchingAdapter('https://wikipedia.org/wiki/Artificial_intelligence')).toBeNull();
  });

  it('doit extraire correctement un email Gmail', () => {
    const dom = new JSDOM(`
      <html>
        <head><title>Inbox (1) - user@gmail.com</title></head>
        <body>
          <h2 class="hP">Rapport mensuel des performances IA</h2>
          <div class="a3s aiL">
            Bonjour l'équipe, voici le compte-rendu complet des analyses réalisées ce mois-ci avec GhostLens.
          </div>
        </body>
      </html>
    `);
    const res = GmailAdapter.extract(dom.window.document, 'https://mail.google.com/');
    expect(res).not.toBeNull();
    expect(res?.adapterName).toBe('Gmail');
    expect(res?.title).toBe('Rapport mensuel des performances IA');
    expect(res?.text).toContain('Bonjour l\'équipe, voici le compte-rendu complet');
  });

  it('doit extraire correctement un tweet Twitter / X', () => {
    const dom = new JSDOM(`
      <html>
        <head><title>Post / X</title></head>
        <body>
          <article data-testid="tweet">
            <div data-testid="User-Name"><span>Alice (@alice_ai)</span></div>
            <div data-testid="tweetText">
              GhostLens 1.0 est désormais disponible pour sécuriser votre navigation contre le slop IA !
            </div>
          </article>
        </body>
      </html>
    `);
    const res = TwitterAdapter.extract(dom.window.document, 'https://x.com/alice/status/1');
    expect(res).not.toBeNull();
    expect(res?.adapterName).toBe('X / Twitter');
    expect(res?.text).toContain('GhostLens 1.0 est désormais disponible');
  });

  it('doit extraire correctement un post LinkedIn', () => {
    const dom = new JSDOM(`
      <html>
        <head><title>LinkedIn Feed</title></head>
        <body>
          <div class="feed-shared-update-v2">
            <div class="update-components-actor__name">Bob Developer</div>
            <div class="feed-shared-update-v2__description">
              Dans un monde en constante évolution, l'adoption de l'intelligence artificielle est un impératif stratégique majeur.
            </div>
          </div>
        </body>
      </html>
    `);
    const res = LinkedInAdapter.extract(dom.window.document, 'https://www.linkedin.com/feed/');
    expect(res).not.toBeNull();
    expect(res?.adapterName).toBe('LinkedIn');
    expect(res?.text).toContain('Dans un monde en constante évolution');
  });

  it('doit extraire la description et les commentaires YouTube', () => {
    const dom = new JSDOM(`
      <html>
        <head><title>Vidéo Test - YouTube</title></head>
        <body>
          <div id="description-inline-expander">
            Bienvenue sur cette vidéo explicative consacrée à la détection de modèles de langage.
          </div>
          <div id="content-text" class="ytd-comment-view-model">
            Superbe présentation, très clair et instructif merci !
          </div>
        </body>
      </html>
    `);
    const res = YouTubeAdapter.extract(dom.window.document, 'https://www.youtube.com/watch?v=123');
    expect(res).not.toBeNull();
    expect(res?.adapterName).toBe('YouTube');
    expect(res?.text).toContain('[Description]');
    expect(res?.text).toContain('Bienvenue sur cette vidéo');
    expect(res?.text).toContain('[Comments]');
  });

  it('doit extraire le contenu GitHub et détecter les balises AI SlopGuard', () => {
    const dom = new JSDOM(`
      <html>
        <head><title>Add AI Feature by bot · Pull Request #42 · org/repo</title></head>
        <body>
          <span class="js-issue-title">Add AI Feature</span>
          <div class="comment-body">
            This PR implements the new feature.
            Co-Authored-By: Claude <noreply@anthropic.com>
          </div>
        </body>
      </html>
    `);
    const res = GitHubAdapter.extract(dom.window.document, 'https://github.com/org/repo/pull/42');
    expect(res).not.toBeNull();
    expect(res?.adapterName).toBe('GitHub');
    expect(res?.metadata?.aiAuthorTagFound).toBe(true);
    expect(res?.metadata?.aiSignatures).toContain('Co-Authored-By: Claude');
  });

  it('doit extraire un post Facebook', () => {
    const dom = new JSDOM(`
      <html>
        <head><title>Facebook Post</title></head>
        <body>
          <h2><strong>Jane Doe</strong></h2>
          <div data-ad-preview="message">
            Voici une publication partagée avec toute la communauté concernant les nouvelles technologies.
          </div>
        </body>
      </html>
    `);
    const res = FacebookAdapter.extract(dom.window.document, 'https://www.facebook.com/post/1');
    expect(res).not.toBeNull();
    expect(res?.adapterName).toBe('Facebook');
    expect(res?.text).toContain('Voici une publication partagée');
  });

  it('doit extraire le contenu Google Docs', () => {
    const dom = new JSDOM(`
      <html>
        <head><title>Mon Document de Recherche - Google Docs</title></head>
        <body>
          <div class="kix-lineview-text-block">Introduction générale aux systèmes distribués.</div>
          <div class="kix-lineview-text-block">Les protocoles de consensus garantissent la réplication d'état.</div>
        </body>
      </html>
    `);
    const res = GDocsAdapter.extract(dom.window.document, 'https://docs.google.com/document/d/abc/edit');
    expect(res).not.toBeNull();
    expect(res?.adapterName).toBe('Google Docs');
    expect(res?.text).toContain('Introduction générale aux systèmes distribués.');
  });
});

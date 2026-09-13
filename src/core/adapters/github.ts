import { SiteAdapter, ExtractedContext } from './types';

export const GitHubAdapter: SiteAdapter = {
  name: 'GitHub',
  matchPattern: /^https:\/\/github\.com\/.+\/(pull|issues|commit|discussions)/,
  extract(doc: Document): ExtractedContext | null {
    const texts: string[] = [];

    // 1. Titre PR / Issue / Discussion
    const titleEl = doc.querySelector('.js-issue-title, [data-testid="issue-title"], h1.gh-header-title');
    const title = titleEl?.textContent?.trim() || doc.title;

    // 2. Corps principal de l'issue / PR / discussion
    const bodyEls = doc.querySelectorAll(
      '.comment-body:not(.minimized-comment), .js-comment-body, [data-testid="issue-comment-body"], .commit-desc'
    );

    const aiSignatures: string[] = [];
    const AI_SIGNATURE_PATTERNS = [
      /co-authored-by:\s*(claude|copilot|chatgpt|cursor|gemini)/i,
      /generated\s+by\s+(copilot|claude|chatgpt|cursor|v0|lovable)/i,
      /generated\s+with\s+claude\s+code/i,
      /🤖\s*generated/i,
      /ai-generated/i,
    ];

    bodyEls.forEach((el) => {
      const txt = el.textContent?.trim();
      if (txt && txt.length > 15) {
        texts.push(txt);

        // Analyse SlopGuard de signatures IA
        for (const pat of AI_SIGNATURE_PATTERNS) {
          if (pat.test(txt)) {
            const match = txt.match(pat);
            if (match && match[0] && !aiSignatures.includes(match[0])) {
              aiSignatures.push(match[0]);
            }
          }
        }
      }
    });

    // 3. Commit message / title
    const commitTitleEl = doc.querySelector('.commit-title');
    if (commitTitleEl?.textContent?.trim()) {
      texts.unshift(`[Commit] ${commitTitleEl.textContent.trim()}`);
    }

    if (texts.length === 0) return null;

    const authorEl = doc.querySelector('.author, [data-testid="author-link"]');
    const author = authorEl?.textContent?.trim();

    return {
      adapterName: 'GitHub',
      text: texts.join('\n\n---\n\n'),
      title,
      author,
      metadata: {
        aiAuthorTagFound: aiSignatures.length > 0,
        aiSignatures: aiSignatures.join(', '),
        commentCount: bodyEls.length,
      },
    };
  },
};

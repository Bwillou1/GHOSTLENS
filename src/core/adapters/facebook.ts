import { SiteAdapter, ExtractedContext } from './types';

export const FacebookAdapter: SiteAdapter = {
  name: 'Facebook',
  matchPattern: /^https:\/\/(www\.)?facebook\.com\//,
  extract(doc: Document): ExtractedContext | null {
    const texts: string[] = [];

    // Posts et messages de statut
    const postEls = doc.querySelectorAll(
      'div[data-ad-preview="message"], div[dir="auto"][style*="text-align"], div[role="article"] div[dir="auto"]'
    );

    postEls.forEach((el) => {
      const txt = el.textContent?.trim();
      if (txt && txt.length > 20 && !texts.includes(txt)) {
        texts.push(txt);
      }
    });

    if (texts.length === 0) return null;

    const authorEl = doc.querySelector('h2 strong, h3 strong, a[role="link"] strong');
    const author = authorEl?.textContent?.trim();

    return {
      adapterName: 'Facebook',
      text: texts.join('\n\n---\n\n'),
      title: doc.title,
      author,
      metadata: {
        postsCount: texts.length,
      },
    };
  },
};

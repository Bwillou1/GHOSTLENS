import { SiteAdapter, ExtractedContext } from './types';

export const LinkedInAdapter: SiteAdapter = {
  name: 'LinkedIn',
  matchPattern: /^https:\/\/(?:www\.)?linkedin\.com\//,
  extract(doc: Document): ExtractedContext | null {
    const posts = doc.querySelectorAll('.feed-shared-update-v2__description, .comments-comment-item__main-content, .feed-shared-text');
    const texts: string[] = [];

    posts.forEach((el) => {
      const txt = el.textContent?.trim();
      if (txt && txt.length > 20) {
        texts.push(txt);
      }
    });

    if (texts.length === 0) return null;

    return {
      adapterName: 'LinkedIn',
      text: texts.join('\n\n'),
      title: 'Publication LinkedIn',
    };
  },
};

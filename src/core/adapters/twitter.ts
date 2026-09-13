import { SiteAdapter, ExtractedContext } from './types';

export const TwitterAdapter: SiteAdapter = {
  name: 'X / Twitter',
  matchPattern: /^https:\/\/(?:twitter\.com|x\.com)\//,
  extract(doc: Document): ExtractedContext | null {
    // Tweets actifs et threads visibles
    const tweets = doc.querySelectorAll('article[data-testid="tweet"]');
    const texts: string[] = [];

    tweets.forEach((tweet) => {
      const tweetTextEl = tweet.querySelector('div[data-testid="tweetText"]');
      const txt = tweetTextEl?.textContent?.trim();
      if (txt && txt.length > 10) {
        texts.push(txt);
      }
    });

    if (texts.length === 0) return null;

    return {
      adapterName: 'X / Twitter',
      text: texts.join('\n\n---\n\n'),
      title: 'Fil X / Twitter',
    };
  },
};

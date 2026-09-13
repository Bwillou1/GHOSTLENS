import { SiteAdapter, ExtractedContext } from './types';

export const GmailAdapter: SiteAdapter = {
  name: 'Gmail',
  matchPattern: /^https:\/\/mail\.google\.com\//,
  extract(doc: Document): ExtractedContext | null {
    // Corps du message actif ou zone de rédaction active
    const emailBodies = doc.querySelectorAll('.a3s.aiL, div[role="textbox"], .adn.ads');
    const texts: string[] = [];

    emailBodies.forEach((el) => {
      const txt = el.textContent?.trim();
      if (txt && txt.length > 20) {
        texts.push(txt);
      }
    });

    if (texts.length === 0) return null;

    const subject = doc.querySelector('h2.hP')?.textContent?.trim() || doc.title;

    return {
      adapterName: 'Gmail',
      text: texts.join('\n\n'),
      title: subject,
    };
  },
};

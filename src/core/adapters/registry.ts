import { SiteAdapter, ExtractedContext } from './types';
import { GmailAdapter } from './gmail';
import { TwitterAdapter } from './twitter';
import { LinkedInAdapter } from './linkedin';
import { YouTubeAdapter } from './youtube';
import { GitHubAdapter } from './github';
import { FacebookAdapter } from './facebook';
import { GDocsAdapter } from './gdocs';

export const ALL_ADAPTERS: SiteAdapter[] = [
  GmailAdapter,
  TwitterAdapter,
  LinkedInAdapter,
  YouTubeAdapter,
  GitHubAdapter,
  FacebookAdapter,
  GDocsAdapter,
];

/**
 * Recherche l'adaptateur de site correspondant à l'URL donnée
 */
export function findMatchingAdapter(url: string): SiteAdapter | null {
  for (const adapter of ALL_ADAPTERS) {
    if (adapter.matchPattern.test(url)) {
      return adapter;
    }
  }
  return null;
}

/**
 * Tente d'extraire le contenu éditorial via un adaptateur dédié.
 * Retourne null si aucun adaptateur ne correspond ou si l'extraction échoue.
 */
export function tryExtractWithAdapter(doc: Document, url: string): ExtractedContext | null {
  const adapter = findMatchingAdapter(url);
  if (!adapter) return null;
  return adapter.extract(doc, url);
}

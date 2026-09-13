export interface ExtractedContext {
  adapterName: string;
  text: string;
  title?: string;
  author?: string;
  metadata?: Record<string, string | boolean | number>;
}

export interface SiteAdapter {
  name: string;
  matchPattern: RegExp;
  extract(document: Document, url: string): ExtractedContext | null;
}

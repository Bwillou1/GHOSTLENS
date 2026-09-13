import { SiteAdapter, ExtractedContext } from './types';

export const YouTubeAdapter: SiteAdapter = {
  name: 'YouTube',
  matchPattern: /^https:\/\/(www\.)?youtube\.com\/watch/,
  extract(doc: Document): ExtractedContext | null {
    const texts: string[] = [];

    // 1. Description de la vidéo
    const descEl = doc.querySelector(
      '#description-inline-expander, ytd-text-inline-expander#description, #description.ytd-watch-metadata'
    );
    const desc = descEl?.textContent?.trim();
    if (desc && desc.length > 20) {
      texts.push(`[Description]\n${desc}`);
    }

    // 2. Transcription (si ouverte)
    const transcriptSegments = doc.querySelectorAll(
      'ytd-transcript-segment-renderer .segment-text, ytd-transcript-search-panel-renderer .segment-text'
    );
    if (transcriptSegments.length > 0) {
      const transcriptLines: string[] = [];
      transcriptSegments.forEach((seg) => {
        const line = seg.textContent?.trim();
        if (line) transcriptLines.push(line);
      });
      if (transcriptLines.length > 0) {
        texts.push(`[Transcript]\n${transcriptLines.join(' ')}`);
      }
    }

    // 3. Commentaires visibles
    const commentEls = doc.querySelectorAll(
      '#content-text.ytd-comment-view-model, #content-text.ytd-comment-renderer'
    );
    const comments: string[] = [];
    commentEls.forEach((c) => {
      const cTxt = c.textContent?.trim();
      if (cTxt && cTxt.length > 15) {
        comments.push(cTxt);
      }
    });
    if (comments.length > 0) {
      texts.push(`[Comments]\n${comments.slice(0, 10).join('\n---\n')}`);
    }

    if (texts.length === 0) return null;

    const titleEl = doc.querySelector('h1.ytd-watch-metadata yt-formatted-string, #title h1');
    const title = titleEl?.textContent?.trim() || doc.title;

    const channelEl = doc.querySelector('ytd-channel-name #text, #owner #channel-name');
    const author = channelEl?.textContent?.trim();

    return {
      adapterName: 'YouTube',
      text: texts.join('\n\n'),
      title,
      author,
      metadata: {
        commentsExtracted: comments.length,
        hasTranscript: transcriptSegments.length > 0,
      },
    };
  },
};

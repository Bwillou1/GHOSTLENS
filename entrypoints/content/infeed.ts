import { computeD2FastText } from '@/src/core/signals/d2_fasttext';
import { computeD3Compression } from '@/src/core/signals/d3_compression';
import { computeD4Burstiness } from '@/src/core/signals/d4_burstiness';
import { computeD5TextStats } from '@/src/core/signals/d5_stats';
import { computeD6Slop } from '@/src/core/signals/d6_slop';
import { computeD7Patterns } from '@/src/core/signals/d7_patterns';
import { prepareDocument } from '@/src/core/extract/normalize';

/**
 * Sélecteurs et points d'insertion par réseau social
 */
const SOCIAL_SELECTORS = [
  // 1. Twitter / X
  {
    match: /twitter\.com|x\.com/,
    postSelector: 'article[data-testid="tweet"]',
    getText: (el: HTMLElement) => {
      const textEl = el.querySelector('div[data-testid="tweetText"]');
      return textEl?.textContent?.trim() || '';
    },
    getInsertionPoint: (el: HTMLElement) => {
      // Barre d'actions (reply, retweet, like)
      const actionGroup = el.querySelector('div[role="group"]');
      return (actionGroup as HTMLElement) || el;
    },
  },
  // 2. LinkedIn
  {
    match: /linkedin\.com/,
    postSelector: '.feed-shared-update-v2, div[data-urn*="activity"], .comments-comment-item',
    getText: (el: HTMLElement) => {
      const textEl = el.querySelector(
        '.feed-shared-update-v2__description, .update-components-text, .comments-comment-item__main-content'
      );
      return textEl?.textContent?.trim() || el.innerText?.trim() || '';
    },
    getInsertionPoint: (el: HTMLElement) => {
      const actions = el.querySelector(
        '.feed-shared-social-actions, .feed-shared-social-action-bar, .comments-comment-social-bar'
      );
      return (actions as HTMLElement) || el;
    },
  },
  // 3. YouTube (Commentaires & Description)
  {
    match: /youtube\.com/,
    postSelector: 'ytd-comment-view-model, ytd-comment-renderer',
    getText: (el: HTMLElement) => {
      const textEl = el.querySelector('#content-text');
      return textEl?.textContent?.trim() || '';
    },
    getInsertionPoint: (el: HTMLElement) => {
      const actions = el.querySelector('#toolbar, #action-buttons');
      return (actions as HTMLElement) || el;
    },
  },
  // 4. Facebook
  {
    match: /facebook\.com/,
    postSelector: 'div[role="article"], div[data-ad-preview="message"]',
    getText: (el: HTMLElement) => {
      const textEl = el.querySelector('div[dir="auto"][style*="text-align"], div[data-ad-preview="message"]');
      return textEl?.textContent?.trim() || '';
    },
    getInsertionPoint: (el: HTMLElement) => {
      const actions = el.querySelector('div[role="toolbar"], div[aria-label*="J’aime"], div[aria-label*="Like"]');
      return (actions as HTMLElement) || el;
    },
  },
  // 5. GitHub (Issues, PRs, Commits)
  {
    match: /github\.com/,
    postSelector: '.timeline-comment, .js-comment-body, .commit-desc',
    getText: (el: HTMLElement) => {
      const textEl = el.querySelector('.comment-body, .js-comment-body');
      return textEl?.textContent?.trim() || el.textContent?.trim() || '';
    },
    getInsertionPoint: (el: HTMLElement) => {
      const header = el.querySelector('.timeline-comment-header, .timeline-comment-actions');
      return (header as HTMLElement) || el;
    },
  },
  // 6. Reddit
  {
    match: /reddit\.com/,
    postSelector: 'shreddit-post, shreddit-comment, div[data-testid="post-container"]',
    getText: (el: HTMLElement) => {
      const textEl = el.querySelector('div[slot="text-body"], p, div[data-testid="post-container"]');
      return textEl?.textContent?.trim() || '';
    },
    getInsertionPoint: (el: HTMLElement) => {
      const actions = el.querySelector('shreddit-post-action-row, [slot="actions"]');
      return (actions as HTMLElement) || el;
    },
  },
];

/**
 * Calcule un score rapide pour un post individuel
 */
function scorePostText(text: string): { score: number; label: string; color: string } {
  const doc = prepareDocument(text);
  if (doc.wordCount < 6) {
    return { score: 0, label: 'Court', color: '#94a3b8' };
  }

  const lang = doc.language === 'en' ? 'en' : 'fr';
  const d2 = computeD2FastText(doc.normalized, lang, 0.25);
  const d3 = computeD3Compression(doc.normalized, 0.20);
  const d4 = computeD4Burstiness(doc.normalized, 0.15);
  const d5 = computeD5TextStats(doc.normalized, 0.15);
  const d6 = computeD6Slop(doc.normalized, lang, 0.25);
  const d7 = computeD7Patterns(doc.normalized, 0.10);

  let totalWeight = 0;
  let weightedSum = 0;

  const signals = [d2, d3, d4, d5, d6, d7];
  for (const s of signals) {
    if (s.available) {
      weightedSum += s.value * s.weight;
      totalWeight += s.weight;
    }
  }

  const finalProb = totalWeight > 0 ? weightedSum / totalWeight : 0.2;
  const score = Math.round(Math.max(0, Math.min(100, finalProb * 100)));

  let label = 'Humain';
  let color = '#16a34a';

  if (score >= 75) {
    label = `${score}% IA`;
    color = '#dc2626';
  } else if (score >= 55) {
    label = `${score}% Prob. IA`;
    color = '#f97316';
  } else if (score >= 30) {
    label = `${score}% Mixte`;
    color = '#eab308';
  } else {
    label = `${100 - score}% Humain`;
    color = '#16a34a';
  }

  return { score, label, color };
}

/**
 * Injecteur de badges in-feed individuels pour chaque post / tweet
 */
export class InFeedScanner {
  private scannedElements = new WeakSet<HTMLElement>();

  public scanPosts(url: string = window.location.href): void {
    let matchedConfig = null;
    for (const conf of SOCIAL_SELECTORS) {
      if (conf.match.test(url)) {
        matchedConfig = conf;
        break;
      }
    }

    if (!matchedConfig) return;

    const posts = document.querySelectorAll(matchedConfig.postSelector);
    posts.forEach((postNode) => {
      const postEl = postNode as HTMLElement;
      if (this.scannedElements.has(postEl) || postEl.dataset.glScanned === 'true') {
        return;
      }

      const text = matchedConfig.getText(postEl);
      if (!text || text.split(/\s+/).length < 6) {
        return;
      }

      this.scannedElements.add(postEl);
      postEl.dataset.glScanned = 'true';

      const target = matchedConfig.getInsertionPoint(postEl);
      if (!target) return;

      const { score, label, color } = scorePostText(text);
      this.injectBadge(target, label, color, text, score);
    });
  }

  private injectBadge(
    target: HTMLElement,
    label: string,
    color: string,
    postText: string,
    score: number
  ): void {
    // Vérifier si déjà injecté
    if (target.querySelector('.gl-infeed-badge')) return;

    const badgeEl = document.createElement('span');
    badgeEl.className = 'gl-infeed-badge';
    badgeEl.style.cssText = `
      display: inline-flex !important;
      align-items: center !important;
      gap: 5px !important;
      padding: 2px 8px !important;
      margin: 4px 6px !important;
      border-radius: 9999px !important;
      background: rgba(15, 23, 42, 0.90) !important;
      border: 1px solid ${color} !important;
      color: #ffffff !important;
      font-size: 11px !important;
      font-weight: 600 !important;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif !important;
      box-shadow: 0 2px 8px rgba(0,0,0,0.25) !important;
      cursor: pointer !important;
      user-select: none !important;
      vertical-align: middle !important;
      transition: transform 0.15s ease, background 0.15s ease !important;
      z-index: 10 !important;
    `;

    badgeEl.title = `GhostLens : ${label} (${score}%) — Cliquez pour ouvrir le rapport`;
    badgeEl.innerHTML = `
      <span style="display:inline-block; width:6px; height:6px; border-radius:50%; background:${color}; box-shadow:0 0 4px ${color};"></span>
      <span style="color:${color}; font-weight:700;">👁️ ${label}</span>
    `;

    badgeEl.addEventListener('mouseenter', () => {
      badgeEl.style.transform = 'scale(1.05)';
      badgeEl.style.background = 'rgba(30, 41, 59, 1)';
    });

    badgeEl.addEventListener('mouseleave', () => {
      badgeEl.style.transform = 'scale(1)';
      badgeEl.style.background = 'rgba(15, 23, 42, 0.90)';
    });

    badgeEl.addEventListener('click', (e) => {
      e.stopPropagation();
      e.preventDefault();
      try {
        chrome.runtime.sendMessage({
          type: 'gl:open',
          customText: postText,
        });
      } catch (err) {
        console.warn('[GhostLens] In-feed open error', err);
      }
    });

    // Insertion au début ou à la fin de la barre d'actions
    if (target.firstChild) {
      target.insertBefore(badgeEl, target.firstChild);
    } else {
      target.appendChild(badgeEl);
    }
  }
}

import { SentenceScore } from '@/src/core/signals/types';

export class GhostLensHighlighter {
  private isEnabled: boolean = true;
  private highlightedSpans: HTMLElement[] = [];

  public highlightSentences(sentenceScores: SentenceScore[]): void {
    if (!this.isEnabled) return;
    this.clear();

    // Map des scores par texte de phrase
    const scoreMap = new Map<string, number>();
    for (const item of sentenceScores) {
      if (item.text && item.text.length > 20) {
        scoreMap.set(item.text.trim(), item.score);
      }
    }

    // Recherche et surlignage discret dans les paragraphes de la page
    const paragraphs = document.querySelectorAll('p, article, .post-content, .entry-content');
    paragraphs.forEach((p) => {
      // Éviter de toucher aux éléments d'extension
      if (p.closest('#__gl') || p.closest('#__gl_block')) return;

      const text = p.textContent || '';
      for (const [sentenceText, score] of scoreMap.entries()) {
        if (text.includes(sentenceText)) {
          // Déterminer la couleur selon le score (§6.4) avec 8% d'opacité
          let color = 'rgba(22, 163, 74, 0.08)'; // Vert
          if (score >= 80) {
            color = 'rgba(220, 38, 38, 0.12)'; // Rouge
          } else if (score >= 60) {
            color = 'rgba(249, 115, 22, 0.10)'; // Orange
          } else if (score >= 30) {
            color = 'rgba(234, 179, 8, 0.08)'; // Jaune
          }

          // Remplacement sécurisé du texte sans casser le DOM
          if ((p as HTMLElement).style) {
            (p as HTMLElement).style.backgroundColor = color;
            (p as HTMLElement).style.borderRadius = '4px';
            (p as HTMLElement).style.transition = 'background-color 0.2s';
            this.highlightedSpans.push(p as HTMLElement);
          }
        }
      }
    });
  }

  public clear(): void {
    for (const el of this.highlightedSpans) {
      el.style.backgroundColor = '';
    }
    this.highlightedSpans = [];
  }

  public toggle(): boolean {
    this.isEnabled = !this.isEnabled;
    if (!this.isEnabled) {
      this.clear();
    }
    return this.isEnabled;
  }
}

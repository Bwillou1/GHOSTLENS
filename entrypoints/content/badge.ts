import { AnalysisResult } from '@/src/core/signals/types';
import { tokens } from '@/src/ui/tokens';

export class GhostLensBadge {
  private container: HTMLDivElement | null = null;
  private shadowRoot: ShadowRoot | null = null;
  private isVisible: boolean = true;
  private lastResult: AnalysisResult | null = null;

  constructor() {
    this.createBadgeContainer();
  }

  public getLastResult(): AnalysisResult | null {
    return this.lastResult;
  }

  private createBadgeContainer(): void {
    if (document.getElementById('__gl')) {
      this.container = document.getElementById('__gl') as HTMLDivElement;
      return;
    }

    this.container = document.createElement('div');
    this.container.id = '__gl';
    // Mode closed pour une isolation CSS totale (§9.1, DEC-002)
    this.shadowRoot = this.container.attachShadow({ mode: 'closed' });

    document.documentElement.appendChild(this.container);
  }

  public showAnalyzing(): void {
    if (!this.shadowRoot || !this.isVisible) return;

    this.shadowRoot.innerHTML = `
      <style>
        :host {
          all: initial;
          position: fixed;
          top: 12px;
          right: 12px;
          z-index: 2147483647;
          pointer-events: auto;
          font-family: ${tokens.typography.fontFamily.sans};
        }
        .gl-badge {
          display: flex;
          align-items: center;
          gap: 6px;
          padding: 6px 12px;
          border-radius: ${tokens.radii.full};
          background: ${tokens.colors.bg.secondary};
          border: 1px solid ${tokens.colors.border.default};
          color: ${tokens.colors.text.secondary};
          font-size: ${tokens.typography.fontSize.sm};
          font-weight: ${tokens.typography.fontWeight.medium};
          box-shadow: ${tokens.shadows.badge};
          cursor: pointer;
          user-select: none;
          backdrop-filter: blur(8px);
          transition: all ${tokens.transitions.fast};
        }
        .gl-spinner {
          width: 12px;
          height: 12px;
          border: 2px solid ${tokens.colors.border.default};
          border-top-color: ${tokens.colors.text.accent};
          border-radius: 50%;
          animation: gl-spin 0.8s linear infinite;
        }
        @keyframes gl-spin {
          to { transform: rotate(360deg); }
        }
      </style>
      <div class="gl-badge" title="GhostLens — Analyse en cours…">
        <div class="gl-spinner"></div>
        <span>Analyse…</span>
      </div>
    `;
  }

  public render(result: AnalysisResult): void {
    this.lastResult = result;
    if (!this.shadowRoot || !this.isVisible) return;

    let badgeText = '';
    if (result.label === 'insufficient') {
      badgeText = '— Données insuffisantes';
    } else if (result.label === 'human') {
      badgeText = `${100 - result.score}% Humain`;
    } else if (result.label === 'mixed') {
      badgeText = `${result.score}% Mixte`;
    } else if (result.label === 'likely-ai') {
      badgeText = `${result.score}% Prob. IA`;
    } else {
      badgeText = `${result.score}% IA`;
    }

    const color = result.color;

    this.shadowRoot.innerHTML = `
      <style>
        :host {
          all: initial;
          position: fixed;
          top: 12px;
          right: 12px;
          z-index: 2147483647;
          pointer-events: auto;
          font-family: ${tokens.typography.fontFamily.sans};
        }
        .gl-badge {
          display: flex;
          align-items: center;
          gap: 6px;
          padding: 6px 12px;
          border-radius: ${tokens.radii.full};
          background: rgba(15, 23, 42, 0.85);
          border: 1px solid ${color};
          color: ${tokens.colors.text.primary};
          font-size: ${tokens.typography.fontSize.sm};
          font-weight: ${tokens.typography.fontWeight.semibold};
          box-shadow: ${tokens.shadows.badge};
          cursor: pointer;
          user-select: none;
          backdrop-filter: blur(12px);
          transition: transform ${tokens.transitions.fast}, background ${tokens.transitions.fast};
        }
        .gl-badge:hover {
          transform: translateY(-1px) scale(1.02);
          background: rgba(30, 41, 59, 0.95);
        }
        .gl-badge:active {
          transform: translateY(0) scale(0.98);
        }
        .gl-indicator {
          width: 8px;
          height: 8px;
          border-radius: 50%;
          background: ${color};
          box-shadow: 0 0 8px ${color};
        }
        .gl-score {
          color: ${color};
        }
      </style>
      <div class="gl-badge" id="gl-pill" title="GhostLens : ${badgeText} — Cliquez pour ouvrir le rapport (Ctrl+Shift+G)">
        <div class="gl-indicator"></div>
        <span><strong class="gl-score">${badgeText}</strong></span>
      </div>
    `;

    const pill = this.shadowRoot.getElementById('gl-pill');
    if (pill) {
      pill.addEventListener('click', () => {
        chrome.runtime.sendMessage({
          type: 'gl:open',
          analysisId: result.analysisId,
        });
      });
    }
  }

  public toggle(): void {
    this.isVisible = !this.isVisible;
    if (this.container) {
      this.container.style.display = this.isVisible ? 'block' : 'none';
    }
  }
}

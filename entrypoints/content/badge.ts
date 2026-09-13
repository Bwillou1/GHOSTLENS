import { AnalysisResult } from '@/src/core/signals/types';

export class GhostLensBadge {
  private container: HTMLDivElement | null = null;
  private shadowRoot: ShadowRoot | null = null;
  private isVisible: boolean = true;
  private lastResult: AnalysisResult | null = null;

  constructor() {
    this.initBadge();
  }

  public getLastResult(): AnalysisResult | null {
    return this.lastResult;
  }

  private initBadge(): void {
    const existing = document.getElementById('__gl');
    if (existing) {
      existing.remove();
    }

    this.container = document.createElement('div');
    this.container.id = '__gl';
    this.container.style.cssText =
      'all: initial !important; position: fixed !important; top: 16px !important; right: 16px !important; z-index: 2147483647 !important; display: block !important; pointer-events: auto !important; width: auto !important; height: auto !important;';

    this.shadowRoot = this.container.attachShadow({ mode: 'open' });
    this.mount();
  }

  private mount(): void {
    if (!this.container) return;

    if (document.body) {
      document.body.appendChild(this.container);
    } else if (document.documentElement) {
      document.documentElement.appendChild(this.container);
    } else {
      document.addEventListener('DOMContentLoaded', () => {
        if (this.container && !this.container.isConnected) {
          (document.body || document.documentElement).appendChild(this.container);
        }
      });
    }
  }

  private ensureMounted(): void {
    if (this.container && !this.container.isConnected) {
      this.mount();
    }
  }

  public showAnalyzing(): void {
    this.ensureMounted();
    if (!this.shadowRoot || !this.isVisible) return;

    this.shadowRoot.innerHTML = `
      <style>
        :host {
          all: initial;
          font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
        }
        .gl-badge {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          padding: 7px 14px;
          border-radius: 9999px;
          background: rgba(15, 23, 42, 0.92);
          border: 1px solid rgba(148, 163, 184, 0.3);
          color: #f8fafc;
          font-size: 12px;
          font-weight: 600;
          box-shadow: 0 4px 16px rgba(0, 0, 0, 0.35);
          cursor: pointer;
          user-select: none;
          backdrop-filter: blur(12px);
          transition: all 0.2s ease;
        }
        .gl-badge:hover {
          background: rgba(30, 41, 59, 0.98);
          transform: translateY(-1px);
        }
        .gl-spinner {
          width: 10px;
          height: 10px;
          border: 2px solid rgba(148, 163, 184, 0.3);
          border-top-color: #38bdf8;
          border-radius: 50%;
          animation: gl-spin 0.8s linear infinite;
        }
        @keyframes gl-spin {
          to { transform: rotate(360deg); }
        }
      </style>
      <div class="gl-badge" title="GhostLens — Analyse en cours…">
        <div class="gl-spinner"></div>
        <span>GhostLens : Analyse…</span>
      </div>
    `;
  }

  public render(result: AnalysisResult): void {
    this.lastResult = result;
    this.ensureMounted();
    if (!this.shadowRoot || !this.isVisible) return;

    let badgeText = '';
    if (result.label === 'insufficient') {
      badgeText = 'Texte court';
    } else if (result.label === 'human') {
      badgeText = `${100 - result.score}% Humain`;
    } else if (result.label === 'mixed') {
      badgeText = `${result.score}% Mixte`;
    } else if (result.label === 'likely-ai') {
      badgeText = `${result.score}% Prob. IA`;
    } else {
      badgeText = `${result.score}% IA`;
    }

    const color = result.color || '#38bdf8';

    this.shadowRoot.innerHTML = `
      <style>
        :host {
          all: initial;
          font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
        }
        .gl-badge {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          padding: 7px 14px;
          border-radius: 9999px;
          background: rgba(15, 23, 42, 0.94);
          border: 1.5px solid ${color};
          color: #ffffff;
          font-size: 13px;
          font-weight: 600;
          box-shadow: 0 4px 20px rgba(0, 0, 0, 0.4), 0 0 12px ${color}33;
          cursor: pointer;
          user-select: none;
          backdrop-filter: blur(12px);
          transition: transform 0.2s cubic-bezier(0.4, 0, 0.2, 1), background 0.2s ease;
        }
        .gl-badge:hover {
          transform: translateY(-2px) scale(1.03);
          background: rgba(30, 41, 59, 1);
        }
        .gl-badge:active {
          transform: translateY(0) scale(0.98);
        }
        .gl-indicator {
          width: 9px;
          height: 9px;
          border-radius: 50%;
          background: ${color};
          box-shadow: 0 0 8px ${color};
        }
        .gl-score {
          color: ${color};
          font-weight: 700;
        }
      </style>
      <div class="gl-badge" id="gl-pill" title="GhostLens : ${badgeText} — Cliquez pour ouvrir le rapport (Cmd+Shift+G)">
        <div class="gl-indicator"></div>
        <span>GhostLens : <strong class="gl-score">${badgeText}</strong></span>
      </div>
    `;

    const pill = this.shadowRoot.getElementById('gl-pill');
    if (pill) {
      pill.addEventListener('click', () => {
        try {
          chrome.runtime.sendMessage({
            type: 'gl:open',
            analysisId: result.analysisId,
          });
        } catch (e) {
          console.warn('[GhostLens] Erreur click badge', e);
        }
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

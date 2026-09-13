import { AnalysisResult } from '@/src/core/signals/types';
import { tokens } from '@/src/ui/tokens';

export class GhostLensWarnBanner {
  private container: HTMLDivElement | null = null;
  private shadowRoot: ShadowRoot | null = null;

  constructor() {
    this.createContainer();
  }

  private createContainer(): void {
    if (document.getElementById('__gl_warn_banner')) {
      this.container = document.getElementById('__gl_warn_banner') as HTMLDivElement;
      return;
    }

    this.container = document.createElement('div');
    this.container.id = '__gl_warn_banner';
    this.shadowRoot = this.container.attachShadow({ mode: 'closed' });
    document.documentElement.appendChild(this.container);
  }

  public show(result: AnalysisResult): void {
    if (!this.shadowRoot || !this.container) return;

    this.container.style.display = 'block';

    this.shadowRoot.innerHTML = `
      <style>
        :host {
          all: initial;
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          z-index: 2147483645;
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 8px 16px;
          background: rgba(234, 179, 8, 0.95);
          color: #0f172a;
          font-family: ${tokens.typography.fontFamily.sans};
          font-size: ${tokens.typography.fontSize.xs};
          font-weight: ${tokens.typography.fontWeight.semibold};
          box-shadow: ${tokens.shadows.md};
          backdrop-filter: blur(8px);
        }
        .gl-warn-content {
          display: flex;
          align-items: center;
          gap: 8px;
        }
        .gl-warn-btn {
          padding: 4px 10px;
          background: #0f172a;
          color: #f8fafc;
          border: none;
          border-radius: ${tokens.radii.sm};
          cursor: pointer;
          font-weight: 600;
          font-size: 11px;
        }
        .gl-close {
          cursor: pointer;
          font-size: 16px;
          padding: 0 4px;
        }
      </style>
      <div class="gl-warn-content">
        <span>⚠️ <strong>Avertissement GhostLens :</strong> Ce contenu présente des indices significatifs de génération par IA (${result.score}%).</span>
      </div>
      <div style="display: flex; align-items: center; gap: 8px;">
        <button class="gl-warn-btn" id="btn-open-report">Voir le rapport</button>
        <span class="gl-close" id="btn-close" title="Fermer">✕</span>
      </div>
    `;

    this.shadowRoot.getElementById('btn-open-report')?.addEventListener('click', () => {
      chrome.runtime.sendMessage({ type: 'gl:open', analysisId: result.analysisId });
    });

    this.shadowRoot.getElementById('btn-close')?.addEventListener('click', () => {
      this.hide();
    });
  }

  public hide(): void {
    if (this.container) {
      this.container.style.display = 'none';
    }
  }
}

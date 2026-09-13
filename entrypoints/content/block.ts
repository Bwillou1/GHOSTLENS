import { AnalysisResult } from '@/src/core/signals/types';
import { tokens } from '@/src/ui/tokens';

export class GhostLensBlockScreen {
  private container: HTMLDivElement | null = null;
  private shadowRoot: ShadowRoot | null = null;

  constructor() {
    this.createContainer();
  }

  private createContainer(): void {
    if (document.getElementById('__gl_block')) {
      this.container = document.getElementById('__gl_block') as HTMLDivElement;
      return;
    }

    this.container = document.createElement('div');
    this.container.id = '__gl_block';
    this.shadowRoot = this.container.attachShadow({ mode: 'closed' });
    document.documentElement.appendChild(this.container);
  }

  public show(result: AnalysisResult, onUnlock: (scope: 'page' | 'hour' | 'always') => void): void {
    if (!this.shadowRoot || !this.container) return;

    this.container.style.display = 'block';

    const isVibe = result.vibeScore && result.vibeScore >= 80;
    const title = isVibe ? 'Site probablement vibe-codé' : 'Contenu bloqué par GhostLens';
    const scoreText = isVibe
      ? `Empreinte de générateur IA : ${result.vibeScore}/100`
      : `Score IA : ${result.score}% (${result.confidence === 'high' ? 'confiance haute' : 'confiance moyenne'})`;
    const reasonText = result.blockReason || 'Ce contenu a été masqué parce qu’il est très probablement généré par IA.';

    this.shadowRoot.innerHTML = `
      <style>
        :host {
          all: initial;
          position: fixed;
          inset: 0;
          z-index: 2147483646;
          display: flex;
          align-items: center;
          justify-content: center;
          background: rgba(15, 23, 42, 0.94);
          backdrop-filter: blur(16px);
          font-family: ${tokens.typography.fontFamily.sans};
          color: ${tokens.colors.text.primary};
        }
        .gl-card {
          max-width: 540px;
          width: 90%;
          padding: 32px;
          background: #1e293b;
          border: 1px solid rgba(220, 38, 38, 0.4);
          border-radius: ${tokens.radii.lg};
          box-shadow: ${tokens.shadows.xl};
          text-align: center;
          animation: gl-fade-in 0.2s ease-out;
        }
        @keyframes gl-fade-in {
          from { opacity: 0; transform: scale(0.96); }
          to { opacity: 1; transform: scale(1); }
        }
        .gl-icon {
          font-size: 40px;
          margin-bottom: 12px;
        }
        .gl-title {
          font-size: ${tokens.typography.fontSize.xl};
          font-weight: ${tokens.typography.fontWeight.bold};
          margin: 0 0 8px 0;
          color: ${tokens.colors.text.primary};
        }
        .gl-score-pill {
          display: inline-block;
          padding: 4px 12px;
          border-radius: ${tokens.radii.full};
          background: rgba(220, 38, 38, 0.15);
          border: 1px solid #dc2626;
          color: #f87171;
          font-size: ${tokens.typography.fontSize.sm};
          font-weight: ${tokens.typography.fontWeight.semibold};
          margin-bottom: 16px;
        }
        .gl-reason {
          font-size: ${tokens.typography.fontSize.base};
          color: ${tokens.colors.text.secondary};
          line-height: 1.5;
          margin: 0 0 24px 0;
        }
        .gl-actions {
          display: flex;
          flex-wrap: wrap;
          gap: 10px;
          justify-content: center;
          margin-bottom: 20px;
        }
        .gl-btn {
          padding: 8px 16px;
          border-radius: ${tokens.radii.md};
          font-size: ${tokens.typography.fontSize.sm};
          font-weight: ${tokens.typography.fontWeight.medium};
          cursor: pointer;
          border: 1px solid transparent;
          transition: all ${tokens.transitions.fast};
        }
        .gl-btn-primary {
          background: #38bdf8;
          color: #0f172a;
        }
        .gl-btn-primary:hover {
          background: #7dd3fc;
        }
        .gl-btn-secondary {
          background: #334155;
          color: #f8fafc;
          border-color: rgba(255, 255, 255, 0.1);
        }
        .gl-btn-secondary:hover {
          background: #475569;
        }
        .gl-disclaimer {
          font-size: ${tokens.typography.fontSize.xs};
          color: ${tokens.colors.text.muted};
          line-height: 1.4;
          margin: 0;
        }
      </style>
      <div class="gl-card">
        <div class="gl-icon">🔒</div>
        <h1 class="gl-title">${title}</h1>
        <div class="gl-score-pill">${scoreText}</div>
        <p class="gl-reason">${reasonText}</p>
        <div class="gl-actions">
          <button class="gl-btn gl-btn-primary" id="btn-unlock-once">Autoriser une fois</button>
          <button class="gl-btn gl-btn-secondary" id="btn-unlock-hour">Autoriser cette page 1 h</button>
          <button class="gl-btn gl-btn-secondary" id="btn-unlock-always">Autoriser toujours ce site</button>
          <button class="gl-btn gl-btn-secondary" id="btn-report">Rapport détaillé</button>
        </div>
        <p class="gl-disclaimer">Note : la détection est probabiliste — si ce contenu est humain, « Autoriser toujours » ajoute ce site à vos exceptions.</p>
      </div>
    `;

    this.shadowRoot.getElementById('btn-unlock-once')?.addEventListener('click', () => {
      this.hide();
      onUnlock('page');
    });

    this.shadowRoot.getElementById('btn-unlock-hour')?.addEventListener('click', () => {
      this.hide();
      onUnlock('hour');
    });

    this.shadowRoot.getElementById('btn-unlock-always')?.addEventListener('click', () => {
      this.hide();
      onUnlock('always');
    });

    this.shadowRoot.getElementById('btn-report')?.addEventListener('click', () => {
      chrome.runtime.sendMessage({
        type: 'gl:open',
        analysisId: result.analysisId,
      });
    });
  }

  public hide(): void {
    if (this.container) {
      this.container.style.display = 'none';
    }
  }
}

import { useState, useEffect, useRef } from 'react';
import { useVirtualizer } from '@tanstack/react-virtual';
import { AnalysisResult, SentenceScore } from '@/src/core/signals/types';
import { tokens } from '@/src/ui/tokens';
import { t } from '@/src/i18n';

type Tab = 'verdict' | 'signals' | 'text' | 'images';

export default function SidePanelApp() {
  const [activeTab, setActiveTab] = useState<Tab>('verdict');
  const [result, setResult] = useState<AnalysisResult | null>(null);

  useEffect(() => {
    // Écouter les mises à jour et requêter l'analyse courante
    const loadAnalysis = () => {
      chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        const activeTab = tabs[0];
        if (activeTab?.id) {
          chrome.tabs.sendMessage(activeTab.id, { type: 'gl:get-current-result' }, (res) => {
            if (res?.result) {
              setResult(res.result);
            }
          });
        }
      });
    };

    loadAnalysis();

    const listener = (msg: any) => {
      if (msg.type === 'gl:result') {
        setResult(msg.result);
      }
    };
    chrome.runtime.onMessage.addListener(listener);
    return () => chrome.runtime.onMessage.removeListener(listener);
  }, []);

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      height: '100vh',
      backgroundColor: tokens.colors.bg.primary,
      fontFamily: tokens.typography.fontFamily.sans,
      color: tokens.colors.text.primary,
    }}>
      {/* Header */}
      <header style={{
        padding: `${tokens.spacing[3]} ${tokens.spacing[4]}`,
        borderBottom: `1px solid ${tokens.colors.border.subtle}`,
        backgroundColor: tokens.colors.bg.secondary,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: tokens.spacing[2] }}>
          <span style={{ fontSize: '20px' }}>👁️</span>
          <div>
            <h1 style={{ fontSize: tokens.typography.fontSize.base, fontWeight: tokens.typography.fontWeight.bold, margin: 0 }}>
              GhostLens
            </h1>
            <span style={{ fontSize: tokens.typography.fontSize.xs, color: tokens.colors.text.muted }}>
              Rapport d'analyse 100% locale
            </span>
          </div>
        </div>
        {result && (
          <span style={{
            padding: '4px 10px',
            borderRadius: tokens.radii.full,
            backgroundColor: 'rgba(255,255,255,0.06)',
            border: `1px solid ${result.color}`,
            color: result.color,
            fontSize: tokens.typography.fontSize.xs,
            fontWeight: tokens.typography.fontWeight.semibold,
          }}>
            {result.score}% {result.label.toUpperCase()}
          </span>
        )}
      </header>

      {/* Tabs */}
      <nav style={{
        display: 'flex',
        borderBottom: `1px solid ${tokens.colors.border.subtle}`,
        backgroundColor: tokens.colors.bg.secondary,
      }}>
        {(['verdict', 'signals', 'text', 'images'] as Tab[]).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            style={{
              flex: 1,
              padding: `${tokens.spacing[2]} 0`,
              background: 'none',
              border: 'none',
              borderBottom: activeTab === tab ? `2px solid ${tokens.colors.text.accent}` : '2px solid transparent',
              color: activeTab === tab ? tokens.colors.text.accent : tokens.colors.text.secondary,
              fontSize: tokens.typography.fontSize.sm,
              fontWeight: activeTab === tab ? tokens.typography.fontWeight.semibold : tokens.typography.fontWeight.regular,
              cursor: 'pointer',
              transition: `all ${tokens.transitions.fast}`,
            }}
          >
            {t(`tabs.${tab}` as any)}
          </button>
        ))}
      </nav>

      {/* Tab Content */}
      <main style={{ flex: 1, overflowY: 'auto', padding: tokens.spacing[4] }}>
        {!result ? (
          <div style={{ textAlign: 'center', padding: tokens.spacing[8], color: tokens.colors.text.secondary }}>
            <div style={{ fontSize: '32px', marginBottom: tokens.spacing[2] }}>⏳</div>
            <p>Analyse de la page en cours…</p>
          </div>
        ) : (
          <>
            {activeTab === 'verdict' && <VerdictTab result={result} />}
            {activeTab === 'signals' && <SignalsTab result={result} />}
            {activeTab === 'text' && <TextTab sentenceScores={result.sentenceScores} />}
            {activeTab === 'images' && <ImagesTab images={result.images} />}
          </>
        )}
      </main>

      {/* Footer Disclaimer (C-10) */}
      <footer style={{
        padding: tokens.spacing[3],
        borderTop: `1px solid ${tokens.colors.border.subtle}`,
        backgroundColor: tokens.colors.bg.secondary,
        textAlign: 'center',
        fontSize: tokens.typography.fontSize.xs,
        color: tokens.colors.text.muted,
      }}>
        {t('verdict.disclaimer')}
      </footer>
    </div>
  );
}

function VerdictTab({ result }: { result: AnalysisResult }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: tokens.spacing[4] }}>
      {/* Grand Score Hero */}
      <div style={{
        padding: tokens.spacing[6],
        backgroundColor: tokens.colors.bg.secondary,
        borderRadius: tokens.radii.lg,
        border: `1px solid ${result.color}`,
        textAlign: 'center',
      }}>
        <div style={{
          fontSize: tokens.typography.fontSize.hero,
          fontWeight: tokens.typography.fontWeight.bold,
          color: result.color,
          lineHeight: 1,
        }}>
          {result.score}%
        </div>
        <div style={{
          fontSize: tokens.typography.fontSize.lg,
          fontWeight: tokens.typography.fontWeight.semibold,
          marginTop: tokens.spacing[2],
          color: result.color,
        }}>
          {t(`verdict.${result.label}` as any)}
        </div>
        <div style={{
          fontSize: tokens.typography.fontSize.sm,
          color: tokens.colors.text.secondary,
          marginTop: tokens.spacing[1],
        }}>
          {t(`verdict.confidence.${result.confidence}` as any)} • {result.wordCount} mots analysés ({result.language.toUpperCase()})
        </div>
      </div>

      {/* Métadonnées */}
      <div style={{
        padding: tokens.spacing[4],
        backgroundColor: tokens.colors.bg.secondary,
        borderRadius: tokens.radii.md,
        border: `1px solid ${tokens.colors.border.subtle}`,
        fontSize: tokens.typography.fontSize.sm,
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: tokens.spacing[2] }}>
          <span style={{ color: tokens.colors.text.muted }}>Durée d'analyse :</span>
          <strong>{result.durationMs} ms</strong>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: tokens.spacing[2] }}>
          <span style={{ color: tokens.colors.text.muted }}>Moteur de calcul :</span>
          <strong>{result.models.providers.join(', ')}</strong>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          <span style={{ color: tokens.colors.text.muted }}>Statut Cache :</span>
          <strong>{result.cache === 'hit' ? 'Hit (Instant)' : 'Miss (Calculé)'}</strong>
        </div>
      </div>
    </div>
  );
}

function SignalsTab({ result }: { result: AnalysisResult }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: tokens.spacing[3] }}>
      <h2 style={{ fontSize: tokens.typography.fontSize.base, fontWeight: tokens.typography.fontWeight.semibold, margin: 0 }}>
        {t('signals.title')}
      </h2>

      {result.signals.map((signal) => (
        <div
          key={signal.id}
          style={{
            padding: tokens.spacing[3],
            backgroundColor: tokens.colors.bg.secondary,
            borderRadius: tokens.radii.md,
            border: `1px solid ${tokens.colors.border.subtle}`,
            opacity: signal.available ? 1 : 0.6,
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: tokens.spacing[1] }}>
            <span style={{ fontWeight: tokens.typography.fontWeight.medium, fontSize: tokens.typography.fontSize.sm }}>
              {signal.name}
            </span>
            <span style={{
              fontSize: tokens.typography.fontSize.xs,
              fontWeight: tokens.typography.fontWeight.semibold,
              color: signal.available ? (signal.value > 0.6 ? tokens.colors.ai : tokens.colors.human) : tokens.colors.text.muted,
            }}>
              {signal.available ? `${Math.round(signal.value * 100)}%` : 'Indisponible'}
            </span>
          </div>

          {/* Barre de progression du signal */}
          <div style={{
            height: '6px',
            backgroundColor: 'rgba(255, 255, 255, 0.08)',
            borderRadius: tokens.radii.full,
            overflow: 'hidden',
            marginBottom: tokens.spacing[2],
          }}>
            <div style={{
              height: '100%',
              width: `${signal.value * 100}%`,
              backgroundColor: signal.value > 0.6 ? tokens.colors.ai : (signal.value > 0.3 ? tokens.colors.mixed : tokens.colors.human),
              borderRadius: tokens.radii.full,
              transition: `width ${tokens.transitions.normal}`,
            }} />
          </div>

          <div style={{
            fontSize: tokens.typography.fontSize.xs,
            color: tokens.colors.text.muted,
            display: 'flex',
            justifyContent: 'space-between',
          }}>
            <span>{signal.raw}</span>
            <span>{signal.ms} ms</span>
          </div>
        </div>
      ))}
    </div>
  );
}

function TextTab({ sentenceScores }: { sentenceScores: SentenceScore[] }) {
  const parentRef = useRef<HTMLDivElement>(null);

  const rowVirtualizer = useVirtualizer({
    count: sentenceScores.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 64,
    overscan: 20,
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <div style={{
        fontSize: tokens.typography.fontSize.sm,
        color: tokens.colors.text.secondary,
        marginBottom: tokens.spacing[3],
      }}>
        {sentenceScores.length} phrases analysées (liste virtualisée à 60 fps) :
      </div>

      <div
        ref={parentRef}
        style={{
          height: '480px',
          overflowY: 'auto',
          border: `1px solid ${tokens.colors.border.subtle}`,
          borderRadius: tokens.radii.md,
          backgroundColor: tokens.colors.bg.secondary,
        }}
      >
        <div style={{
          height: `${rowVirtualizer.getTotalSize()}px`,
          width: '100%',
          position: 'relative',
        }}>
          {rowVirtualizer.getVirtualItems().map((virtualRow) => {
            const item = sentenceScores[virtualRow.index];
            if (!item) return null;

            const isAi = item.score >= 60;
            const color = isAi ? tokens.colors.ai : (item.score >= 30 ? tokens.colors.mixed : tokens.colors.human);

            return (
              <div
                key={virtualRow.index}
                style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  width: '100%',
                  transform: `translateY(${virtualRow.start}px)`,
                  padding: `${tokens.spacing[2]} ${tokens.spacing[3]}`,
                  borderBottom: `1px solid ${tokens.colors.border.subtle}`,
                  boxSizing: 'border-box',
                  fontSize: tokens.typography.fontSize.xs,
                  lineHeight: 1.4,
                  display: 'flex',
                  gap: tokens.spacing[2],
                  alignItems: 'flex-start',
                }}
              >
                <span style={{
                  padding: '2px 6px',
                  borderRadius: tokens.radii.xs,
                  backgroundColor: `${color}22`,
                  color,
                  fontWeight: tokens.typography.fontWeight.bold,
                  fontSize: '10px',
                  whiteSpace: 'nowrap',
                }}>
                  {item.score}%
                </span>
                <span style={{ color: tokens.colors.text.primary, flex: 1 }}>
                  {item.text}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function ImagesTab({ images }: { images: any[] }) {
  return (
    <div style={{ textAlign: 'center', padding: tokens.spacing[6], color: tokens.colors.text.secondary }}>
      <div style={{ fontSize: '32px', marginBottom: tokens.spacing[2] }}>🖼️</div>
      <p style={{ fontSize: tokens.typography.fontSize.sm }}>
        {images.length === 0
          ? 'Aucune image analysable détectée sur cette page.'
          : `${images.length} images analysées.`}
      </p>
    </div>
  );
}

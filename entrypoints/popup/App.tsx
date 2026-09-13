import { useEffect, useState } from 'react';
import { AnalysisResult } from '@/src/core/signals/types';
import { tokens } from '@/src/ui/tokens';
import { t } from '@/src/i18n';

export default function PopupApp() {
  const [result, setResult] = useState<AnalysisResult | null>(null);

  useEffect(() => {
    // Récupérer la dernière analyse active
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
  }, []);

  const openSidePanel = () => {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      const activeTab = tabs[0];
      if (activeTab?.id) {
        chrome.sidePanel.open({ tabId: activeTab.id });
        window.close();
      }
    });
  };

  return (
    <div style={{
      width: '320px',
      padding: tokens.spacing[4],
      backgroundColor: tokens.colors.bg.primary,
      fontFamily: tokens.typography.fontFamily.sans,
      color: tokens.colors.text.primary,
      boxSizing: 'border-box'
    }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: tokens.spacing[3] }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: tokens.spacing[2] }}>
          <span style={{ fontSize: '18px' }}>👁️</span>
          <strong style={{ fontSize: tokens.typography.fontSize.base, letterSpacing: '-0.3px' }}>GhostLens</strong>
        </div>
        <span style={{
          fontSize: tokens.typography.fontSize.xs,
          padding: '2px 8px',
          borderRadius: tokens.radii.full,
          backgroundColor: 'rgba(56, 189, 248, 0.15)',
          color: tokens.colors.text.accent
        }}>
          v1.0 (Local)
        </span>
      </div>

      <div style={{
        padding: tokens.spacing[4],
        backgroundColor: tokens.colors.bg.secondary,
        borderRadius: tokens.radii.lg,
        border: `1px solid ${result?.color || tokens.colors.border.default}`,
        textAlign: 'center',
        marginBottom: tokens.spacing[3]
      }}>
        <div style={{
          fontSize: tokens.typography.fontSize.xxl,
          fontWeight: tokens.typography.fontWeight.bold,
          color: result?.color || tokens.colors.text.primary
        }}>
          {result ? `${result.score}%` : '—'}
        </div>
        <div style={{
          fontSize: tokens.typography.fontSize.sm,
          fontWeight: tokens.typography.fontWeight.medium,
          color: tokens.colors.text.secondary,
          marginTop: tokens.spacing[1]
        }}>
          {result ? t(`verdict.${result.label}` as any) : t('badge.analyzing')}
        </div>
      </div>

      <button
        onClick={openSidePanel}
        style={{
          width: '100%',
          padding: '10px 16px',
          backgroundColor: tokens.colors.text.accent,
          color: tokens.colors.bg.primary,
          border: 'none',
          borderRadius: tokens.radii.md,
          fontWeight: tokens.typography.fontWeight.semibold,
          fontSize: tokens.typography.fontSize.sm,
          cursor: 'pointer',
          transition: `all ${tokens.transitions.fast}`
        }}
      >
        {t('block.openReport')} (Ctrl+Shift+G)
      </button>

      <div style={{
        marginTop: tokens.spacing[3],
        fontSize: tokens.typography.fontSize.xs,
        color: tokens.colors.text.muted,
        textAlign: 'center',
        lineHeight: 1.4
      }}>
        {t('verdict.disclaimer')}
      </div>
    </div>
  );
}

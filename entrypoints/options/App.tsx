import { useState, useEffect, useRef } from 'react';
import { useVirtualizer } from '@tanstack/react-virtual';
import { SettingsSchema, DEFAULT_SETTINGS } from '@/src/core/signals/types';
import { getSettings, saveSettings, clearAllLocalData, getDB } from '@/src/core/cache/idb';
import { tokens } from '@/src/ui/tokens';
import { t, setLanguage, getLanguage, Language } from '@/src/i18n';

interface HistoryItem {
  analysisId: string;
  title: string;
  url: string;
  score: number;
  color: string;
  label: string;
  timestamp: number;
}

export default function OptionsApp() {
  const [settings, setSettings] = useState<SettingsSchema>(DEFAULT_SETTINGS);
  const [savedMessage, setSavedMessage] = useState<string>('');
  const [lang, setLang] = useState<Language>(getLanguage());
  const [historyItems, setHistoryItems] = useState<HistoryItem[]>([]);

  useEffect(() => {
    getSettings().then((res) => {
      setSettings(res);
      setLang(res.language);
      setLanguage(res.language);
    });

    loadHistory();
  }, []);

  const loadHistory = async () => {
    try {
      const db = await getDB();
      const all = await db.getAll('history');
      setHistoryItems(all.sort((a, b) => b.timestamp - a.timestamp));
    } catch {
      // Ignorer
    }
  };

  const handleSave = async (updated: SettingsSchema) => {
    setSettings(updated);
    await saveSettings(updated);
    setSavedMessage('Réglages sauvegardés localement avec succès.');
    setTimeout(() => setSavedMessage(''), 3000);
  };

  const handleLanguageChange = (newLang: Language) => {
    setLang(newLang);
    setLanguage(newLang);
    handleSave({ ...settings, language: newLang });
  };

  const handleDeleteException = async (domain: string) => {
    const updated = {
      ...settings,
      exceptions: settings.exceptions.filter((ex) => ex.domain !== domain),
    };
    await handleSave(updated);
  };

  const handleClearAll = async () => {
    if (confirm(t('options.clearAllConfirm'))) {
      await clearAllLocalData();
      setHistoryItems([]);
      alert('Toutes les données en cache et historique ont été supprimées.');
    }
  };

  return (
    <div style={{
      maxWidth: '820px',
      margin: '0 auto',
      padding: tokens.spacing[6],
      fontFamily: tokens.typography.fontFamily.sans,
      color: tokens.colors.text.primary,
    }}>
      <header style={{ marginBottom: tokens.spacing[6], borderBottom: `1px solid ${tokens.colors.border.subtle}`, paddingBottom: tokens.spacing[4] }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: tokens.spacing[2], marginBottom: tokens.spacing[2] }}>
          <span style={{ fontSize: '28px' }}>👁️</span>
          <h1 style={{ fontSize: tokens.typography.fontSize.xxl, fontWeight: tokens.typography.fontWeight.bold, margin: 0 }}>
            GhostLens — Réglages & Contrôle
          </h1>
        </div>
        <p style={{ color: tokens.colors.text.secondary, margin: 0, fontSize: tokens.typography.fontSize.sm }}>
          Configuration locale, seuils de détection, gestionnaire d'exceptions et historique de navigation.
        </p>
      </header>

      {savedMessage && (
        <div style={{
          padding: tokens.spacing[3],
          backgroundColor: 'rgba(22, 163, 74, 0.2)',
          border: '1px solid #16a34a',
          borderRadius: tokens.radii.md,
          color: '#86efac',
          marginBottom: tokens.spacing[4],
          fontSize: tokens.typography.fontSize.sm,
        }}>
          {savedMessage}
        </div>
      )}

      {/* Section 1 : Général & Langue */}
      <section style={{
        padding: tokens.spacing[5],
        backgroundColor: tokens.colors.bg.secondary,
        borderRadius: tokens.radii.lg,
        border: `1px solid ${tokens.colors.border.subtle}`,
        marginBottom: tokens.spacing[5],
      }}>
        <h2 style={{ fontSize: tokens.typography.fontSize.lg, fontWeight: tokens.typography.fontWeight.semibold, marginTop: 0 }}>
          {t('options.general')}
        </h2>

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: tokens.spacing[3] }}>
          <span>Langue de l'interface</span>
          <select
            value={lang}
            onChange={(e) => handleLanguageChange(e.target.value as Language)}
            style={{
              padding: '6px 12px',
              backgroundColor: tokens.colors.bg.tertiary,
              color: tokens.colors.text.primary,
              border: `1px solid ${tokens.colors.border.default}`,
              borderRadius: tokens.radii.md,
            }}
          >
            <option value="fr">Français (FR)</option>
            <option value="en">English (EN)</option>
          </select>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: tokens.spacing[3] }}>
          <span>Afficher le badge dans les pages</span>
          <input
            type="checkbox"
            checked={settings.badge}
            onChange={(e) => handleSave({ ...settings, badge: e.target.checked })}
          />
        </div>

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: tokens.spacing[3] }}>
          <span>Surlignage discret des phrases (8% d'opacité)</span>
          <input
            type="checkbox"
            checked={settings.highlight}
            onChange={(e) => handleSave({ ...settings, highlight: e.target.checked })}
          />
        </div>
      </section>

      {/* Section 2 : Mode de Blocage & Seuils */}
      <section style={{
        padding: tokens.spacing[5],
        backgroundColor: tokens.colors.bg.secondary,
        borderRadius: tokens.radii.lg,
        border: `1px solid ${tokens.colors.border.subtle}`,
        marginBottom: tokens.spacing[5],
      }}>
        <h2 style={{ fontSize: tokens.typography.fontSize.lg, fontWeight: tokens.typography.fontWeight.semibold, marginTop: 0 }}>
          {t('options.blocking')}
        </h2>

        <div style={{ display: 'flex', flexDirection: 'column', gap: tokens.spacing[2], marginTop: tokens.spacing[3], marginBottom: tokens.spacing[4] }}>
          {(['off', 'info', 'warn', 'block'] as const).map((mode) => (
            <label key={mode} style={{ display: 'flex', alignItems: 'center', gap: tokens.spacing[2], cursor: 'pointer' }}>
              <input
                type="radio"
                name="blockMode"
                value={mode}
                checked={settings.blockMode === mode}
                onChange={() => handleSave({ ...settings, blockMode: mode })}
              />
              <strong style={{ textTransform: 'capitalize' }}>{mode}</strong> —
              <span style={{ fontSize: tokens.typography.fontSize.xs, color: tokens.colors.text.secondary }}>
                {mode === 'off' && 'Badge uniquement sans action.'}
                {mode === 'info' && 'Badge discret sur tous les niveaux.'}
                {mode === 'warn' && 'Bandeau d\'avertissement non bloquant pour les contenus suspects (≥ 30%).'}
                {mode === 'block' && 'Écran de verrouillage complet si score IA ≥ 80% (avec déblocage 1-clic).'}
              </span>
            </label>
          ))}
        </div>

        {/* Sliders des seuils */}
        <div style={{ borderTop: `1px solid ${tokens.colors.border.subtle}`, paddingTop: tokens.spacing[3] }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: tokens.spacing[2] }}>
            <span style={{ fontSize: tokens.typography.fontSize.sm }}>Seuil de Blocage IA : <strong>{settings.thresholds.block}%</strong></span>
            <input
              type="range"
              min="50"
              max="95"
              value={settings.thresholds.block}
              onChange={(e) => handleSave({
                ...settings,
                thresholds: { ...settings.thresholds, block: Number(e.target.value) },
              })}
            />
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: tokens.typography.fontSize.sm }}>Seuil de Blocage Vibe-Code : <strong>{settings.thresholds.vibeBlock}/100</strong></span>
            <input
              type="range"
              min="50"
              max="95"
              value={settings.thresholds.vibeBlock}
              onChange={(e) => handleSave({
                ...settings,
                thresholds: { ...settings.thresholds, vibeBlock: Number(e.target.value) },
              })}
            />
          </div>
        </div>
      </section>

      {/* Section 3 : Exceptions de Déblocage */}
      <section style={{
        padding: tokens.spacing[5],
        backgroundColor: tokens.colors.bg.secondary,
        borderRadius: tokens.radii.lg,
        border: `1px solid ${tokens.colors.border.subtle}`,
        marginBottom: tokens.spacing[5],
      }}>
        <h2 style={{ fontSize: tokens.typography.fontSize.lg, fontWeight: tokens.typography.fontWeight.semibold, marginTop: 0 }}>
          Exceptions de Déblocage ({settings.exceptions.length})
        </h2>

        {settings.exceptions.length === 0 ? (
          <p style={{ fontSize: tokens.typography.fontSize.xs, color: tokens.colors.text.muted, margin: 0 }}>
            Aucune exception enregistrée. Lorsque vous cliquez sur « Autoriser toujours » sur un écran de verrouillage, le site s'affichera ici.
          </p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: tokens.spacing[2], marginTop: tokens.spacing[3] }}>
            {settings.exceptions.map((ex, i) => (
              <div
                key={i}
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: `${tokens.spacing[2]} ${tokens.spacing[3]}`,
                  backgroundColor: tokens.colors.bg.tertiary,
                  borderRadius: tokens.radii.md,
                  fontSize: tokens.typography.fontSize.xs,
                }}
              >
                <div>
                  <strong>{ex.domain}</strong> — <span style={{ color: tokens.colors.text.secondary }}>{ex.scope === 'always' ? 'Toujours autorisé' : 'Temporaire (1h)'}</span>
                </div>
                <button
                  onClick={() => handleDeleteException(ex.domain)}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: '#f87171',
                    cursor: 'pointer',
                    fontSize: '12px',
                    fontWeight: 600,
                  }}
                >
                  Supprimer
                </button>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Section 4 : Historique Virtualisé */}
      <section style={{
        padding: tokens.spacing[5],
        backgroundColor: tokens.colors.bg.secondary,
        borderRadius: tokens.radii.lg,
        border: `1px solid ${tokens.colors.border.subtle}`,
        marginBottom: tokens.spacing[5],
      }}>
        <h2 style={{ fontSize: tokens.typography.fontSize.lg, fontWeight: tokens.typography.fontWeight.semibold, marginTop: 0 }}>
          Historique Local ({historyItems.length} pages)
        </h2>
        {historyItems.length > 0 && <HistoryVirtualList items={historyItems} />}
      </section>

      {/* Section 5 : Confidentialité & Données */}
      <section style={{
        padding: tokens.spacing[5],
        backgroundColor: tokens.colors.bg.secondary,
        borderRadius: tokens.radii.lg,
        border: `1px solid ${tokens.colors.border.subtle}`,
        marginBottom: tokens.spacing[5],
      }}>
        <h2 style={{ fontSize: tokens.typography.fontSize.lg, fontWeight: tokens.typography.fontWeight.semibold, marginTop: 0 }}>
          {t('options.privacy')}
        </h2>
        <p style={{ fontSize: tokens.typography.fontSize.sm, color: tokens.colors.text.secondary }}>
          GhostLens fonctionne à 100% sur votre appareil. Zéro télémétrie, zéro transmission de texte vers des serveurs distants.
        </p>
        <button
          onClick={handleClearAll}
          style={{
            padding: '8px 16px',
            backgroundColor: 'rgba(220, 38, 38, 0.2)',
            color: '#f87171',
            border: '1px solid #dc2626',
            borderRadius: tokens.radii.md,
            cursor: 'pointer',
            fontWeight: tokens.typography.fontWeight.medium,
            fontSize: tokens.typography.fontSize.sm,
            marginTop: tokens.spacing[2],
          }}
        >
          {t('options.clearAll')}
        </button>
      </section>
    </div>
  );
}

function HistoryVirtualList({ items }: { items: HistoryItem[] }) {
  const parentRef = useRef<HTMLDivElement>(null);

  const rowVirtualizer = useVirtualizer({
    count: items.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 52,
    overscan: 10,
  });

  return (
    <div
      ref={parentRef}
      style={{
        height: '240px',
        overflowY: 'auto',
        border: `1px solid ${tokens.colors.border.subtle}`,
        borderRadius: tokens.radii.md,
        backgroundColor: tokens.colors.bg.primary,
        marginTop: tokens.spacing[3],
      }}
    >
      <div style={{ height: `${rowVirtualizer.getTotalSize()}px`, width: '100%', position: 'relative' }}>
        {rowVirtualizer.getVirtualItems().map((vRow) => {
          const item = items[vRow.index];
          if (!item) return null;

          return (
            <div
              key={vRow.index}
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                transform: `translateY(${vRow.start}px)`,
                padding: `${tokens.spacing[2]} ${tokens.spacing[3]}`,
                borderBottom: `1px solid ${tokens.colors.border.subtle}`,
                boxSizing: 'border-box',
                fontSize: tokens.typography.fontSize.xs,
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
              }}
            >
              <div style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '80%' }}>
                <strong>{item.title}</strong>
                <div style={{ color: tokens.colors.text.muted, fontSize: '10px' }}>{item.url}</div>
              </div>
              <span style={{
                padding: '2px 8px',
                borderRadius: tokens.radii.full,
                backgroundColor: `${item.color}22`,
                color: item.color,
                fontWeight: 700,
              }}>
                {item.score}%
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

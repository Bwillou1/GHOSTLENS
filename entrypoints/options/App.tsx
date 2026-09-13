import { useState, useEffect } from 'react';
import { SettingsSchema, DEFAULT_SETTINGS } from '@/src/core/signals/types';
import { getSettings, saveSettings, clearAllLocalData } from '@/src/core/cache/idb';
import { tokens } from '@/src/ui/tokens';
import { t, setLanguage, getLanguage, Language } from '@/src/i18n';

export default function OptionsApp() {
  const [settings, setSettings] = useState<SettingsSchema>(DEFAULT_SETTINGS);
  const [savedMessage, setSavedMessage] = useState<string>('');
  const [lang, setLang] = useState<Language>(getLanguage());

  useEffect(() => {
    getSettings().then((res) => {
      setSettings(res);
      setLang(res.language);
      setLanguage(res.language);
    });
  }, []);

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

  const handleClearAll = async () => {
    if (confirm(t('options.clearAllConfirm'))) {
      await clearAllLocalData();
      alert('Toutes les données en cache ont été supprimées.');
    }
  };

  return (
    <div style={{
      maxWidth: '780px',
      margin: '0 auto',
      padding: tokens.spacing[6],
      fontFamily: tokens.typography.fontFamily.sans,
      color: tokens.colors.text.primary,
    }}>
      <header style={{ marginBottom: tokens.spacing[6], borderBottom: `1px solid ${tokens.colors.border.subtle}`, paddingBottom: tokens.spacing[4] }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: tokens.spacing[2], marginBottom: tokens.spacing[2] }}>
          <span style={{ fontSize: '28px' }}>👁️</span>
          <h1 style={{ fontSize: tokens.typography.fontSize.xxl, fontWeight: tokens.typography.fontWeight.bold, margin: 0 }}>
            GhostLens — Réglages
          </h1>
        </div>
        <p style={{ color: tokens.colors.text.secondary, margin: 0, fontSize: tokens.typography.fontSize.sm }}>
          Contrôle total des seuils de détection, du mode de blocage et de la confidentialité locale.
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
          <span>Surlignage discret des phrases</span>
          <input
            type="checkbox"
            checked={settings.highlight}
            onChange={(e) => handleSave({ ...settings, highlight: e.target.checked })}
          />
        </div>
      </section>

      {/* Section 2 : Mode de Blocage */}
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

        <div style={{ display: 'flex', flexDirection: 'column', gap: tokens.spacing[2], marginTop: tokens.spacing[3] }}>
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
                {mode === 'warn' && 'Bandeau d\'avertissement pour les contenus suspects.'}
                {mode === 'block' && 'Écran de verrouillage complet si score IA ≥ 80% (avec déblocage en un clic).'}
              </span>
            </label>
          ))}
        </div>
      </section>

      {/* Section 3 : Confidentialité & Données */}
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

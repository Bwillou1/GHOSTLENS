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

const ATTRIBUTION_LIST = [
  {
    name: '@mozilla/readability',
    author: 'Mozilla Corporation',
    license: 'Apache-2.0',
    role: 'Extraction chirurgicale d’articles « zéro-erreur » et isolation du contenu éditorial (C-3)',
    url: 'https://github.com/mozilla/readability',
  },
  {
    name: 'onnxruntime-web',
    author: 'Microsoft Corporation',
    license: 'MIT',
    role: 'Moteur d’inférence Transformer INT8 en local (WebGPU / WASM multithread)',
    url: 'https://github.com/microsoft/onnxruntime',
  },
  {
    name: 'fastText',
    author: 'Meta / Facebook Research',
    license: 'MIT',
    role: 'Classifieur supervisé n-grams et détection instantanée de langue',
    url: 'https://github.com/facebookresearch/fastText',
  },
  {
    name: 'Binoculars (ICML 2024)',
    author: 'Abhimanyu Hans et al.',
    license: 'BSD-3-Clause',
    role: 'Détection zero-shot de pointe par rapport de perplexités croisées',
    url: 'https://github.com/ahans30/Binoculars',
  },
  {
    name: 'slopguard',
    author: 'Blue-B',
    license: 'Source Available',
    role: 'Philosophie human-in-the-loop et triage des signatures IA GitHub',
    url: 'https://github.com/Blue-B/slopguard',
  },
  {
    name: 'MarkLLM (EMNLP 2024)',
    author: 'Tsinghua University (THU-BPM)',
    license: 'Apache-2.0',
    role: 'Formules statistiques KGW, SWEET, calcul de z-score et p-value',
    url: 'https://github.com/THU-BPM/MarkLLM',
  },
  {
    name: 'SemaMark',
    author: 'Renjie et al.',
    license: 'MIT',
    role: 'Parades aux attaques par homoglyphes et normalisation de texte',
    url: 'https://github.com/renjie3/SemaMark',
  },
  {
    name: 'CredID (Watermarking)',
    author: 'Jhy549 & Collaborateurs',
    license: 'MIT',
    role: 'Décodage de payload watermark multi-bits et traçabilité',
    url: 'https://github.com/jhy549/credible_LLM_watermarking',
  },
  {
    name: 'zippy',
    author: 'Thinkst Applied Research',
    license: 'BSD-3-Clause',
    role: 'Analyse d’entropie par compression Deflate et mesure de burstiness',
    url: 'https://github.com/thinkst/zippy',
  },
  {
    name: 'slop-score',
    author: 'Sam Paech',
    license: 'MIT',
    role: 'Corpus d’AI-isms et détection de tournures antithétiques',
    url: 'https://github.com/sam-paech/slop-score',
  },
  {
    name: 'LanguageTool',
    author: 'LanguageTool Community',
    license: 'LGPL-2.1',
    role: 'Règles typographiques françaises/anglaises et connecteur local',
    url: 'https://github.com/languagetool-org/languagetool',
  },
  {
    name: 'plagiarism-checker',
    author: 'Irgi Febry',
    license: 'MIT',
    role: 'Métriques statistiques TTR, Hapax, Flesch et calcul SimHash 64-bit',
    url: 'https://github.com/irgifebry/plagiarism-checker',
  },
  {
    name: 'Astryx Design Tokens',
    author: 'Meta Platforms',
    license: 'MIT',
    role: 'Design tokens, palettes de couleurs sombres et typographie',
    url: 'https://github.com/facebook/astryx',
  },
  {
    name: '@tanstack/react-virtual',
    author: 'Tanner Linsley / TanStack',
    license: 'MIT',
    role: 'Virtualisation fluide 60 fps des rapports et listes de phrases',
    url: 'https://github.com/TanStack/virtual',
  },
  {
    name: 'pako',
    author: 'Vitaly Puzrin, Andrei Tuputcyn',
    license: 'MIT',
    role: 'Compression Deflate / zlib rapide in-browser pour l’entropie D3',
    url: 'https://github.com/nodeca/pako',
  },
  {
    name: 'wxt',
    author: 'Aaron Klinker & WXT contributors',
    license: 'MIT',
    role: 'Framework moderne d’extension Chromium Manifest V3',
    url: 'https://github.com/wxt-dev/wxt',
  },
  {
    name: 'idb',
    author: 'Jake Archibald',
    license: 'ISC',
    role: 'Gestion asynchrone sécurisée de la base IndexedDB locale',
    url: 'https://github.com/jakearchibald/idb',
  },
  {
    name: 'lucide-react',
    author: 'Lucide Contributors',
    license: 'ISC',
    role: 'Icônes vectorielles modernes et accessibles',
    url: 'https://github.com/lucide-icons/lucide',
  },
];

export default function OptionsApp() {
  const [activeTab, setActiveTab] = useState<'settings' | 'history' | 'licenses'>('settings');
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
      maxWidth: '860px',
      margin: '0 auto',
      padding: tokens.spacing[6],
      fontFamily: tokens.typography.fontFamily.sans,
      color: tokens.colors.text.primary,
    }}>
      <header style={{ marginBottom: tokens.spacing[5], borderBottom: `1px solid ${tokens.colors.border.subtle}`, paddingBottom: tokens.spacing[4] }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: tokens.spacing[2] }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: tokens.spacing[3] }}>
            <span style={{ fontSize: '32px' }}>👁️</span>
            <div>
              <h1 style={{ fontSize: tokens.typography.fontSize.xxl, fontWeight: tokens.typography.fontWeight.bold, margin: 0 }}>
                GhostLens — Paramètres & Licences
              </h1>
              <p style={{ color: tokens.colors.text.secondary, margin: 0, fontSize: tokens.typography.fontSize.xs, marginTop: '2px' }}>
                100% Local • Zéro Télémétrie • Protection de la vie privée
              </p>
            </div>
          </div>
          <span style={{
            fontSize: tokens.typography.fontSize.xs,
            padding: '4px 10px',
            borderRadius: tokens.radii.full,
            backgroundColor: 'rgba(56, 189, 248, 0.15)',
            color: tokens.colors.text.accent,
            fontWeight: 600,
          }}>
            v1.0.0
          </span>
        </div>

        {/* Navigation par Onglets */}
        <div style={{ display: 'flex', gap: tokens.spacing[2], marginTop: tokens.spacing[4] }}>
          <button
            onClick={() => setActiveTab('settings')}
            style={{
              padding: '8px 16px',
              borderRadius: tokens.radii.md,
              border: 'none',
              backgroundColor: activeTab === 'settings' ? tokens.colors.bg.tertiary : 'transparent',
              color: activeTab === 'settings' ? tokens.colors.text.primary : tokens.colors.text.secondary,
              fontWeight: activeTab === 'settings' ? 600 : 500,
              fontSize: tokens.typography.fontSize.sm,
              cursor: 'pointer',
              transition: `all ${tokens.transitions.fast}`,
            }}
          >
            ⚙️ Paramètres & Détection
          </button>
          <button
            onClick={() => setActiveTab('history')}
            style={{
              padding: '8px 16px',
              borderRadius: tokens.radii.md,
              border: 'none',
              backgroundColor: activeTab === 'history' ? tokens.colors.bg.tertiary : 'transparent',
              color: activeTab === 'history' ? tokens.colors.text.primary : tokens.colors.text.secondary,
              fontWeight: activeTab === 'history' ? 600 : 500,
              fontSize: tokens.typography.fontSize.sm,
              cursor: 'pointer',
              transition: `all ${tokens.transitions.fast}`,
            }}
          >
            🌐 Exceptions & Historique ({historyItems.length})
          </button>
          <button
            onClick={() => setActiveTab('licenses')}
            style={{
              padding: '8px 16px',
              borderRadius: tokens.radii.md,
              border: 'none',
              backgroundColor: activeTab === 'licenses' ? tokens.colors.bg.tertiary : 'transparent',
              color: activeTab === 'licenses' ? '#38bdf8' : tokens.colors.text.secondary,
              fontWeight: activeTab === 'licenses' ? 600 : 500,
              fontSize: tokens.typography.fontSize.sm,
              cursor: 'pointer',
              transition: `all ${tokens.transitions.fast}`,
            }}
          >
            📜 Licences & Remerciements ({ATTRIBUTION_LIST.length})
          </button>
        </div>
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

      {/* ONGLET 1 : Paramètres & Détection */}
      {activeTab === 'settings' && (
        <>
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

          {/* Section Confidentialité */}
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
            <p style={{ fontSize: tokens.typography.fontSize.sm, color: tokens.colors.text.secondary, margin: 0 }}>
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
                marginTop: tokens.spacing[3],
              }}
            >
              {t('options.clearAll')}
            </button>
          </section>
        </>
      )}

      {/* ONGLET 2 : Exceptions & Historique */}
      {activeTab === 'history' && (
        <>
          {/* Section Exceptions */}
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

          {/* Section Historique Virtualisé */}
          <section style={{
            padding: tokens.spacing[5],
            backgroundColor: tokens.colors.bg.secondary,
            borderRadius: tokens.radii.lg,
            border: `1px solid ${tokens.colors.border.subtle}`,
            marginBottom: tokens.spacing[5],
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h2 style={{ fontSize: tokens.typography.fontSize.lg, fontWeight: tokens.typography.fontWeight.semibold, margin: 0 }}>
                Historique Local ({historyItems.length} pages)
              </h2>
              {historyItems.length > 0 && (
                <button
                  onClick={handleClearAll}
                  style={{
                    padding: '4px 10px',
                    backgroundColor: 'transparent',
                    color: '#f87171',
                    border: '1px solid rgba(248, 113, 113, 0.4)',
                    borderRadius: tokens.radii.md,
                    fontSize: '11px',
                    cursor: 'pointer',
                  }}
                >
                  Vider l'historique
                </button>
              )}
            </div>
            {historyItems.length > 0 ? (
              <HistoryVirtualList items={historyItems} />
            ) : (
              <p style={{ fontSize: tokens.typography.fontSize.xs, color: tokens.colors.text.muted, marginTop: tokens.spacing[3], margin: 0 }}>
                Aucune page enregistrée dans l'historique pour l'instant.
              </p>
            )}
          </section>
        </>
      )}

      {/* ONGLET 3 : Licences, Attributions & Remerciements */}
      {activeTab === 'licenses' && (
        <section style={{
          padding: tokens.spacing[5],
          backgroundColor: tokens.colors.bg.secondary,
          borderRadius: tokens.radii.lg,
          border: `1px solid ${tokens.colors.border.subtle}`,
          marginBottom: tokens.spacing[5],
        }}>
          <div style={{ marginBottom: tokens.spacing[4] }}>
            <h2 style={{ fontSize: tokens.typography.fontSize.lg, fontWeight: tokens.typography.fontWeight.semibold, marginTop: 0, marginBottom: '6px' }}>
              🙏 Remerciements & Attribution Open Source
            </h2>
            <p style={{ fontSize: tokens.typography.fontSize.sm, color: tokens.colors.text.secondary, margin: 0, lineHeight: 1.5 }}>
              GhostLens intègre et s'inspire des travaux de pionniers de la recherche en IA, du traitement du langage naturel et de l'ingénierie open source.
              Nous adressons nos plus vifs remerciements à tous les auteurs et contributeurs listés ci-dessous :
            </p>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: tokens.spacing[3] }}>
            {ATTRIBUTION_LIST.map((item, idx) => (
              <div
                key={idx}
                style={{
                  padding: tokens.spacing[4],
                  backgroundColor: tokens.colors.bg.tertiary,
                  borderRadius: tokens.radii.md,
                  border: `1px solid ${tokens.colors.border.subtle}`,
                  display: 'flex',
                  flexDirection: 'column',
                  gap: tokens.spacing[1],
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <a
                    href={item.url}
                    target="_blank"
                    rel="noreferrer"
                    style={{
                      color: '#38bdf8',
                      fontWeight: 600,
                      fontSize: tokens.typography.fontSize.sm,
                      textDecoration: 'none',
                    }}
                  >
                    {item.name} ↗
                  </a>
                  <span style={{
                    fontSize: '11px',
                    padding: '2px 8px',
                    borderRadius: tokens.radii.full,
                    backgroundColor: 'rgba(56, 189, 248, 0.1)',
                    color: '#38bdf8',
                    fontWeight: 600,
                    border: '1px solid rgba(56, 189, 248, 0.2)',
                  }}>
                    {item.license}
                  </span>
                </div>
                <div style={{ fontSize: '11px', color: tokens.colors.text.muted }}>
                  Auteur / Équipe : <strong>{item.author}</strong>
                </div>
                <div style={{ fontSize: tokens.typography.fontSize.xs, color: tokens.colors.text.secondary, marginTop: '2px', lineHeight: 1.4 }}>
                  {item.role}
                </div>
              </div>
            ))}
          </div>

          <div style={{
            marginTop: tokens.spacing[5],
            padding: tokens.spacing[4],
            backgroundColor: 'rgba(15, 23, 42, 0.6)',
            borderRadius: tokens.radii.md,
            border: `1px solid ${tokens.colors.border.default}`,
            fontSize: '11px',
            color: tokens.colors.text.muted,
            lineHeight: 1.5,
          }}>
            <strong style={{ color: tokens.colors.text.primary }}>Note de Conformité :</strong> Toutes les licences open source amonts (MIT, Apache-2.0, BSD-3-Clause, ISC, LGPL-2.1) sont rigoureusement respectées. Aucun composant privateur ou à licence restrictive n'est inclus sans attribution complète.
          </div>
        </section>
      )}
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

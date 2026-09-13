/**
 * Astryx Design System Tokens (Meta)
 * Adaptés pour GhostLens — Accessibilité WCAG AA & Haute lisibilité
 */

export const tokens = {
  colors: {
    // Teintes sémantiques GhostLens (§6.4)
    human: '#16a34a',      // 0–29: Vert (Probablement humain)
    mixed: '#eab308',      // 30–59: Jaune (Mixte / incertain)
    likelyAi: '#f97316',   // 60–79: Orange (Probablement IA)
    ai: '#dc2626',         // 80–100: Rouge (Généré par IA)
    insufficient: '#6b7280',// Gris (Données insuffisantes)

    // Palette de fond et surfaces
    bg: {
      primary: '#0f172a',
      secondary: '#1e293b',
      tertiary: '#334155',
      overlay: 'rgba(15, 23, 42, 0.92)',
      card: '#1e293b',
      cardHover: '#283548',
    },

    // Texte
    text: {
      primary: '#f8fafc',
      secondary: '#94a3b8',
      muted: '#64748b',
      inverse: '#0f172a',
      accent: '#38bdf8',
    },

    // Bordures
    border: {
      subtle: 'rgba(255, 255, 255, 0.08)',
      default: 'rgba(255, 255, 255, 0.15)',
      focus: '#38bdf8',
    },

    // Badges opacités
    badgeAlpha: 0.12,
  },

  typography: {
    fontFamily: {
      sans: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
      mono: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace',
    },
    fontSize: {
      xs: '11px',
      sm: '12px',
      base: '14px',
      lg: '16px',
      xl: '20px',
      xxl: '28px',
      hero: '42px',
    },
    fontWeight: {
      regular: '400',
      medium: '500',
      semibold: '600',
      bold: '700',
    },
  },

  radii: {
    xs: '4px',
    sm: '6px',
    md: '8px',
    lg: '12px',
    xl: '16px',
    full: '9999px',
  },

  shadows: {
    sm: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
    md: '0 4px 6px -1px rgba(0, 0, 0, 0.2), 0 2px 4px -1px rgba(0, 0, 0, 0.1)',
    lg: '0 10px 15px -3px rgba(0, 0, 0, 0.3), 0 4px 6px -2px rgba(0, 0, 0, 0.15)',
    xl: '0 20px 25px -5px rgba(0, 0, 0, 0.4), 0 10px 10px -5px rgba(0, 0, 0, 0.2)',
    badge: '0 2px 8px rgba(0, 0, 0, 0.25)',
  },

  spacing: {
    1: '4px',
    2: '8px',
    3: '12px',
    4: '16px',
    5: '20px',
    6: '24px',
    8: '32px',
  },

  transitions: {
    fast: '150ms cubic-bezier(0.4, 0, 0.2, 1)',
    normal: '250ms cubic-bezier(0.4, 0, 0.2, 1)',
  },
} as const;

export type AstryxTokens = typeof tokens;

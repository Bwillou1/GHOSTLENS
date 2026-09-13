import { defineConfig } from 'wxt';

export default defineConfig({
  extensionApi: 'chrome',
  modules: ['@wxt-dev/module-react'],
  manifest: {
    name: 'GhostLens — Détecteur IA Local & Éthique',
    description: 'Détection de texte et images IA en temps réel, 100% locale, explicable et sans compromis sur la vie privée.',
    version: '1.0.0',
    manifest_version: 3,
    icons: {
      16: 'icons/icon-16.png',
      32: 'icons/icon-32.png',
      48: 'icons/icon-48.png',
      128: 'icons/icon-128.png',
    },
    permissions: [
      'storage',
      'unlimitedStorage',
      'sidePanel',
      'activeTab'
    ],
    host_permissions: ['<all_urls>'],
    commands: {
      'toggle-report': {
        suggested_key: {
          default: 'Ctrl+Shift+G',
          mac: 'Command+Shift+G',
        },
        description: 'Ouvrir ou fermer le rapport GhostLens (Side Panel)',
      },
      'toggle-badge': {
        suggested_key: {
          default: 'Ctrl+Shift+B',
          mac: 'Command+Shift+B',
        },
        description: 'Afficher ou masquer le badge GhostLens',
      },
      'humanize-selection': {
        suggested_key: {
          default: 'Ctrl+Shift+H',
          mac: 'Command+Shift+H',
        },
        description: 'Humaniser la sélection de texte',
      },
      'block-page': {
        suggested_key: {
          default: 'Ctrl+Shift+X',
          mac: 'Command+Shift+X',
        },
        description: 'Bloquer ou débloquer la page courante',
      },
    },
    action: {
      default_title: 'GhostLens',
    },
    content_security_policy: {
      extension_pages: "script-src 'self' 'wasm-unsafe-eval'; object-src 'self';",
    },
  },
});

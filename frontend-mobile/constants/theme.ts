import { Platform } from 'react-native';

// Palette principale : indigo moderne, gaming vibe
const tintColorLight = '#6366f1'; // indigo-500
const tintColorDark = '#818cf8';  // indigo-400 (plus doux en dark)

export const Colors = {
  light: {
    text: '#0f172a',           // slate-900
    background: '#f8fafc',     // slate-50 — fond légèrement teinté
    surface: '#ffffff',        // cartes blanches
    tint: tintColorLight,
    icon: '#64748b',           // slate-500
    border: '#e2e8f0',         // slate-200
    tabIconDefault: '#94a3b8', // slate-400
    tabIconSelected: tintColorLight,
  },
  dark: {
    text: '#f1f5f9',           // slate-100
    background: '#0f172a',     // slate-900
    surface: '#1e293b',        // slate-800 — cartes
    tint: tintColorDark,
    icon: '#94a3b8',           // slate-400
    border: '#334155',         // slate-700
    tabIconDefault: '#475569', // slate-600
    tabIconSelected: tintColorDark,
  },
};

export const Fonts = Platform.select({
  ios: {
    sans: 'system-ui',
    serif: 'ui-serif',
    rounded: 'ui-rounded',
    mono: 'ui-monospace',
  },
  default: {
    sans: 'normal',
    serif: 'serif',
    rounded: 'normal',
    mono: 'monospace',
  },
  web: {
    sans: "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
    serif: "Georgia, 'Times New Roman', serif",
    rounded: "'SF Pro Rounded', 'Hiragino Maru Gothic ProN', Meiryo, 'MS PGothic', sans-serif",
    mono: "SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace",
  },
});

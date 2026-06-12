import { Platform } from 'react-native';

const ORANGE = '#f97316';

// Dark/orange gaming palette — applied for both light and dark system themes
// so the app always renders in gaming-dark mode regardless of device setting.
const dark = {
  text:            '#f1f5f9',
  background:      '#0b0f19',
  surface:         '#121824',
  surfaceAlt:      '#161b22',
  tint:            ORANGE,
  tintDim:         'rgba(249,115,22,0.13)',
  tintBorder:      'rgba(249,115,22,0.28)',
  icon:            '#94a3b8',
  border:          '#1e2a3a',
  tabIconDefault:  '#475569',
  tabIconSelected: ORANGE,
  red:             '#ef4444',
  green:           '#22c55e',
  blue:            '#3b82f6',
  amber:           '#f59e0b',
};

export const Colors = {
  light: dark,
  dark,
};

export const Fonts = Platform.select({
  ios: {
    sans:    'system-ui',
    serif:   'ui-serif',
    rounded: 'ui-rounded',
    mono:    'ui-monospace',
  },
  default: {
    sans:    'normal',
    serif:   'serif',
    rounded: 'normal',
    mono:    'monospace',
  },
  web: {
    sans:    "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
    serif:   "Georgia, 'Times New Roman', serif",
    rounded: "'SF Pro Rounded', 'Hiragino Maru Gothic ProN', Meiryo, 'MS PGothic', sans-serif",
    mono:    "SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace",
  },
});

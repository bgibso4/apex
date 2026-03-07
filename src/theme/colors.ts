/**
 * APEX Design System — Color Tokens
 * From Design Doc v0.2
 */

export const Colors = {
  // Backgrounds
  bg: '#0a0a0f',
  card: '#141420',
  cardHover: '#1a1a2e',
  surface: '#1e1e30',

  // Borders
  border: '#2a2a3e',
  borderLight: '#3a3a4e',

  // Text
  text: '#ffffff',
  textSecondary: '#a0a0b8',
  textDim: '#6a6a80',
  textMuted: '#4a4a5e',

  // Primary / Accent
  indigo: '#6366f1',
  indigoDark: '#4f46e5',
  indigoLight: '#818cf8',
  indigoMuted: '#6366f120',

  // Semantic Colors
  green: '#22c55e',
  greenMuted: '#22c55e20',
  amber: '#f59e0b',
  amberMuted: '#f59e0b20',
  red: '#ef4444',
  redMuted: '#ef444420',

  // Block Colors (periodization)
  hypertrophy: '#6366f1', // indigo
  deload: '#22c55e',      // green
  strength: '#f59e0b',    // amber/orange
  realization: '#ec4899', // pink

  // Special
  cyan: '#06b6d4',    // mobility/running
  cyanMuted: '#06b6d420',

  // Completed states
  greenFaint: '#22c55e18',
  greenBorderFaint: '#22c55e30',

  // Active card border
  indigoBorderFaint: '#6366f130',

  // Block segment backgrounds (inactive / semi-transparent)
  hypertrophyMuted: '#6366f130',
  strengthMuted: '#f59e0b30',
  realizationMuted: '#ec489930',
  deloadMuted: '#22c55e30',
} as const;

export type ColorKey = keyof typeof Colors;

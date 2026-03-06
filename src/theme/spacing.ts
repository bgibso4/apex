/**
 * APEX Design System — Spacing & Typography
 */

export const Spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  xxxl: 32,

  // Layout tokens (semantic names for repeated screen patterns)
  screenTop: 60,
  screenBottom: 40,
  screenHorizontal: 16,
} as const;

export const FontSize = {
  xs: 10,
  sm: 12,
  md: 14,
  lg: 16,
  xl: 18,
  xxl: 22,
  xxxl: 28,

  chartLabel: 9,
  tabLabel: 11,
  logo: 36,
} as const;

export const BorderRadius = {
  xs: 3,
  sm: 6,
  md: 10,
  lg: 14,
  xl: 18,
  pill: 99,
} as const;

/** Component size tokens for tap targets and interactive elements */
export const ComponentSize = {
  buttonSmall: 28,
  buttonMedium: 36,
  buttonLarge: 44,
  modalWidth: 300,
  chartHeight: 120,
  chartHeightSmall: 80,
  tabBarHeight: 85,
  tabBarPaddingBottom: 30,
  tabBarPaddingTop: 8,
} as const;

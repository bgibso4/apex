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
  screenTop: 72,
  screenBottom: 40,
  screenHorizontal: 24,

  // Content gap patterns from mockups
  contentGap: 24,
  cardPadding: 24,
  cardPaddingCompact: 20,
  sectionGap: 20,
} as const;

export const FontSize = {
  xs: 10,
  sm: 12,
  body: 13,
  md: 14,
  base: 15,
  lg: 16,
  xl: 18,
  title: 19,
  subtitle: 20,
  xxl: 22,
  sectionTitle: 24,
  xxxl: 28,
  screenTitle: 32,
  hero: 40,

  chartLabel: 9,
  tabLabel: 10,
  sectionLabel: 11,
  logo: 36,
} as const;

export const BorderRadius = {
  xs: 3,
  sm: 6,
  button: 8,
  md: 10,
  cardInner: 12,
  lg: 14,
  xl: 18,
  modal: 20,
  pill: 99,
} as const;

/** Component size tokens for tap targets and interactive elements */
export const ComponentSize = {
  buttonSmall: 28,
  buttonMedium: 36,
  buttonLarge: 44,
  setButtonWidth: 56,
  setButtonHeight: 36,
  dayDotSize: 28,
  warmupCheckSize: 24,
  conditioningCheckSize: 28,
  modalWidth: 300,
  progressBarHeight: 4,
  timelineHeight: 32,
  timelineHeightSmall: 24,
  chartHeight: 120,
  chartHeightSmall: 80,
  tabBarHeight: 84,
  tabBarPaddingBottom: 28,
  tabBarPaddingTop: 8,

  // Volume bar chart
  volumeBarHeight: 20,
  volumeBarInnerHeight: 12,
  volumeNumsWidth: 55,
  volumeWeekLabelWidth: 24,

  // Legend / indicator dots
  legendDotSize: 8,
  bandDotSize: 6,
} as const;

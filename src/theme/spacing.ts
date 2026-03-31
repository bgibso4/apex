// src/theme/spacing.ts
// Spacing, FontSize, and BorderRadius are now in @cadre/shared.
// This file only contains Apex-specific component size tokens.

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

import { StyleSheet } from 'react-native';
import { Colors } from './colors';
import { Spacing, FontSize, BorderRadius } from './spacing';

/** Shared styles reused across multiple screens */
export const SharedStyles = StyleSheet.create({
  // Screen scroll container — used in every tab screen
  screenContainer: { flex: 1, backgroundColor: Colors.bg },
  scrollContent: {
    paddingTop: Spacing.screenTop,
    paddingHorizontal: Spacing.screenHorizontal,
    paddingBottom: Spacing.screenBottom,
  },

  // Card — the primary content container
  card: {
    backgroundColor: Colors.card,
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    marginBottom: Spacing.lg,
  },

  // Section label — "THIS WEEK", "ESTIMATED 1RM", etc.
  sectionLabel: {
    color: Colors.textDim,
    fontSize: FontSize.xs,
    fontWeight: '700',
    letterSpacing: 1,
    marginBottom: Spacing.md,
  },

  // Primary action button
  primaryButton: {
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.md,
    alignItems: 'center' as const,
  },
  primaryButtonText: {
    color: Colors.text,
    fontSize: FontSize.md,
    fontWeight: '700',
  },
});

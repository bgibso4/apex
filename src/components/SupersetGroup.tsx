import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Colors } from '../theme/colors';
import { Spacing, FontSize, BorderRadius } from '../theme/spacing';

interface SupersetGroupProps {
  groupSize: number;
  children: React.ReactNode;
}

function getGroupLabel(size: number): string {
  if (size === 2) return 'Superset';
  if (size === 3) return 'Tri-set';
  return 'Giant set';
}

export function SupersetGroup({ groupSize, children }: SupersetGroupProps) {
  return (
    <View style={styles.container}>
      <View style={styles.labelRow}>
        <View style={styles.badge}>
          <Text style={styles.badgeText}>{getGroupLabel(groupSize)}</Text>
        </View>
      </View>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderWidth: 1,
    borderColor: Colors.indigoBorderFaint,
    borderRadius: 16,
    padding: 2,
  },
  labelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.sm,
    paddingBottom: Spacing.xs,
  },
  badge: {
    backgroundColor: Colors.indigoMuted,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 3,
    borderRadius: BorderRadius.sm,
  },
  badgeText: {
    fontSize: FontSize.xs,
    fontWeight: '700',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
    color: Colors.indigo,
  },
});

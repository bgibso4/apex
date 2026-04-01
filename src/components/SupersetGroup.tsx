import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Colors, Spacing, FontSize, BorderRadius } from '@cadre/shared/theme';

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
  // Interleave connector lines between children
  const childArray = React.Children.toArray(children);
  const interleaved: React.ReactNode[] = [];
  childArray.forEach((child, i) => {
    interleaved.push(child);
    if (i < childArray.length - 1) {
      interleaved.push(
        <View key={`connector-${i}`} style={styles.connector} />
      );
    }
  });

  return (
    <View style={styles.container}>
      <View style={styles.labelRow}>
        <View style={styles.badge}>
          <Text style={styles.badgeText}>{getGroupLabel(groupSize)}</Text>
        </View>
      </View>
      {interleaved}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderWidth: 1,
    borderColor: '#6366f150',
    borderRadius: 16,
    padding: Spacing.xs,
    marginBottom: Spacing.sm,
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
  connector: {
    width: 2,
    height: 12,
    backgroundColor: '#6366f180',
    alignSelf: 'center',
    borderRadius: 1,
    marginTop: -8,
    marginBottom: -4,
  },
});

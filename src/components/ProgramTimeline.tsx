import { View, Text, StyleSheet } from 'react-native';
import { Colors, Spacing, FontSize, BorderRadius } from '../theme';
import { getBlockForWeek, getBlockColor } from '../utils/program';
import type { Block } from '../types';

export interface ProgramTimelineProps {
  durationWeeks: number;
  blocks: Block[];
  currentWeek: number;
}

export function ProgramTimeline({ durationWeeks, blocks, currentWeek }: ProgramTimelineProps) {
  return (
    <View style={styles.card}>
      <Text style={styles.cardLabel}>PROGRAM TIMELINE</Text>
      <View style={styles.timeline}>
        {Array.from({ length: durationWeeks }, (_, i) => {
          const weekNum = i + 1;
          const weekBlock = getBlockForWeek(blocks, weekNum);
          const color = weekBlock ? getBlockColor(weekBlock) : Colors.border;
          const isCurrent = weekNum === currentWeek;
          return (
            <View
              key={i}
              style={[
                styles.timelineBar,
                {
                  backgroundColor: isCurrent ? color : `${color}40`,
                  borderWidth: isCurrent ? 1.5 : 0,
                  borderColor: isCurrent ? color : 'transparent',
                }
              ]}
            />
          );
        })}
      </View>
      <View style={styles.timelineLabels}>
        {blocks.map((b, i) => (
          <Text key={i} style={[styles.timelineLabelText, { color: getBlockColor(b) }]}>
            {b.name}
          </Text>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.card, borderRadius: BorderRadius.lg,
    padding: Spacing.lg, marginBottom: Spacing.lg,
  },
  cardLabel: {
    color: Colors.textDim, fontSize: FontSize.xs,
    fontWeight: '700', letterSpacing: 1, marginBottom: Spacing.md,
  },
  timeline: {
    flexDirection: 'row', gap: BorderRadius.xs, marginBottom: Spacing.sm,
  },
  timelineBar: {
    flex: 1, height: Spacing.sm, borderRadius: BorderRadius.xs,
  },
  timelineLabels: {
    flexDirection: 'row', justifyContent: 'space-between',
  },
  timelineLabelText: { fontSize: FontSize.xs, fontWeight: '500' },
});

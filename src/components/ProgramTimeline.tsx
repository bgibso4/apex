import { View, Text, StyleSheet } from 'react-native';
import { Colors, Spacing, FontSize, BorderRadius, ComponentSize } from '../theme';
import { getBlockForWeek, getBlockColor } from '../utils/program';
import type { Block } from '../types';

export interface ProgramTimelineProps {
  durationWeeks: number;
  blocks: Block[];
  currentWeek: number;
}

export function ProgramTimeline({ durationWeeks, blocks, currentWeek }: ProgramTimelineProps) {
  const currentBlock = getBlockForWeek(blocks, currentWeek);

  return (
    <View style={styles.timeline}>
      {blocks.map((block, i) => {
        const color = getBlockColor(block);
        const isActive = currentBlock === block;
        const weeksInBlock = block.weeks.length;
        // Short label: first 3 chars, or full name if short enough
        const label = block.name.length <= 5 ? block.name :
          block.name.substring(0, 3);

        return (
          <View
            key={i}
            style={[
              styles.segment,
              {
                flex: weeksInBlock,
                backgroundColor: isActive ? color : `${color}30`,
              },
            ]}
          >
            <Text style={[
              styles.segmentLabel,
              { color: isActive ? Colors.text : `rgba(255,255,255,0.5)` },
            ]}>
              {label}
            </Text>
            {isActive && <View style={styles.activeIndicator} />}
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  timeline: {
    flexDirection: 'row',
    gap: BorderRadius.xs,
    height: ComponentSize.timelineHeight,
    borderRadius: BorderRadius.button,
    overflow: 'hidden',
    marginBottom: Spacing.xxl,
  },
  segment: {
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  segmentLabel: {
    fontSize: FontSize.chartLabel,
    fontWeight: '700',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  activeIndicator: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 3,
    backgroundColor: Colors.text,
    borderRadius: 2,
  },
});

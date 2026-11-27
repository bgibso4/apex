import { View, Text, StyleSheet } from 'react-native';
import { BorderRadius, ComponentSize } from '../theme';
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
                backgroundColor: isActive ? `${color}B3` : `${color}22`,
              },
            ]}
          >
            <Text style={[
              styles.segmentLabel,
              { color: isActive ? 'rgba(255,255,255,0.85)' : 'rgba(255,255,255,0.3)' },
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
    height: ComponentSize.timelineHeightSmall,
    borderRadius: BorderRadius.button,
    overflow: 'hidden',
  },
  segment: {
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  segmentLabel: {
    fontSize: 8,
    fontWeight: '700',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  activeIndicator: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 2,
    backgroundColor: 'rgba(255,255,255,0.5)',
    borderRadius: 2,
  },
});

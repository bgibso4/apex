/**
 * APEX — Focus chips
 * Small goal tags shown under a program's name (from definition.program.focus).
 */

import { View, Text, StyleSheet } from 'react-native';
import type { StyleProp, ViewStyle } from 'react-native';
import { Colors, BorderRadius } from '../theme';

interface FocusChipsProps {
  focus?: string[];
  style?: StyleProp<ViewStyle>;
}

export function FocusChips({ focus, style }: FocusChipsProps) {
  if (!focus || focus.length === 0) return null;

  return (
    <View style={[styles.row, style]}>
      {focus.map(tag => (
        <View key={tag} style={styles.chip}>
          <Text style={styles.chipText}>{tag.toUpperCase()}</Text>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  chip: {
    backgroundColor: Colors.indigoMuted,
    borderWidth: 1,
    borderColor: Colors.indigoBorderFaint,
    borderRadius: BorderRadius.pill,
    paddingHorizontal: 9,
    paddingVertical: 3,
  },
  chipText: {
    color: Colors.indigoLight,
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1,
  },
});

import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Spacing, FontSize, BorderRadius } from '../theme';

export interface SessionSummaryProps {
  exerciseCount: number;
  setCount: number;
}

export function SessionSummary({ exerciseCount, setCount }: SessionSummaryProps) {
  return (
    <View style={styles.card}>
      <Ionicons name="checkmark-circle" size={64} color={Colors.green} />
      <Text style={styles.title}>Session Complete</Text>
      <Text style={styles.summary}>
        {exerciseCount} exercises · {setCount} sets logged
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.card, borderRadius: BorderRadius.lg,
    padding: Spacing.lg, marginBottom: Spacing.lg,
    alignItems: 'center', paddingVertical: Spacing.screenBottom,
  },
  title: {
    color: Colors.text, fontSize: FontSize.xl, fontWeight: '700',
    marginTop: Spacing.lg, textAlign: 'center',
  },
  summary: {
    color: Colors.textSecondary, fontSize: FontSize.md, marginTop: Spacing.sm,
  },
});

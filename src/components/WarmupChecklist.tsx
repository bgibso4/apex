import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { Colors, Spacing, FontSize, BorderRadius } from '../theme';

export interface WarmupChecklistProps {
  warmupRope: boolean;
  warmupAnkle: boolean;
  warmupHipIr: boolean;
  blockColor: string;
  onToggleRope: () => void;
  onToggleAnkle: () => void;
  onToggleHipIr: () => void;
  onContinue: () => void;
}

export function WarmupChecklist({
  warmupRope, warmupAnkle, warmupHipIr, blockColor,
  onToggleRope, onToggleAnkle, onToggleHipIr, onContinue,
}: WarmupChecklistProps) {
  const items = [
    { label: 'Jump Rope (5-7 min)', value: warmupRope, toggle: onToggleRope },
    { label: 'Ankle Protocol', value: warmupAnkle, toggle: onToggleAnkle },
    { label: 'Hip IR Work', value: warmupHipIr, toggle: onToggleHipIr },
  ];

  return (
    <View style={styles.card}>
      <Text style={styles.cardTitle}>Warmup</Text>
      {items.map(({ label, value, toggle }) => (
        <TouchableOpacity
          key={label}
          style={styles.warmupItem}
          onPress={() => {
            toggle();
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          }}
        >
          <Ionicons
            name={value ? 'checkmark-circle' : 'ellipse-outline'}
            size={24}
            color={value ? Colors.green : Colors.textDim}
          />
          <Text style={[
            styles.warmupLabel,
            value && { color: Colors.green, textDecorationLine: 'line-through' as const },
          ]}>{label}</Text>
        </TouchableOpacity>
      ))}
      <TouchableOpacity
        style={[styles.bigButton, { backgroundColor: blockColor }]}
        onPress={onContinue}
      >
        <Text style={styles.bigButtonText}>Start Logging</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.card, borderRadius: BorderRadius.lg,
    padding: Spacing.lg, marginBottom: Spacing.lg,
  },
  cardTitle: { color: Colors.text, fontSize: FontSize.xl, fontWeight: '700', marginBottom: Spacing.lg },
  warmupItem: {
    flexDirection: 'row', alignItems: 'center',
    gap: Spacing.md, paddingVertical: Spacing.md,
    borderBottomWidth: 0.5, borderBottomColor: Colors.border,
  },
  warmupLabel: { color: Colors.textSecondary, fontSize: FontSize.lg },
  bigButton: {
    paddingVertical: Spacing.md, borderRadius: BorderRadius.md,
    alignItems: 'center', marginBottom: Spacing.lg, marginTop: Spacing.md,
  },
  bigButtonText: { color: Colors.text, fontSize: FontSize.md, fontWeight: '700' },
});

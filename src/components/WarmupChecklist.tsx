import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import * as Haptics from 'expo-haptics';
import { Colors, Spacing, FontSize, BorderRadius, ComponentSize } from '../theme';

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
    { label: 'Jump Rope \u2014 3 min', value: warmupRope, toggle: onToggleRope },
    { label: 'Ankle Dorsiflexion Protocol', value: warmupAnkle, toggle: onToggleAnkle },
    { label: 'Hip IR Mobility Work', value: warmupHipIr, toggle: onToggleHipIr },
  ];

  return (
    <View style={styles.container}>
      <View style={styles.items}>
        {items.map(({ label, value, toggle }) => (
          <TouchableOpacity
            key={label}
            style={[
              styles.warmupItem,
              value && styles.warmupItemChecked,
            ]}
            onPress={() => {
              toggle();
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            }}
            activeOpacity={0.7}
          >
            <View style={[
              styles.warmupCheck,
              value && styles.warmupCheckChecked,
            ]}>
              {value && <Text style={styles.warmupCheckText}>{'\u2713'}</Text>}
            </View>
            <Text style={[
              styles.warmupLabel,
              value && styles.warmupLabelChecked,
            ]}>{label}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <TouchableOpacity
        style={styles.continueButton}
        onPress={onContinue}
        activeOpacity={0.8}
      >
        <Text style={styles.continueButtonText}>Continue to Exercises {'\u2192'}</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  items: {
    gap: Spacing.sm,
    flex: 1,
  },
  warmupItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.lg,
    paddingVertical: Spacing.xl - 2, // 18px
    paddingHorizontal: Spacing.cardPaddingCompact,
    backgroundColor: Colors.card,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: BorderRadius.cardInner,
  },
  warmupItemChecked: {
    borderColor: Colors.greenBorderFaint,
  },
  warmupCheck: {
    width: ComponentSize.warmupCheckSize,
    height: ComponentSize.warmupCheckSize,
    borderRadius: 7,
    borderWidth: 2,
    borderColor: Colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  warmupCheckChecked: {
    backgroundColor: Colors.greenMuted,
    borderColor: Colors.green,
  },
  warmupCheckText: {
    color: Colors.green,
    fontSize: FontSize.body,
  },
  warmupLabel: {
    color: Colors.text,
    fontSize: FontSize.lg,
    fontWeight: '600',
  },
  warmupLabelChecked: {
    color: Colors.textSecondary,
  },
  continueButton: {
    marginTop: Spacing.xxl,
    paddingVertical: Spacing.lg,
    backgroundColor: Colors.indigo,
    borderRadius: BorderRadius.cardInner,
    alignItems: 'center',
  },
  continueButtonText: {
    color: Colors.text,
    fontSize: FontSize.lg,
    fontWeight: '700',
  },
});

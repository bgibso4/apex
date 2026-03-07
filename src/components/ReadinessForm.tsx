import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Colors, Spacing, FontSize, BorderRadius } from '../theme';

export interface ReadinessFormProps {
  sleep: number;
  soreness: number;
  energy: number;
  blockColor: string;
  onSleepChange: (v: number) => void;
  onSorenessChange: (v: number) => void;
  onEnergyChange: (v: number) => void;
  onContinue: () => void;
}

export function ReadinessForm({
  sleep, soreness, energy, blockColor,
  onSleepChange, onSorenessChange, onEnergyChange, onContinue,
}: ReadinessFormProps) {
  const rows = [
    { label: 'Sleep Quality', value: sleep, setter: onSleepChange },
    { label: 'Soreness', value: soreness, setter: onSorenessChange },
    { label: 'Energy Level', value: energy, setter: onEnergyChange },
  ];

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Readiness Check</Text>
      <Text style={styles.subtitle}>How are you feeling today?</Text>

      {rows.map(({ label, value, setter }) => (
        <View key={label} style={styles.readinessRow}>
          <Text style={styles.readinessLabel}>{label}</Text>
          <View style={styles.readinessButtons}>
            {[1, 2, 3, 4, 5].map(n => (
              <TouchableOpacity
                key={n}
                style={[
                  styles.readinessButton,
                  value === n && { backgroundColor: blockColor, borderColor: blockColor },
                ]}
                onPress={() => setter(n)}
              >
                <Text style={[
                  styles.readinessButtonText,
                  value === n && styles.readinessButtonTextSelected,
                ]}>{n}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      ))}

      <TouchableOpacity
        style={[styles.continueButton, { backgroundColor: blockColor }]}
        onPress={onContinue}
        activeOpacity={0.8}
      >
        <Text style={styles.continueButtonText}>Continue</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingVertical: Spacing.xs,
  },
  title: {
    color: Colors.text,
    fontSize: FontSize.subtitle,
    fontWeight: '700',
    marginBottom: Spacing.xs,
  },
  subtitle: {
    color: Colors.textDim,
    fontSize: FontSize.body,
    marginBottom: Spacing.xxl,
  },
  readinessRow: {
    marginBottom: Spacing.xl,
  },
  readinessLabel: {
    color: Colors.textSecondary,
    fontSize: FontSize.md,
    fontWeight: '600',
    marginBottom: Spacing.sm,
  },
  readinessButtons: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  readinessButton: {
    flex: 1,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.button,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.card,
    alignItems: 'center',
  },
  readinessButtonText: {
    color: Colors.textDim,
    fontSize: FontSize.md,
    fontWeight: '600',
  },
  readinessButtonTextSelected: {
    color: Colors.text,
  },
  continueButton: {
    paddingVertical: Spacing.lg,
    borderRadius: BorderRadius.cardInner,
    alignItems: 'center',
    marginTop: Spacing.sm,
  },
  continueButtonText: {
    color: Colors.text,
    fontSize: FontSize.lg,
    fontWeight: '700',
  },
});

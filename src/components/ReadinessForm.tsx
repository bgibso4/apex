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
    <View style={styles.card}>
      <Text style={styles.cardTitle}>Readiness Check</Text>
      {rows.map(({ label, value, setter }) => (
        <View key={label} style={styles.readinessRow}>
          <Text style={styles.readinessLabel}>{label}</Text>
          <View style={styles.readinessButtons}>
            {[1, 2, 3, 4, 5].map(n => (
              <TouchableOpacity
                key={n}
                style={[
                  styles.readinessButton,
                  value === n && { backgroundColor: blockColor },
                ]}
                onPress={() => setter(n)}
              >
                <Text style={[
                  styles.readinessButtonText,
                  value === n && { color: Colors.text },
                ]}>{n}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      ))}
      <TouchableOpacity
        style={[styles.bigButton, { backgroundColor: blockColor }]}
        onPress={onContinue}
      >
        <Text style={styles.bigButtonText}>Continue</Text>
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
  readinessRow: { marginBottom: Spacing.lg },
  readinessLabel: { color: Colors.textSecondary, fontSize: FontSize.md, marginBottom: Spacing.sm },
  readinessButtons: { flexDirection: 'row', gap: Spacing.sm },
  readinessButton: {
    flex: 1, paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.sm, backgroundColor: Colors.surface,
    alignItems: 'center',
  },
  readinessButtonText: { color: Colors.textDim, fontSize: FontSize.md, fontWeight: '600' },
  bigButton: {
    paddingVertical: Spacing.md, borderRadius: BorderRadius.md,
    alignItems: 'center', marginBottom: Spacing.lg,
  },
  bigButtonText: { color: Colors.text, fontSize: FontSize.md, fontWeight: '700' },
});

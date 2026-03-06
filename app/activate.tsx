/**
 * APEX — Program Activation Screen
 * Enter 1RMs for main lifts, then activate the program.
 */

import { useState } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, TextInput,
  StyleSheet, KeyboardAvoidingView, Platform
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Colors, Spacing, FontSize, BorderRadius } from '../src/theme';
import { activateProgram } from '../src/db';

const MAIN_LIFTS_FOR_1RM = [
  { id: 'back_squat', label: 'Back Squat' },
  { id: 'weighted_pullup', label: 'Weighted Pull-up (added weight)' },
  { id: 'bench_press', label: 'Bench Press' },
  { id: 'overhead_press', label: 'Overhead Press' },
  { id: 'zercher_squat', label: 'Zercher Squat' },
  { id: 'romanian_deadlift', label: 'Romanian Deadlift' },
];

export default function ActivateScreen() {
  const router = useRouter();
  const { programId } = useLocalSearchParams<{ programId: string }>();
  const [values, setValues] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);

  const updateValue = (id: string, val: string) => {
    setValues(prev => ({ ...prev, [id]: val }));
  };

  const handleActivate = async () => {
    if (!programId) return;
    setLoading(true);

    // Parse all values to numbers
    const oneRmValues: Record<string, number> = {};
    for (const lift of MAIN_LIFTS_FOR_1RM) {
      const val = parseFloat(values[lift.id] || '0');
      if (val > 0) oneRmValues[lift.id] = val;
    }

    await activateProgram(programId, oneRmValues);
    setLoading(false);
    router.dismissAll();
  };

  const filledCount = MAIN_LIFTS_FOR_1RM.filter(l => {
    const v = parseFloat(values[l.id] || '0');
    return v > 0;
  }).length;

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent}>
        <Text style={styles.title}>Enter Your 1RMs</Text>
        <Text style={styles.subtitle}>
          These are used to calculate your working weights for every session.
          Leave blank if you don't know — the app will learn from your logs.
        </Text>

        {MAIN_LIFTS_FOR_1RM.map(lift => (
          <View key={lift.id} style={styles.inputRow}>
            <Text style={styles.inputLabel}>{lift.label}</Text>
            <View style={styles.inputWrapper}>
              <TextInput
                style={styles.input}
                value={values[lift.id] || ''}
                onChangeText={val => updateValue(lift.id, val)}
                keyboardType="numeric"
                placeholder="lbs"
                placeholderTextColor={Colors.textMuted}
              />
              <Text style={styles.inputUnit}>lbs</Text>
            </View>
          </View>
        ))}

        <TouchableOpacity
          style={[styles.activateButton, loading && { opacity: 0.6 }]}
          onPress={handleActivate}
          disabled={loading}
        >
          <Text style={styles.activateText}>
            {loading ? 'Activating...' : `Activate Program (${filledCount}/${MAIN_LIFTS_FOR_1RM.length} lifts)`}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.skipButton}
          onPress={handleActivate}
        >
          <Text style={styles.skipText}>Skip — I'll enter these later</Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bg },
  scroll: { flex: 1 },
  scrollContent: { paddingTop: 60, paddingHorizontal: Spacing.lg, paddingBottom: 40 },
  title: { color: Colors.text, fontSize: FontSize.xxl, fontWeight: '700' },
  subtitle: {
    color: Colors.textSecondary, fontSize: FontSize.md,
    marginTop: Spacing.sm, marginBottom: Spacing.xxl, lineHeight: 22,
  },

  inputRow: { marginBottom: Spacing.xl },
  inputLabel: { color: Colors.textSecondary, fontSize: FontSize.md, marginBottom: Spacing.sm },
  inputWrapper: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: Colors.card, borderRadius: BorderRadius.md,
    borderWidth: 1, borderColor: Colors.border,
  },
  input: {
    flex: 1, padding: Spacing.lg,
    color: Colors.text, fontSize: FontSize.xl, fontWeight: '600',
  },
  inputUnit: {
    color: Colors.textDim, fontSize: FontSize.md,
    paddingRight: Spacing.lg,
  },

  activateButton: {
    backgroundColor: Colors.indigo, paddingVertical: Spacing.lg,
    borderRadius: BorderRadius.md, alignItems: 'center',
    marginTop: Spacing.xl,
  },
  activateText: { color: Colors.text, fontSize: FontSize.md, fontWeight: '700' },

  skipButton: {
    paddingVertical: Spacing.lg, alignItems: 'center',
  },
  skipText: { color: Colors.textDim, fontSize: FontSize.md },
});

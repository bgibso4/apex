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
  { id: 'weighted_pullup', label: 'Weighted Pull-up' },
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

    await activateProgram(programId);
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
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Text style={styles.backArrow}>{'\u2190'}</Text>
            <Text style={styles.backText}>Back</Text>
          </TouchableOpacity>
        </View>

        <Text style={styles.title}>Enter Your 1RMs</Text>
        <Text style={styles.description}>
          These are used to calculate your working weights for every session.
          Leave blank if you don&apos;t know {'\u2014'} the app will learn from your logs.
        </Text>

        {/* 1RM input rows */}
        <View style={styles.inputList}>
          {MAIN_LIFTS_FOR_1RM.map(lift => (
            <View key={lift.id} style={styles.inputRow}>
              <Text style={styles.inputLabel}>{lift.label}</Text>
              <View style={styles.inputRight}>
                <TextInput
                  style={styles.input}
                  value={values[lift.id] || ''}
                  onChangeText={val => updateValue(lift.id, val)}
                  keyboardType="numeric"
                  placeholder="\u2014"
                  placeholderTextColor={Colors.textMuted}
                />
                <Text style={styles.inputUnit}>lbs</Text>
              </View>
            </View>
          ))}
        </View>

        <TouchableOpacity
          style={[styles.activateButton, loading && { opacity: 0.6 }]}
          onPress={handleActivate}
          disabled={loading}
          activeOpacity={0.8}
        >
          <Text style={styles.activateText}>
            {loading ? 'Activating...' : `Activate Program (${filledCount}/${MAIN_LIFTS_FOR_1RM.length} lifts)`}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.skipButton}
          onPress={handleActivate}
        >
          <Text style={styles.skipText}>Skip {'\u2014'} I&apos;ll enter these later</Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bg },
  scroll: { flex: 1 },
  scrollContent: {
    paddingTop: Spacing.screenTop,
    paddingHorizontal: Spacing.screenHorizontal,
    paddingBottom: Spacing.screenBottom,
  },

  // Header with back button
  header: {
    marginBottom: Spacing.xl,
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  backArrow: {
    color: Colors.textDim,
    fontSize: FontSize.xl,
  },
  backText: {
    color: Colors.textDim,
    fontSize: FontSize.base,
    fontWeight: '600',
  },

  // Content
  title: {
    color: Colors.text,
    fontSize: FontSize.xxl,
    fontWeight: '800',
  },
  description: {
    color: Colors.textDim,
    fontSize: FontSize.md,
    lineHeight: FontSize.md * 1.5,
    marginTop: Spacing.sm,
    marginBottom: Spacing.xxl,
  },

  // Input rows
  inputList: {
    gap: Spacing.md - 2, // 10px
  },
  inputRow: {
    backgroundColor: Colors.card,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: BorderRadius.cardInner,
    paddingVertical: Spacing.md + 2, // 14px
    paddingHorizontal: Spacing.lg,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  inputLabel: {
    color: Colors.text,
    fontSize: FontSize.base,
    fontWeight: '600',
  },
  inputRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm - 2, // 6px
  },
  input: {
    width: 80,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: BorderRadius.button,
    paddingVertical: Spacing.md - 2, // 10px
    paddingHorizontal: Spacing.md,
    color: Colors.text,
    fontSize: FontSize.lg,
    fontWeight: '700',
    textAlign: 'center',
  },
  inputUnit: {
    color: Colors.textMuted,
    fontSize: FontSize.body,
    fontWeight: '600',
  },

  // Buttons
  activateButton: {
    paddingVertical: Spacing.lg,
    backgroundColor: Colors.indigo,
    borderRadius: BorderRadius.cardInner,
    alignItems: 'center',
    marginTop: Spacing.xl,
  },
  activateText: {
    color: Colors.text,
    fontSize: FontSize.lg,
    fontWeight: '700',
  },
  skipButton: {
    paddingVertical: Spacing.lg,
    alignItems: 'center',
  },
  skipText: {
    color: Colors.textDim,
    fontSize: FontSize.md,
  },
});

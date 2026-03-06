/**
 * APEX — Workout Screen
 * Thin render layer — all state logic lives in useWorkoutSession.
 */

import { View, Text, ScrollView, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Spacing, FontSize, BorderRadius } from '../../src/theme';
import { useWorkoutSession } from '../../src/hooks/useWorkoutSession';
import { getTargetForWeek } from '../../src/utils/program';
import { DaySelector } from '../../src/components/DaySelector';
import { ReadinessForm } from '../../src/components/ReadinessForm';
import { WarmupChecklist } from '../../src/components/WarmupChecklist';
import { ExerciseCard } from '../../src/components/ExerciseCard';
import { AdjustModal } from '../../src/components/AdjustModal';
import { SessionSummary } from '../../src/components/SessionSummary';

export default function WorkoutScreen() {
  const w = useWorkoutSession();

  if (!w.program) {
    return (
      <View style={styles.container}>
        <View style={styles.emptyState}>
          <Text style={styles.emptyText}>No active program</Text>
        </View>
      </View>
    );
  }

  const exerciseCount = w.exercises.filter(e =>
    e.sets.some(s => s.status !== 'pending')
  ).length;
  const setCount = w.exercises.reduce((acc, e) =>
    acc + e.sets.filter(s => s.status === 'completed' || s.status === 'completed_below').length, 0
  );

  return (
    <View style={styles.container}>
      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent}>
        <DaySelector
          currentWeek={w.currentWeek}
          blockName={w.block?.name}
          blockColor={w.blockColor}
          selectedDay={w.selectedDay}
          trainingDays={w.trainingDays}
          dayNames={w.dayNames}
          onSelectDay={w.selectDay}
        />

        {/* Phase: Select */}
        {w.phase === 'select' && w.selectedTemplate && (
          <View style={styles.card}>
            <Text style={styles.sessionTitle}>{w.selectedTemplate.name}</Text>
            <Text style={styles.exercisePreview}>
              {w.selectedTemplate.exercises.length} exercises
              {w.selectedTemplate.conditioning_finisher ? ' + conditioning finisher' : ''}
            </Text>
            <TouchableOpacity
              style={[styles.bigButton, { backgroundColor: w.blockColor }]}
              onPress={w.startSession}
            >
              <Text style={styles.bigButtonText}>Start Session</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Phase: Readiness */}
        {w.phase === 'readiness' && (
          <ReadinessForm
            sleep={w.sleep}
            soreness={w.soreness}
            energy={w.energy}
            blockColor={w.blockColor}
            onSleepChange={w.setSleep}
            onSorenessChange={w.setSoreness}
            onEnergyChange={w.setEnergy}
            onContinue={w.submitReadiness}
          />
        )}

        {/* Phase: Warmup */}
        {w.phase === 'warmup' && (
          <WarmupChecklist
            warmupRope={w.warmupRope}
            warmupAnkle={w.warmupAnkle}
            warmupHipIr={w.warmupHipIr}
            blockColor={w.blockColor}
            onToggleRope={w.toggleWarmupRope}
            onToggleAnkle={w.toggleWarmupAnkle}
            onToggleHipIr={w.toggleWarmupHipIr}
            onContinue={w.submitWarmup}
          />
        )}

        {/* Phase: Logging */}
        {w.phase === 'logging' && w.exercises.map((ex, exIdx) => (
          <ExerciseCard
            key={ex.slot.exercise_id}
            exerciseName={ex.exerciseName}
            category={ex.slot.category}
            target={getTargetForWeek(ex.slot, w.currentWeek)}
            sets={ex.sets}
            rpe={ex.rpe}
            expanded={ex.expanded}
            lastWeight={ex.lastWeight}
            lastReps={ex.lastReps}
            blockColor={w.blockColor}
            onToggleExpand={() => w.toggleExpand(exIdx)}
            onCompleteSet={(setIdx) => w.completeSetAction(exIdx, setIdx)}
            onLongPressSet={(setIdx) => w.openOverride(exIdx, setIdx)}
            onSetRPE={(rpe) => w.setRPE(exIdx, rpe)}
          />
        ))}

        {/* Conditioning Finisher + Complete */}
        {w.phase === 'logging' && (
          <>
            <TouchableOpacity
              style={styles.conditioningRow}
              onPress={() => w.setConditioningDone(!w.conditioningDone)}
            >
              <Ionicons
                name={w.conditioningDone ? 'checkmark-circle' : 'ellipse-outline'}
                size={24}
                color={w.conditioningDone ? Colors.green : Colors.textDim}
              />
              <Text style={[
                styles.conditioningLabel,
                w.conditioningDone && { color: Colors.green },
              ]}>Conditioning Finisher</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.bigButton, { backgroundColor: w.blockColor }]}
              onPress={w.finishSession}
            >
              <Text style={styles.bigButtonText}>Complete Session</Text>
            </TouchableOpacity>
          </>
        )}

        {/* Phase: Complete */}
        {w.phase === 'complete' && (
          <SessionSummary exerciseCount={exerciseCount} setCount={setCount} />
        )}
      </ScrollView>

      <AdjustModal
        visible={w.overrideModal !== null}
        weight={w.overrideWeight}
        reps={w.overrideReps}
        blockColor={w.blockColor}
        onWeightChange={w.setOverrideWeight}
        onRepsChange={w.setOverrideReps}
        onSave={w.saveOverride}
        onClose={w.closeOverride}
      />
    </View>
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
  emptyState: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  emptyText: { color: Colors.textSecondary, fontSize: FontSize.lg },

  card: {
    backgroundColor: Colors.card, borderRadius: BorderRadius.lg,
    padding: Spacing.lg, marginBottom: Spacing.lg,
  },
  sessionTitle: { color: Colors.text, fontSize: FontSize.xl, fontWeight: '700' },
  exercisePreview: {
    color: Colors.textSecondary, fontSize: FontSize.md,
    marginTop: Spacing.xs, marginBottom: Spacing.xl,
  },
  bigButton: {
    paddingVertical: Spacing.md, borderRadius: BorderRadius.md,
    alignItems: 'center', marginBottom: Spacing.lg,
  },
  bigButtonText: { color: Colors.text, fontSize: FontSize.md, fontWeight: '700' },

  conditioningRow: {
    flexDirection: 'row', alignItems: 'center', gap: Spacing.md,
    paddingVertical: Spacing.lg,
  },
  conditioningLabel: { color: Colors.textSecondary, fontSize: FontSize.lg },
});

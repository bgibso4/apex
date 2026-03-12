/**
 * APEX — Workout Screen
 * Thin render layer — all state logic lives in useWorkoutSession.
 */

import { useState, useEffect, useCallback } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, TextInput,
  Modal, Pressable, Alert, StyleSheet,
} from 'react-native';
import Animated, {
  FadeIn, FadeOut, SlideInDown,
  useSharedValue, useAnimatedStyle, withTiming,
} from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useFocusEffect } from 'expo-router';
import { Colors, Spacing, FontSize, BorderRadius, ComponentSize } from '../../src/theme';
import { useWorkoutSession } from '../../src/hooks/useWorkoutSession';
import { getTargetForWeek } from '../../src/utils/program';
import { getRecentCompletedSessions, getSetLogsForSession } from '../../src/db';
import { EXERCISE_LIBRARY, MUSCLE_GROUPS } from '../../src/data/exercise-library';
import { DaySelector } from '../../src/components/DaySelector';
import { WarmupChecklist } from '../../src/components/WarmupChecklist';
import { ExerciseCard } from '../../src/components/ExerciseCard';
import { AdjustModal } from '../../src/components/AdjustModal';
import { SessionSummary } from '../../src/components/SessionSummary';
import type { Session } from '../../src/types';

export default function WorkoutScreen() {
  const w = useWorkoutSession();
  const router = useRouter();

  // Recent completed sessions for the idle state
  const [recentSessions, setRecentSessions] = useState<(Session & { setCount?: number; durationMin?: number })[]>([]);

  useFocusEffect(useCallback(() => {
    getRecentCompletedSessions(5).then(async (sessions) => {
      const enriched = await Promise.all(sessions.map(async (s) => {
        const sets = await getSetLogsForSession(s.id);
        const completedSets = sets.filter(sl => sl.status === 'completed' || sl.status === 'completed_below');
        const startedAt = s.started_at ? new Date(s.started_at).getTime() : 0;
        const completedAt = s.completed_at ? new Date(s.completed_at).getTime() : 0;
        const durationMin = startedAt && completedAt ? Math.round((completedAt - startedAt) / 60000) : undefined;
        return { ...s, setCount: completedSets.length, durationMin };
      }));
      setRecentSessions(enriched);
    }).catch(() => {});
  }, []));

  // Hooks must be called unconditionally (before any early returns)
  const exerciseCount = w.exercises.filter(e =>
    e.sets.some(s => s.status !== 'pending')
  ).length;
  const setCount = w.exercises.reduce((acc, e) =>
    acc + e.sets.filter(s => s.status === 'completed' || s.status === 'completed_below').length, 0
  );
  const totalSets = w.exercises.reduce((acc, e) => acc + e.sets.length, 0);

  // Animated progress bar
  const progressWidth = useSharedValue(0);
  const progressPercent = totalSets > 0 ? (setCount / totalSets) * 100 : 0;
  useEffect(() => {
    progressWidth.value = withTiming(progressPercent, { duration: 300 });
  }, [progressPercent]);
  const progressAnimatedStyle = useAnimatedStyle(() => ({
    width: `${progressWidth.value}%`,
  }));

  if (!w.program) {
    return (
      <View style={styles.container}>
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.scrollContent}
        >
          <View style={styles.emptyState}>
            <Ionicons name="barbell-outline" size={48} color={Colors.textMuted} />
            <Text style={styles.emptyText}>No active program</Text>
          </View>

          <View style={styles.recentSection}>
            <Text style={styles.recentTitle}>Recent Workouts</Text>
            {recentSessions.length === 0 && (
              <Text style={styles.noRecentText}>No recent workouts</Text>
            )}
            {recentSessions.map((s) => {
              const dateLabel = new Date(s.date + 'T12:00:00').toLocaleDateString('en-US', {
                weekday: 'short', month: 'short', day: 'numeric',
              });
              return (
                <TouchableOpacity
                  key={s.id}
                  style={styles.recentCard}
                  onPress={() => router.push(`/session/${s.id}`)}
                  activeOpacity={0.7}
                >
                  <View style={styles.recentCardLeft}>
                    <Text style={styles.recentCardName}>{s.day_template_id.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())}</Text>
                    <Text style={styles.recentCardDate}>
                      {dateLabel}
                      {s.block_name ? ` · ${s.block_name}` : ''}
                    </Text>
                  </View>
                  <View style={styles.recentCardRight}>
                    {s.durationMin != null && (
                      <Text style={styles.recentCardStat}>{s.durationMin}m</Text>
                    )}
                    {s.setCount != null && (
                      <Text style={styles.recentCardStat}>{s.setCount} sets</Text>
                    )}
                  </View>
                </TouchableOpacity>
              );
            })}
            <TouchableOpacity
              style={styles.viewAllButton}
              onPress={() => router.push('/history')}
            >
              <Text style={styles.viewAllText}>
                View all workouts {'\u2192'}
              </Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </View>
    );
  }

  const programmedExercises = w.exercises.filter(e => !e.isAdhoc);
  const allProgrammedDone = programmedExercises.every(e =>
    e.sets.every(s => s.status !== 'pending')
  );
  const doneExerciseCount = w.exercises.filter(e =>
    e.sets.every(s => s.status !== 'pending')
  ).length;

  const hasSetsLogged = setCount > 0;

  /** Show overflow menu for warmup/logging phases */
  const showWorkoutMenu = () => {
    const buttons: Array<{ text: string; style?: 'cancel' | 'destructive'; onPress?: () => void }> = [];

    if (hasSetsLogged) {
      buttons.push({
        text: 'End Early',
        onPress: w.endEarlyAction,
      });
    }

    buttons.push({
      text: 'Delete Workout',
      style: 'destructive',
      onPress: () => {
        Alert.alert(
          'Delete Workout',
          'All logged sets will be lost. This cannot be undone.',
          [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Delete', style: 'destructive', onPress: w.deleteSessionAction },
          ],
        );
      },
    });

    buttons.push({ text: 'Cancel', style: 'cancel' });

    Alert.alert('Workout Options', undefined, buttons);
  };

  return (
    <View style={styles.container}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[
          styles.scrollContent,
          // Make scroll content fill screen for centering rest day
          w.phase === 'select' && !w.selectedTemplate && styles.scrollContentFill,
        ]}
      >
        {/* Day Selector (select phase only) */}
        {w.phase === 'select' && (
          <DaySelector
            currentWeek={w.currentWeek}
            blockName={w.block?.name}
            blockColor={w.blockColor}
            selectedDay={w.selectedDay}
            trainingDays={w.trainingDays}
            dayNames={w.dayNames}
            onSelectDay={w.selectDay}
          />
        )}

        {/* Rest Day */}
        {w.phase === 'select' && !w.selectedTemplate && (
          <Animated.View entering={FadeIn.duration(200)} style={styles.restDay}>
            <Ionicons name="moon-outline" size={48} color={Colors.textMuted} style={{ marginBottom: Spacing.lg }} />
            <Text style={styles.restDayText}>Rest Day</Text>
            <Text style={styles.restDaySubtext}>No workout scheduled for today</Text>
          </Animated.View>
        )}

        {/* Phase: Select — Session preview */}
        {w.phase === 'select' && w.selectedTemplate && (
          <View style={styles.sessionPreview}>
            <Text style={styles.previewTitle}>{w.selectedTemplate.name}</Text>
            <Text style={styles.previewSubtitle}>
              {w.selectedTemplate.exercises.length} exercises
              {w.selectedTemplate.conditioning_finisher ? ' + conditioning finisher' : ''}
            </Text>

            <View style={styles.previewExercises}>
              {w.selectedTemplate.exercises.map((ex, i) => {
                const target = getTargetForWeek(ex, w.currentWeek);
                return (
                  <View key={i} style={styles.previewExerciseRow}>
                    <Text style={styles.previewExerciseName}>{ex.exercise_id.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())}</Text>
                    <Text style={styles.previewExerciseDetail}>
                      {target ? `${target.sets}${target.reps != null ? ` \u00D7 ${target.reps}` : ''}` : ''}
                    </Text>
                  </View>
                );
              })}
            </View>

            <TouchableOpacity
              style={styles.startButton}
              onPress={w.startSession}
              activeOpacity={0.8}
            >
              <Text style={styles.startButtonText}>Start Session {'\u2192'}</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Recent workouts (select phase) */}
        {w.phase === 'select' && (
          <View style={styles.recentSection}>
            <Text style={styles.recentTitle}>Recent Workouts</Text>
            {recentSessions.length === 0 && (
              <Text style={styles.noRecentText}>No recent workouts</Text>
            )}
            {recentSessions.map((s) => {
              const dateLabel = new Date(s.date + 'T12:00:00').toLocaleDateString('en-US', {
                weekday: 'short', month: 'short', day: 'numeric',
              });
              return (
                <TouchableOpacity
                  key={s.id}
                  style={styles.recentCard}
                  onPress={() => router.push(`/session/${s.id}`)}
                  activeOpacity={0.7}
                >
                  <View style={styles.recentCardLeft}>
                    <Text style={styles.recentCardName}>{s.day_template_id.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())}</Text>
                    <Text style={styles.recentCardDate}>
                      {dateLabel}
                      {s.block_name ? ` · ${s.block_name}` : ''}
                    </Text>
                  </View>
                  <View style={styles.recentCardRight}>
                    {s.durationMin != null && (
                      <Text style={styles.recentCardStat}>{s.durationMin}m</Text>
                    )}
                    {s.setCount != null && (
                      <Text style={styles.recentCardStat}>{s.setCount} sets</Text>
                    )}
                  </View>
                </TouchableOpacity>
              );
            })}
            <TouchableOpacity
              style={styles.viewAllButton}
              onPress={() => router.push('/history')}
            >
              <Text style={styles.viewAllText}>
                View all workouts {'\u2192'}
              </Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Phase: Warmup */}
        {w.phase === 'warmup' && (
          <>
            <WarmupChecklist
              protocols={w.protocols}
              onToggle={w.toggleProtocol}
              onContinue={w.submitWarmup}
              timer={w.timer}
              sessionName={w.selectedTemplate?.name}
              onMenu={showWorkoutMenu}
            />
          </>
        )}

        {/* Phase: Logging */}
        {w.phase === 'logging' && (
          <>
            {/* Header with timer */}
            <View style={styles.loggingHeader}>
              <View style={styles.loggingHeaderLeft}>
                <Text style={styles.loggingTitle}>{w.selectedTemplate?.name ?? 'Workout'}</Text>
                <View style={styles.loggingSubtitleRow}>
                  <Text style={styles.loggingSubtitle}>
                    Week {w.currentWeek} — {w.block?.name ?? ''}
                  </Text>
                  <Text style={styles.timerDisplay}>{w.timer}</Text>
                </View>
              </View>
              <TouchableOpacity
                onPress={showWorkoutMenu}
                hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
                style={styles.overflowButton}
              >
                <Ionicons name="ellipsis-horizontal" size={22} color={Colors.textSecondary} />
              </TouchableOpacity>
            </View>

            {/* Progress bar */}
            <View style={styles.progressBarContainer}>
              <View style={styles.progressBarBg}>
                <Animated.View style={[styles.progressBarFill, progressAnimatedStyle]} />
              </View>
              <View style={styles.progressLabel}>
                <Text style={styles.progressLabelText}>
                  {doneExerciseCount} of {w.exercises.length} exercises
                </Text>
                <Text style={styles.progressLabelText}>
                  {setCount} / {totalSets} sets
                </Text>
              </View>
              {!w.reorderMode && (
                <View style={styles.progressActions}>
                  <TouchableOpacity onPress={() => w.setPhase('warmup')}>
                    <Text style={styles.editWarmupText}>Edit Warmup</Text>
                  </TouchableOpacity>
                  <TouchableOpacity onPress={() => w.setShowExercisePicker(true)}>
                    <Text style={styles.addExerciseLink}>+ Add Exercise</Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>

            {/* Reorder banner */}
            {w.reorderMode && (
              <View style={styles.reorderBanner}>
                <Text style={styles.reorderBannerText}>Reorder exercises</Text>
                <TouchableOpacity onPress={() => w.setReorderMode(false)}>
                  <Text style={styles.reorderDoneText}>Done</Text>
                </TouchableOpacity>
              </View>
            )}

            {/* Exercise cards */}
            {w.exercises.map((ex, exIdx) => (
              <View key={`${ex.slot.exercise_id}-${exIdx}`}>
                <ExerciseCard
                  exerciseName={ex.exerciseName}
                  category={ex.isAdhoc ? 'ad-hoc' : ex.slot.category}
                  target={ex.isAdhoc ? undefined : getTargetForWeek(ex.slot, w.currentWeek)}
                  sets={ex.sets}
                  rpe={ex.rpe}
                  expanded={ex.expanded}
                  lastWeight={ex.lastWeight}
                  lastReps={ex.lastReps}
                  blockColor={w.blockColor}
                  inputFields={ex.inputFields}
                  note={w.exerciseNotes[ex.slot.exercise_id]}
                  onNoteChange={(note) => w.saveExerciseNoteAction(ex.slot.exercise_id, note)}
                  onToggleExpand={() => {
                    if (w.reorderMode) return;
                    w.toggleExpand(exIdx);
                  }}
                  onCompleteSet={(setIdx) => w.completeSetAction(exIdx, setIdx)}
                  onLongPressSet={(setIdx) => {
                    if (w.reorderMode) return;
                    w.openOverride(exIdx, setIdx);
                  }}
                  onSetRPE={(rpe) => w.setRPE(exIdx, rpe)}
                  onLongPressCard={() => {
                    if (!w.reorderMode) w.enterReorderMode();
                  }}
                />

                {/* Reorder controls */}
                {w.reorderMode && (
                  <View style={styles.reorderControls}>
                    <TouchableOpacity
                      style={[styles.reorderButton, exIdx === 0 && styles.reorderButtonDisabled]}
                      onPress={() => w.moveExercise(exIdx, -1)}
                      disabled={exIdx === 0}
                    >
                      <Ionicons name="arrow-up" size={20}
                        color={exIdx === 0 ? Colors.textMuted : Colors.text} />
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[styles.reorderButton, exIdx === w.exercises.length - 1 && styles.reorderButtonDisabled]}
                      onPress={() => w.moveExercise(exIdx, 1)}
                      disabled={exIdx === w.exercises.length - 1}
                    >
                      <Ionicons name="arrow-down" size={20}
                        color={exIdx === w.exercises.length - 1 ? Colors.textMuted : Colors.text} />
                    </TouchableOpacity>
                  </View>
                )}
              </View>
            ))}

            {/* Conditioning + Add Exercise (hidden in reorder mode) */}
            {!w.reorderMode && (
              <>
                {w.conditioningFinisher && (
                  <TouchableOpacity
                    style={styles.conditioningCard}
                    onPress={() => {
                      const cp = w.protocols.find(p => p.type === 'conditioning');
                      if (cp) w.toggleProtocol(cp.id);
                    }}
                    activeOpacity={0.7}
                  >
                    <View style={styles.conditioningLeft}>
                      <Text style={styles.conditioningLabel}>Conditioning Finisher</Text>
                      <Text style={styles.conditioningName}>{w.conditioningFinisher}</Text>
                    </View>
                    <View style={[
                      styles.conditioningCheckbox,
                      w.conditioningDone && styles.conditioningCheckboxChecked,
                    ]}>
                      {w.conditioningDone && (
                        <Text style={styles.conditioningCheckmark}>{'\u2713'}</Text>
                      )}
                    </View>
                  </TouchableOpacity>
                )}

              </>
            )}

            {/* Bottom padding when finish button is pinned */}
            {setCount / totalSets >= 0.5 && <View style={{ height: 80 }} />}
          </>
        )}

        {/* Phase: Complete */}
        {w.phase === 'complete' && (
          <SessionSummary
            exerciseCount={exerciseCount}
            setCount={setCount}
            totalSets={totalSets}
            duration={w.timer}
            sessionName={w.selectedTemplate?.name}
            weekLabel={`Week ${w.currentWeek}`}
            prs={w.prs}
            onDelete={() => {
              Alert.alert(
                'Delete Workout',
                'All logged sets will be lost. This cannot be undone.',
                [
                  { text: 'Cancel', style: 'cancel' },
                  { text: 'Delete', style: 'destructive', onPress: w.deleteSessionAction },
                ]
              );
            }}
            exercises={w.exercises.map(ex => ({
              exerciseName: ex.exerciseName,
              sets: ex.sets.map(s => ({
                setNumber: s.setNumber,
                actualWeight: s.actualWeight ?? 0,
                actualReps: s.actualReps ?? 0,
                status: s.status,
              })),
              rpe: ex.rpe,
              note: w.exerciseNotes[ex.slot.exercise_id],
            }))}
            protocols={w.protocols}
            notes={w.sessionNotes}
            notesSaved={w.notesSaved}
            onNotesChange={w.saveNotes}
            sessionId={w.sessionId ?? undefined}
            onViewSession={(id) => router.push(`/session/${id}`)}
            onViewAllWorkouts={() => router.push('/history')}
            recentSessions={recentSessions.map(s => ({
              id: String(s.id),
              name: s.day_template_id.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase()),
              dateLabel: new Date(s.date + 'T12:00:00').toLocaleDateString('en-US', {
                month: 'short', day: 'numeric',
              }),
              blockName: s.block_name || undefined,
              durationMin: s.durationMin,
              setCount: s.setCount,
            }))}
          />
        )}
      </ScrollView>

      {/* Pinned finish button (outside scroll) */}
      {w.phase === 'logging' && !w.reorderMode && totalSets > 0 && setCount / totalSets >= 0.5 && (
        <Animated.View
          entering={SlideInDown.duration(300)}
          style={styles.pinnedFinishContainer}
        >
          <TouchableOpacity
            style={styles.finishButton}
            onPress={() => {
              const pendingSets = totalSets - setCount;
              if (pendingSets > 0) {
                Alert.alert(
                  'Finish Early?',
                  `You have ${pendingSets} set${pendingSets > 1 ? 's' : ''} remaining. Finish anyway?`,
                  [
                    { text: 'Keep Going', style: 'cancel' },
                    { text: 'Finish', onPress: w.finishSession },
                  ]
                );
              } else {
                w.finishSession();
              }
            }}
            activeOpacity={0.8}
          >
            <Text style={styles.finishButtonText}>Finish Workout</Text>
          </TouchableOpacity>
        </Animated.View>
      )}

      <AdjustModal
        visible={w.overrideModal !== null}
        values={w.overrideValues}
        inputFields={w.overrideModal !== null ? w.exercises[w.overrideModal.exerciseIdx]?.inputFields : undefined}
        blockColor={w.blockColor}
        onValueChange={(fieldType, value) => w.setOverrideValues(prev => ({ ...prev, [fieldType]: value }))}
        onSave={w.saveOverride}
        onClose={w.closeOverride}
        onApplyToAll={w.saveOverrideToAll}
      />

      {/* Exercise Picker Modal */}
      <Modal visible={w.showExercisePicker} transparent animationType="slide">
        <Pressable
          style={styles.pickerOverlay}
          onPress={() => {
            w.setShowExercisePicker(false);
            w.setPickerStep('pick');
            w.setPickerSearch('');
          }}
        >
          <View style={styles.pickerSheet} onStartShouldSetResponder={() => true}>
            {w.pickerStep === 'pick' ? (
              <>
                <View style={styles.pickerHeader}>
                  <Text style={styles.pickerTitle}>Add Exercise</Text>
                  <TouchableOpacity onPress={() => {
                    w.setShowExercisePicker(false);
                    w.setPickerStep('pick');
                    w.setPickerSearch('');
                  }}>
                    <Ionicons name="close" size={24} color={Colors.textDim} />
                  </TouchableOpacity>
                </View>

                <TextInput
                  style={styles.pickerSearch}
                  placeholder="Search exercises..."
                  placeholderTextColor={Colors.textDim}
                  value={w.pickerSearch}
                  onChangeText={w.setPickerSearch}
                  autoCapitalize="none"
                />

                <ScrollView style={styles.pickerList}>
                  {/* Custom exercise option */}
                  <TouchableOpacity
                    style={styles.pickerItem}
                    onPress={() => {
                      const customName = w.pickerSearch.trim() || 'Custom Exercise';
                      const customId = customName.toLowerCase().replace(/\s+/g, '_');
                      w.setSelectedLibraryExercise({
                        id: customId,
                        name: customName,
                        muscleGroup: 'Other',
                        type: 'accessory',
                      });
                      w.setPickerStep('configure');
                    }}
                  >
                    <Ionicons name="add-circle-outline" size={20} color={Colors.indigo} />
                    <Text style={[styles.pickerItemText, { color: Colors.indigo }]}>
                      + Custom Exercise{w.pickerSearch ? `: "${w.pickerSearch}"` : ''}
                    </Text>
                  </TouchableOpacity>

                  {/* Exercises by muscle group */}
                  {MUSCLE_GROUPS.map(group => {
                    const filtered = EXERCISE_LIBRARY.filter(e =>
                      e.muscleGroup === group &&
                      (w.pickerSearch === '' || e.name.toLowerCase().includes(w.pickerSearch.toLowerCase()))
                    );
                    if (filtered.length === 0) return null;
                    return (
                      <View key={group}>
                        <Text style={styles.pickerGroupLabel}>{group.toUpperCase()}</Text>
                        {filtered.map(ex => (
                          <TouchableOpacity
                            key={ex.id}
                            style={styles.pickerItem}
                            onPress={() => {
                              w.setSelectedLibraryExercise(ex);
                              w.setPickerStep('configure');
                            }}
                          >
                            <Text style={styles.pickerItemText}>{ex.name}</Text>
                          </TouchableOpacity>
                        ))}
                      </View>
                    );
                  })}
                </ScrollView>
              </>
            ) : (
              <>
                {/* Configure step */}
                <View style={styles.pickerHeader}>
                  <TouchableOpacity onPress={() => w.setPickerStep('pick')}>
                    <Text style={styles.backArrow}>{'\u2190'}</Text>
                  </TouchableOpacity>
                  <Text style={[styles.pickerTitle, { flex: 1, marginLeft: Spacing.md }]}>
                    {w.selectedLibraryExercise?.name}
                  </Text>
                </View>

                <View style={styles.configSection}>
                  <Text style={styles.configLabel}>Sets</Text>
                  <View style={styles.adjustRow}>
                    <TouchableOpacity style={styles.adjustButton}
                      onPress={() => w.setAdhocSets(Math.max(1, w.adhocSets - 1))}>
                      <Text style={styles.adjustButtonText}>{'\u2212'}</Text>
                    </TouchableOpacity>
                    <Text style={styles.adjustValue}>{w.adhocSets}</Text>
                    <TouchableOpacity style={styles.adjustButton}
                      onPress={() => w.setAdhocSets(w.adhocSets + 1)}>
                      <Text style={styles.adjustButtonText}>+</Text>
                    </TouchableOpacity>
                  </View>

                  <Text style={styles.configLabel}>Reps</Text>
                  <View style={styles.adjustRow}>
                    <TouchableOpacity style={styles.adjustButton}
                      onPress={() => w.setAdhocReps(Math.max(1, w.adhocReps - 1))}>
                      <Text style={styles.adjustButtonText}>{'\u2212'}</Text>
                    </TouchableOpacity>
                    <Text style={styles.adjustValue}>{w.adhocReps}</Text>
                    <TouchableOpacity style={styles.adjustButton}
                      onPress={() => w.setAdhocReps(w.adhocReps + 1)}>
                      <Text style={styles.adjustButtonText}>+</Text>
                    </TouchableOpacity>
                  </View>

                  <Text style={styles.configLabel}>Weight (lbs) {'\u2014'} 0 = bodyweight</Text>
                  <View style={styles.adjustRow}>
                    <TouchableOpacity style={styles.adjustButton}
                      onPress={() => w.setAdhocWeight(Math.max(0, w.adhocWeight - 5))}>
                      <Text style={styles.adjustButtonText}>-5</Text>
                    </TouchableOpacity>
                    <Text style={styles.adjustValue}>
                      {w.adhocWeight === 0 ? 'BW' : w.adhocWeight}
                    </Text>
                    <TouchableOpacity style={styles.adjustButton}
                      onPress={() => w.setAdhocWeight(w.adhocWeight + 5)}>
                      <Text style={styles.adjustButtonText}>+5</Text>
                    </TouchableOpacity>
                  </View>
                </View>

                <TouchableOpacity
                  style={[styles.addToWorkoutButton]}
                  onPress={w.addAdhocExercise}
                  activeOpacity={0.8}
                >
                  <Text style={styles.addToWorkoutText}>Add to Workout</Text>
                </TouchableOpacity>
              </>
            )}
          </View>
        </Pressable>
      </Modal>
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
  scrollContentFill: {
    flexGrow: 1,
  },
  emptyState: { alignItems: 'center', paddingVertical: Spacing.xxxl, gap: Spacing.md },
  emptyText: { color: Colors.textSecondary, fontSize: FontSize.lg },

  // Rest day
  restDay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingBottom: 80,
  },
  restDayText: {
    color: Colors.text,
    fontSize: FontSize.sectionTitle,
    fontWeight: '700',
    marginBottom: Spacing.sm,
  },
  restDaySubtext: {
    color: Colors.textMuted,
    fontSize: FontSize.md,
  },

  // Session preview (select phase)
  sessionPreview: {
    flex: 1,
    paddingVertical: Spacing.xs,
  },
  previewTitle: {
    color: Colors.text,
    fontSize: FontSize.xxxl,
    fontWeight: '800',
    marginBottom: Spacing.xs,
  },
  previewSubtitle: {
    color: Colors.textSecondary,
    fontSize: FontSize.md,
    marginBottom: Spacing.xxl,
  },
  previewExercises: {
    gap: 2,
    flex: 1,
  },
  previewExerciseRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: Spacing.md + 2, // 14px
    paddingHorizontal: Spacing.lg,
    backgroundColor: Colors.card,
    borderRadius: BorderRadius.md,
  },
  previewExerciseName: {
    color: Colors.text,
    fontSize: FontSize.base,
    fontWeight: '600',
  },
  previewExerciseDetail: {
    color: Colors.textMuted,
    fontSize: FontSize.body,
  },
  startButton: {
    marginTop: Spacing.xxl,
    paddingVertical: Spacing.lg,
    backgroundColor: Colors.indigo,
    borderRadius: BorderRadius.cardInner,
    alignItems: 'center',
  },
  startButtonText: {
    color: Colors.text,
    fontSize: FontSize.lg,
    fontWeight: '700',
  },

  // Recent workouts
  recentSection: {
    marginTop: Spacing.xl,
  },
  recentTitle: {
    color: Colors.textMuted,
    fontSize: FontSize.sectionLabel,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: Spacing.md,
  },
  noRecentText: {
    color: Colors.textDim,
    fontSize: FontSize.body,
    textAlign: 'center',
    paddingVertical: Spacing.lg,
  },
  recentCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: Colors.card,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: BorderRadius.md,
    paddingVertical: Spacing.lg,
    paddingHorizontal: Spacing.xl,
    marginBottom: Spacing.sm,
  },
  recentCardLeft: {
    flex: 1,
    gap: 2,
  },
  recentCardName: {
    color: Colors.text,
    fontSize: FontSize.base,
    fontWeight: '600',
  },
  recentCardDate: {
    color: Colors.textMuted,
    fontSize: FontSize.sm,
  },
  recentCardRight: {
    flexDirection: 'row',
    gap: Spacing.md,
    alignItems: 'center',
  },
  recentCardStat: {
    color: Colors.textDim,
    fontSize: FontSize.body,
    fontWeight: '500',
  },
  viewAllButton: {
    paddingVertical: Spacing.md,
    alignItems: 'center',
  },
  viewAllText: {
    color: Colors.indigo,
    fontSize: FontSize.body,
    fontWeight: '600',
  },

  // Warmup header
  warmupHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.lg,
  },
  warmupHeaderTitle: {
    color: Colors.text,
    fontSize: FontSize.screenTitle,
    fontWeight: '800',
  },

  // Overflow menu button
  overflowButton: {
    width: ComponentSize.buttonMedium,
    height: ComponentSize.buttonMedium,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: ComponentSize.buttonMedium / 2,
  },

  // Logging header
  loggingHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: Spacing.lg,
  },
  loggingHeaderLeft: {
    flex: 1,
  },
  loggingSubtitleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  loggingTitle: {
    color: Colors.text,
    fontSize: FontSize.screenTitle,
    fontWeight: '800',
    marginBottom: Spacing.xs,
  },
  loggingSubtitle: {
    color: Colors.textMuted,
    fontSize: FontSize.md,
  },
  timerDisplay: {
    color: Colors.textSecondary,
    fontSize: FontSize.xl,
    fontWeight: '600',
    fontVariant: ['tabular-nums'],
  },

  // Progress bar
  progressBarContainer: {
    marginBottom: Spacing.lg,
  },
  progressBarBg: {
    height: ComponentSize.progressBarHeight,
    backgroundColor: Colors.surface,
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: Colors.indigo,
    borderRadius: 2,
  },
  progressLabel: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: Spacing.sm - 2, // 6px
  },
  progressLabelText: {
    color: Colors.textMuted,
    fontSize: FontSize.sectionLabel,
    fontWeight: '500',
  },
  progressActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: Spacing.sm,
  },
  editWarmupText: {
    color: Colors.textSecondary,
    fontSize: FontSize.sectionLabel,
    fontWeight: '500',
  },
  addExerciseLink: {
    color: Colors.indigo,
    fontSize: FontSize.sectionLabel,
    fontWeight: '600',
  },

  // Reorder
  reorderBanner: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    marginBottom: Spacing.sm,
  },
  reorderBannerText: {
    color: Colors.text,
    fontSize: FontSize.md,
    fontWeight: '600',
  },
  reorderDoneText: {
    color: Colors.indigo,
    fontSize: FontSize.md,
    fontWeight: '700',
  },
  reorderControls: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: Spacing.lg,
    marginTop: -Spacing.xs,
    marginBottom: Spacing.sm,
  },
  reorderButton: {
    width: ComponentSize.buttonLarge,
    height: ComponentSize.buttonLarge,
    borderRadius: ComponentSize.buttonLarge / 2,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  reorderButtonDisabled: { opacity: 0.3 },

  // Conditioning card
  conditioningCard: {
    backgroundColor: Colors.card,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: BorderRadius.lg,
    paddingVertical: Spacing.lg,
    paddingHorizontal: Spacing.cardPaddingCompact,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  conditioningLeft: {
    gap: 2,
  },
  conditioningLabel: {
    color: Colors.textDim,
    fontSize: FontSize.sectionLabel,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  conditioningName: {
    color: Colors.textSecondary,
    fontSize: FontSize.base,
    fontWeight: '600',
  },
  conditioningCheckbox: {
    width: ComponentSize.conditioningCheckSize,
    height: ComponentSize.conditioningCheckSize,
    borderRadius: BorderRadius.button,
    borderWidth: 2,
    borderColor: Colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  conditioningCheckboxChecked: {
    backgroundColor: Colors.greenMuted,
    borderColor: Colors.green,
  },
  conditioningCheckmark: {
    color: Colors.green,
    fontSize: FontSize.md,
    fontWeight: '700',
  },

  // Pinned finish button
  pinnedFinishContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: Spacing.screenHorizontal,
    paddingBottom: Spacing.md,
    paddingTop: Spacing.md,
    backgroundColor: Colors.bg,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  finishButton: {
    paddingVertical: Spacing.lg,
    backgroundColor: Colors.green,
    borderRadius: BorderRadius.cardInner,
    alignItems: 'center',
  },
  finishButtonText: {
    color: Colors.bg,
    fontSize: FontSize.lg,
    fontWeight: '700',
    letterSpacing: 0.3,
  },

  // Picker modal
  pickerOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'flex-end',
  },
  pickerSheet: {
    backgroundColor: Colors.card,
    borderTopLeftRadius: BorderRadius.xl,
    borderTopRightRadius: BorderRadius.xl,
    padding: Spacing.cardPaddingCompact,
    maxHeight: '80%',
  },
  pickerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.lg,
  },
  pickerTitle: {
    color: Colors.text,
    fontSize: FontSize.xl,
    fontWeight: '700',
  },
  pickerSearch: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.md,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.lg,
    color: Colors.text,
    fontSize: FontSize.md,
    marginBottom: Spacing.lg,
  },
  pickerList: { maxHeight: 400 },
  pickerGroupLabel: {
    color: Colors.textDim,
    fontSize: FontSize.xs,
    fontWeight: '700',
    letterSpacing: 1,
    marginTop: Spacing.lg,
    marginBottom: Spacing.sm,
  },
  pickerItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    paddingVertical: Spacing.md,
    borderBottomWidth: 0.5,
    borderBottomColor: `${Colors.border}40`,
  },
  pickerItemText: {
    color: Colors.text,
    fontSize: FontSize.md,
  },
  backArrow: {
    color: Colors.textDim,
    fontSize: FontSize.xxl,
  },

  // Configure
  configSection: { marginTop: Spacing.lg },
  configLabel: {
    color: Colors.textSecondary,
    fontSize: FontSize.sm,
    fontWeight: '600',
    marginBottom: Spacing.sm,
    marginTop: Spacing.md,
  },
  adjustRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.xl,
  },
  adjustButton: {
    width: ComponentSize.buttonLarge,
    height: ComponentSize.buttonLarge,
    borderRadius: ComponentSize.buttonLarge / 2,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  adjustButtonText: {
    color: Colors.text,
    fontSize: FontSize.lg,
    fontWeight: '700',
  },
  adjustValue: {
    color: Colors.text,
    fontSize: FontSize.xxl,
    fontWeight: '700',
    minWidth: 60,
    textAlign: 'center',
  },
  addToWorkoutButton: {
    marginTop: Spacing.lg,
    paddingVertical: Spacing.lg,
    backgroundColor: Colors.indigo,
    borderRadius: BorderRadius.cardInner,
    alignItems: 'center',
  },
  addToWorkoutText: {
    color: Colors.text,
    fontSize: FontSize.lg,
    fontWeight: '700',
  },
});

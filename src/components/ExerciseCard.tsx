import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Spacing, FontSize, BorderRadius, ComponentSize } from '../theme';
import type { SetLog, ExerciseTarget } from '../types';

export interface SetState {
  setNumber: number;
  targetWeight: number;
  targetReps: number;
  actualWeight: number;
  actualReps: number;
  rpe?: number;
  status: SetLog['status'];
  id?: string;
}

export interface ExerciseCardProps {
  exerciseName: string;
  category: string;
  target: ExerciseTarget | undefined;
  sets: SetState[];
  rpe?: number;
  expanded: boolean;
  lastWeight?: number;
  lastReps?: number;
  blockColor: string;
  onToggleExpand: () => void;
  onCompleteSet: (setIdx: number) => void;
  onLongPressSet: (setIdx: number) => void;
  onSetRPE: (rpe: number) => void;
}

function getSetColor(status: SetLog['status']) {
  switch (status) {
    case 'completed': return { bg: Colors.greenMuted, border: `${Colors.green}40`, text: Colors.green };
    case 'completed_below': return { bg: Colors.amberMuted, border: `${Colors.amber}40`, text: Colors.amber };
    case 'skipped': return { bg: Colors.redMuted, border: `${Colors.red}40`, text: Colors.red };
    default: return { bg: Colors.surface, border: Colors.border, text: Colors.textDim };
  }
}

export function ExerciseCard({
  exerciseName, category, target, sets, rpe, expanded,
  lastWeight, lastReps, blockColor,
  onToggleExpand, onCompleteSet, onLongPressSet, onSetRPE,
}: ExerciseCardProps) {
  const allDone = sets.every(s => s.status !== 'pending');

  return (
    <TouchableOpacity
      style={styles.exerciseCard}
      onPress={onToggleExpand}
      activeOpacity={0.8}
    >
      {/* Exercise Header */}
      <View style={styles.exerciseHeader}>
        <View style={{ flex: 1 }}>
          <Text style={styles.exerciseName}>{exerciseName}</Text>
          <Text style={styles.exerciseTarget}>
            {target ? `${target.sets}×${target.reps}` : ''}
            {target?.percent ? ` @ ${target.percent}%` : ''}
            {target?.rpe_target ? ` · RPE ${target.rpe_target}` : ''}
          </Text>
        </View>
        <Text style={[styles.categoryBadge, { color: blockColor }]}>
          {category.toUpperCase()}
        </Text>
      </View>

      {expanded && (
        <>
          {/* Suggested weight + last session */}
          <View style={styles.weightInfo}>
            {sets[0]?.targetWeight > 0 && (
              <Text style={styles.suggestedWeight}>
                Suggested: {sets[0].targetWeight} lbs
              </Text>
            )}
            {lastWeight != null && (
              <Text style={styles.lastSession}>
                Last: {lastWeight} × {lastReps}
              </Text>
            )}
          </View>

          {/* Set Buttons */}
          <View style={styles.setsRow}>
            {sets.map((set, setIdx) => {
              const color = getSetColor(set.status);
              return (
                <TouchableOpacity
                  key={setIdx}
                  style={[styles.setButton, {
                    backgroundColor: color.bg,
                    borderColor: color.border,
                  }]}
                  onPress={() => {
                    if (set.status === 'pending') onCompleteSet(setIdx);
                  }}
                  onLongPress={() => onLongPressSet(setIdx)}
                >
                  <Text style={[styles.setLabel, { color: color.text }]}>
                    Set {set.setNumber}
                  </Text>
                  <Text style={[styles.setWeight, { color: color.text }]}>
                    {set.actualWeight}
                  </Text>
                  <Text style={[styles.setReps, { color: color.text }]}>
                    ×{set.actualReps}
                  </Text>
                  {set.status === 'completed' && (
                    <Ionicons name="checkmark" size={16} color={Colors.green} style={{ marginTop: 2 }} />
                  )}
                  {set.status === 'completed_below' && (
                    <Ionicons name="arrow-down" size={14} color={Colors.amber} style={{ marginTop: 2 }} />
                  )}
                </TouchableOpacity>
              );
            })}
          </View>

          {/* RPE selector (after all sets done) */}
          {allDone && (
            <View style={styles.rpeSection}>
              <Text style={styles.rpeLabel}>RPE</Text>
              <View style={styles.rpeRow}>
                {[6, 7, 8, 9, 10].map(n => (
                  <TouchableOpacity
                    key={n}
                    style={[
                      styles.rpeBubble,
                      rpe === n && {
                        backgroundColor: n >= 9 ? Colors.redMuted : `${blockColor}30`,
                        borderColor: n >= 9 ? Colors.red : blockColor,
                      },
                    ]}
                    onPress={() => onSetRPE(n)}
                  >
                    <Text style={[
                      styles.rpeBubbleText,
                      rpe === n && { color: n >= 9 ? Colors.red : blockColor },
                    ]}>{n}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          )}
        </>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  exerciseCard: {
    backgroundColor: Colors.card, borderRadius: BorderRadius.lg,
    padding: Spacing.lg, marginBottom: Spacing.md,
  },
  exerciseHeader: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start',
  },
  exerciseName: { color: Colors.text, fontSize: FontSize.lg, fontWeight: '600' },
  exerciseTarget: { color: Colors.textSecondary, fontSize: FontSize.sm, marginTop: 2 },
  categoryBadge: { fontSize: FontSize.xs, fontWeight: '700', letterSpacing: 0.5 },
  weightInfo: {
    flexDirection: 'row', justifyContent: 'space-between',
    marginTop: Spacing.md, marginBottom: Spacing.md,
  },
  suggestedWeight: { color: Colors.text, fontSize: FontSize.md, fontWeight: '600' },
  lastSession: { color: Colors.textDim, fontSize: FontSize.sm },
  setsRow: { flexDirection: 'row', gap: Spacing.sm, marginBottom: Spacing.sm },
  setButton: {
    flex: 1, paddingVertical: Spacing.sm, paddingHorizontal: Spacing.xs,
    borderRadius: BorderRadius.sm, borderWidth: 1, alignItems: 'center',
  },
  setLabel: { fontSize: FontSize.xs, fontWeight: '600' },
  setWeight: { fontSize: FontSize.lg, fontWeight: '700', marginTop: 2 },
  setReps: { fontSize: FontSize.sm },
  rpeSection: {
    flexDirection: 'row', alignItems: 'center', gap: Spacing.md, marginTop: Spacing.md,
  },
  rpeLabel: { color: Colors.textDim, fontSize: FontSize.sm, fontWeight: '600' },
  rpeRow: { flexDirection: 'row', gap: Spacing.sm },
  rpeBubble: {
    width: ComponentSize.buttonMedium, height: ComponentSize.buttonMedium,
    borderRadius: ComponentSize.buttonMedium / 2,
    borderWidth: 1, borderColor: Colors.border,
    alignItems: 'center', justifyContent: 'center',
  },
  rpeBubbleText: { color: Colors.textDim, fontSize: FontSize.sm, fontWeight: '700' },
});

/**
 * APEX — Full session history for one exercise (issue #45)
 * Reached via "View all N sessions" on the exercise detail screen.
 */
import { useState, useCallback } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet } from 'react-native';
import { useLocalSearchParams, useRouter, useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Spacing, FontSize, BorderRadius } from '../../src/theme';
import { getGenericExerciseSetHistory, getExerciseInfo } from '../../src/db';
import type { GenericSessionSetHistory } from '../../src/db';

function formatDate(dateStr: string): string {
  const d = new Date(dateStr);
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function summarize(session: GenericSessionSetHistory): string {
  const sets = session.sets;
  const weights = sets.map(s => s.weight).filter((w): w is number => w != null && w > 0);
  const reps = sets.map(s => s.reps).filter((r): r is number => r != null);
  const weightPart = weights.length ? ` · ${Math.max(...weights)} lbs` : '';
  const repsPart = reps.length ? `${sets.length} × ${Math.max(...reps)}` : `${sets.length} sets`;
  return `${repsPart}${weightPart}`;
}

export default function ExerciseSessionsScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const [sessions, setSessions] = useState<GenericSessionSetHistory[]>([]);
  const [exerciseName, setExerciseName] = useState('');

  useFocusEffect(useCallback(() => {
    (async () => {
      if (!id) return;
      const [history, infoMap] = await Promise.all([
        getGenericExerciseSetHistory(id, { limit: 1000 }),
        getExerciseInfo([id]),
      ]);
      setSessions(history);
      setExerciseName(infoMap[id]?.name ?? id.replace(/_/g, ' '));
    })();
  }, [id]));

  return (
    <View style={styles.container}>
      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
            <Ionicons name="chevron-back" size={22} color={Colors.textDim} />
          </TouchableOpacity>
          <View>
            <Text style={styles.headerTitle}>Session History</Text>
            <Text style={styles.headerSubtitle}>{exerciseName}</Text>
          </View>
        </View>

        <View style={styles.card}>
          {sessions.length === 0 && <Text style={styles.emptyText}>No completed sets yet</Text>}
          {sessions.map((session, si) => (
            <TouchableOpacity
              key={session.sessionId + si}
              activeOpacity={0.7}
              onPress={() => router.push(`/session/${session.sessionId}`)}
            >
              {si > 0 && <View style={styles.divider} />}
              <View style={styles.row}>
                <Text style={styles.date}>{formatDate(session.date)}</Text>
                <Text style={styles.summary}>{summarize(session)}</Text>
                {session.avgRpe != null && (
                  <Text style={styles.rpe}>RPE {session.avgRpe.toFixed(1)}</Text>
                )}
              </View>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>
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
  header: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md, marginBottom: Spacing.xxl },
  backButton: { padding: Spacing.xs },
  headerTitle: { color: Colors.text, fontSize: FontSize.sectionTitle, fontWeight: '700' },
  headerSubtitle: { color: Colors.textDim, fontSize: FontSize.sm, marginTop: 2 },
  card: {
    backgroundColor: Colors.card,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: BorderRadius.lg,
    padding: Spacing.xl,
  },
  divider: { height: 1, backgroundColor: Colors.surface },
  row: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md, paddingVertical: Spacing.md },
  date: { flex: 1, color: Colors.textSecondary, fontSize: FontSize.md, fontWeight: '600' },
  summary: { color: Colors.textDim, fontSize: FontSize.body },
  rpe: { color: Colors.textDim, fontSize: FontSize.body, width: 56, textAlign: 'right' },
  emptyText: { color: Colors.textMuted, fontSize: FontSize.body, textAlign: 'center', paddingVertical: Spacing.md },
});

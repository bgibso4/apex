/**
 * APEX — Workout History
 * Shows all completed sessions grouped by program, sorted newest first.
 */

import { useState, useCallback } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet } from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Spacing, FontSize, BorderRadius } from '../src/theme';
import { getAllCompletedSessions, getSetLogsForSession } from '../src/db';
import type { Session } from '../src/types';

type EnrichedSession = Session & {
  program_name: string;
  setCount: number;
  durationMin: number | undefined;
};

interface HistoryGroup {
  programId: string;
  programName: string;
  sessions: EnrichedSession[];
}

function formatDayName(dayTemplateId: string): string {
  return dayTemplateId
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

export default function HistoryScreen() {
  const router = useRouter();
  const [groups, setGroups] = useState<HistoryGroup[]>([]);
  const [loaded, setLoaded] = useState(false);

  useFocusEffect(
    useCallback(() => {
      (async () => {
        const sessions = await getAllCompletedSessions();
        const enriched: EnrichedSession[] = await Promise.all(
          sessions.map(async (s) => {
            const sets = await getSetLogsForSession(s.id);
            const completedSets = sets.filter(
              (sl) => sl.status === 'completed' || sl.status === 'completed_below'
            );
            const startedAt = s.started_at ? new Date(s.started_at).getTime() : 0;
            const completedAt = s.completed_at ? new Date(s.completed_at).getTime() : 0;
            const durationMin =
              startedAt && completedAt
                ? Math.round((completedAt - startedAt) / 60000)
                : undefined;
            return { ...s, setCount: completedSets.length, durationMin };
          })
        );

        // Group consecutive sessions with the same program_id
        const result: HistoryGroup[] = [];
        for (const s of enriched) {
          const last = result[result.length - 1];
          if (last && last.programId === s.program_id) {
            last.sessions.push(s);
          } else {
            result.push({
              programId: s.program_id,
              programName: s.program_name,
              sessions: [s],
            });
          }
        }
        setGroups(result);
        setLoaded(true);
      })();
    }, [])
  );

  return (
    <View style={styles.container}>
      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name="chevron-back" size={28} color={Colors.textDim} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Workout History</Text>
        </View>

        {/* Empty state */}
        {loaded && groups.length === 0 && (
          <View style={styles.emptyState}>
            <Text style={styles.emptyText}>No completed workouts yet</Text>
          </View>
        )}

        {/* Session groups */}
        {groups.map((group, groupIdx) => (
          <View key={`${group.programId}-${groupIdx}`}>
            <Text
              style={[
                styles.programHeader,
                groupIdx > 0 && { marginTop: Spacing.xl },
              ]}
            >
              {group.programName}
            </Text>

            {group.sessions.map((s) => {
              const dateLabel = new Date(s.date + 'T12:00:00').toLocaleDateString(
                'en-US',
                { weekday: 'short', month: 'short', day: 'numeric' }
              );
              return (
                <TouchableOpacity
                  key={s.id}
                  style={styles.sessionCard}
                  onPress={() => router.push(`/session/${s.id}`)}
                  activeOpacity={0.7}
                >
                  <View style={styles.cardLeft}>
                    <Text style={styles.cardDayName}>
                      {s.name || formatDayName(s.day_template_id)}
                    </Text>
                    <Text style={styles.cardDate}>
                      {dateLabel}
                      {s.block_name ? ` \u00B7 ${s.block_name}` : ''}
                    </Text>
                  </View>
                  <View style={styles.cardRight}>
                    {s.durationMin != null && (
                      <Text style={styles.cardStat}>{s.durationMin}m</Text>
                    )}
                    <Text style={styles.cardStat}>{s.setCount} sets</Text>
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>
        ))}
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

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    marginBottom: Spacing.sm,
  },
  backButton: { padding: Spacing.xs },
  headerTitle: {
    color: Colors.text,
    fontSize: FontSize.xxxl,
    fontWeight: '800',
  },

  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.xxxl,
  },
  emptyText: {
    color: Colors.textSecondary,
    fontSize: FontSize.lg,
  },

  programHeader: {
    color: Colors.textMuted,
    fontSize: FontSize.sectionLabel,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: Spacing.md,
  },

  sessionCard: {
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
  cardLeft: {
    flex: 1,
    gap: 2,
  },
  cardDayName: {
    color: Colors.text,
    fontSize: FontSize.base,
    fontWeight: '600',
  },
  cardDate: {
    color: Colors.textMuted,
    fontSize: FontSize.sm,
  },
  cardRight: {
    flexDirection: 'row',
    gap: Spacing.md,
    alignItems: 'center',
  },
  cardStat: {
    color: Colors.textDim,
    fontSize: FontSize.body,
    fontWeight: '500',
  },
});

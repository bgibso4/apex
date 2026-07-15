/**
 * APEX — Full progression history for one exercise (issue #45)
 * Reached via "View all ›" on the exercise detail progression card.
 */
import { useState, useCallback } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet } from 'react-native';
import { useLocalSearchParams, useRouter, useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Spacing, FontSize, BorderRadius } from '../../src/theme';
import { getAdjustmentHistory, getExerciseInfo } from '../../src/db';
import type { WeightAdjustment } from '../../src/types';

function formatDate(dateStr: string): string {
  const d = new Date(dateStr);
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

export default function ProgressionHistoryScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const [adjustments, setAdjustments] = useState<WeightAdjustment[]>([]);
  const [exerciseName, setExerciseName] = useState('');

  useFocusEffect(useCallback(() => {
    (async () => {
      if (!id) return;
      const [history, infoMap] = await Promise.all([
        getAdjustmentHistory(id),
        getExerciseInfo([id]),
      ]);
      setAdjustments(history);
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
            <Text style={styles.headerTitle}>Progression</Text>
            <Text style={styles.headerSubtitle}>{exerciseName}</Text>
          </View>
        </View>

        <View style={styles.card}>
          {adjustments.length === 0 && (
            <Text style={styles.emptyText}>No adjustments yet</Text>
          )}
          {adjustments.map((adj, ai) => (
            <View key={adj.id}>
              {ai > 0 && <View style={styles.divider} />}
              <View style={styles.row}>
                <View style={[
                  styles.badge,
                  adj.reason === 'easy' ? styles.badgeUp : styles.badgeDown,
                ]}>
                  <Text style={adj.reason === 'easy' ? styles.arrowUp : styles.arrowDown}>
                    {adj.new_weight > adj.old_weight ? '↑' : '↓'}
                  </Text>
                </View>
                <Text style={styles.weight}>
                  {adj.new_weight} lbs <Text style={styles.from}>from {adj.old_weight}</Text>
                </Text>
                <Text style={styles.reason}>{adj.reason === 'easy' ? 'felt easy' : '2 missed'}</Text>
                <Text style={styles.date}>{formatDate(adj.created_at)}</Text>
              </View>
            </View>
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
  badge: { width: 24, height: 24, borderRadius: BorderRadius.pill, alignItems: 'center', justifyContent: 'center' },
  badgeUp: { backgroundColor: Colors.greenMuted },
  badgeDown: { backgroundColor: Colors.amberMuted },
  arrowUp: { color: Colors.green, fontSize: FontSize.body, fontWeight: '700' },
  arrowDown: { color: Colors.amber, fontSize: FontSize.body, fontWeight: '700' },
  weight: { flex: 1, color: Colors.text, fontSize: FontSize.base, fontWeight: '600' },
  from: { color: Colors.textDim, fontSize: FontSize.body, fontWeight: '400' },
  reason: { color: Colors.textDim, fontSize: FontSize.sm },
  date: { color: Colors.textMuted, fontSize: FontSize.sm, width: 88, textAlign: 'right' },
  emptyText: { color: Colors.textMuted, fontSize: FontSize.body, textAlign: 'center', paddingVertical: Spacing.md },
});

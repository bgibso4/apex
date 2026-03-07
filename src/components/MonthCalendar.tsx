/**
 * APEX — MonthCalendar Component
 * Displays a full month grid (Sun-Sat) with workout completion indicators.
 * Replaces WeekRow for a richer overview of training history.
 */

import { useMemo } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import {
  Colors, Spacing, FontSize, BorderRadius, ComponentSize,
} from '../theme';

export interface MonthCalendarDay {
  /** ISO date string (YYYY-MM-DD) */
  date: string;
  /** Day number in the month (1-31) */
  dayNumber: number;
  /** Whether this day is a training day in the program schedule */
  isTrainingDay: boolean;
  /** Whether the workout for this day has been completed */
  isCompleted: boolean;
  /** Session ID for completed sessions, used for navigation */
  sessionId?: string;
}

export interface MonthCalendarProps {
  /** Year to display */
  year: number;
  /** Month to display (0-indexed: 0 = January) */
  month: number;
  /** Array of day data for this month */
  days: MonthCalendarDay[];
  /** Block color for completed-day indicators */
  blockColor: string;
  /** Called when a day is pressed. Receives the day data. */
  onDayPress: (day: MonthCalendarDay) => void;
}

const WEEKDAY_LABELS = ['S', 'M', 'T', 'W', 'T', 'F', 'S'] as const;

export function MonthCalendar({
  year,
  month,
  days,
  blockColor,
  onDayPress,
}: MonthCalendarProps) {
  const today = useMemo(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
  }, []);

  const grid = useMemo(() => buildGrid(year, month, days), [year, month, days]);

  const monthName = useMemo(() => {
    const d = new Date(year, month, 1);
    return d.toLocaleString('default', { month: 'long' });
  }, [year, month]);

  return (
    <View style={styles.container}>
      <Text style={styles.monthLabel}>
        {monthName.toUpperCase()} {year}
      </Text>

      {/* Weekday header row */}
      <View style={styles.weekdayRow}>
        {WEEKDAY_LABELS.map((label, i) => (
          <View key={i} style={styles.weekdayCell}>
            <Text style={styles.weekdayText}>{label}</Text>
          </View>
        ))}
      </View>

      {/* Day grid */}
      {grid.map((week, weekIndex) => (
        <View key={weekIndex} style={styles.weekRow}>
          {week.map((cell, cellIndex) => {
            if (!cell) {
              return <View key={cellIndex} style={styles.dayCell} />;
            }

            const isToday = cell.date === today;
            const isPast = cell.date < today;
            const isFuture = cell.date > today;

            return (
              <TouchableOpacity
                key={cellIndex}
                style={styles.dayCell}
                onPress={() => onDayPress(cell)}
                disabled={!cell.isCompleted && !cell.isTrainingDay}
                activeOpacity={0.6}
              >
                <View
                  style={[
                    styles.dayCircle,
                    isToday && styles.dayCircleToday,
                    isToday && { borderColor: blockColor },
                  ]}
                >
                  <Text
                    style={[
                      styles.dayNumber,
                      isToday && styles.dayNumberToday,
                      !cell.isTrainingDay && !isToday && styles.dayNumberRest,
                      cell.isTrainingDay && !cell.isCompleted && isPast && styles.dayNumberMissed,
                      cell.isTrainingDay && isFuture && styles.dayNumberUpcoming,
                    ]}
                  >
                    {cell.dayNumber}
                  </Text>
                </View>
                {cell.isCompleted && (
                  <View
                    style={[
                      styles.completedDot,
                      { backgroundColor: blockColor },
                    ]}
                  />
                )}
                {cell.isTrainingDay && !cell.isCompleted && (
                  <View style={styles.trainingDot} />
                )}
              </TouchableOpacity>
            );
          })}
        </View>
      ))}
    </View>
  );
}

/**
 * Build a 2D grid (weeks x 7 days) for the given month.
 * Empty slots are null (days from adjacent months).
 */
function buildGrid(
  year: number,
  month: number,
  days: MonthCalendarDay[],
): (MonthCalendarDay | null)[][] {
  const firstDay = new Date(year, month, 1);
  const startDow = firstDay.getDay(); // 0 = Sunday
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  // Index days by day number for O(1) lookup
  const dayMap = new Map<number, MonthCalendarDay>();
  for (const d of days) {
    dayMap.set(d.dayNumber, d);
  }

  const grid: (MonthCalendarDay | null)[][] = [];
  let currentDay = 1;

  // Fill week rows
  for (let week = 0; currentDay <= daysInMonth; week++) {
    const row: (MonthCalendarDay | null)[] = [];
    for (let dow = 0; dow < 7; dow++) {
      if (week === 0 && dow < startDow) {
        row.push(null);
      } else if (currentDay > daysInMonth) {
        row.push(null);
      } else {
        const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(currentDay).padStart(2, '0')}`;
        const existing = dayMap.get(currentDay);
        row.push(
          existing ?? {
            date: dateStr,
            dayNumber: currentDay,
            isTrainingDay: false,
            isCompleted: false,
          }
        );
        currentDay++;
      }
    }
    grid.push(row);
  }

  return grid;
}

const DAY_CELL_SIZE = ComponentSize.dayDotSize + Spacing.sm;

const styles = StyleSheet.create({
  container: {
    marginBottom: Spacing.lg,
  },
  monthLabel: {
    color: Colors.textDim,
    fontSize: FontSize.xs,
    fontWeight: '700',
    letterSpacing: 1,
    marginBottom: Spacing.md,
    paddingHorizontal: Spacing.xs,
  },
  weekdayRow: {
    flexDirection: 'row',
    marginBottom: Spacing.xs,
  },
  weekdayCell: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: Spacing.xs,
  },
  weekdayText: {
    color: Colors.textMuted,
    fontSize: FontSize.sectionLabel,
    fontWeight: '600',
  },
  weekRow: {
    flexDirection: 'row',
  },
  dayCell: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: Spacing.xs,
    minHeight: DAY_CELL_SIZE + Spacing.sm,
  },
  dayCircle: {
    width: ComponentSize.dayDotSize,
    height: ComponentSize.dayDotSize,
    borderRadius: ComponentSize.dayDotSize / 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dayCircleToday: {
    borderWidth: 1.5,
  },
  dayNumber: {
    fontSize: FontSize.sm,
    fontWeight: '500',
    color: Colors.textSecondary,
  },
  dayNumberToday: {
    color: Colors.text,
    fontWeight: '700',
  },
  dayNumberRest: {
    color: Colors.textMuted,
  },
  dayNumberMissed: {
    color: Colors.textDim,
  },
  dayNumberUpcoming: {
    color: Colors.textSecondary,
  },
  completedDot: {
    width: Spacing.xs,
    height: Spacing.xs,
    borderRadius: Spacing.xs / 2,
    marginTop: BorderRadius.xs,
  },
  trainingDot: {
    width: BorderRadius.xs,
    height: BorderRadius.xs,
    borderRadius: BorderRadius.xs / 2,
    backgroundColor: Colors.textMuted,
    marginTop: BorderRadius.xs,
  },
});

/**
 * APEX — MonthCalendar Component
 * Displays a full month grid (Sun-Sat) with workout completion indicators.
 * Replaces WeekRow for a richer overview of training history.
 */

import { useMemo, useRef } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, PanResponder } from 'react-native';
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
  /** Called when user navigates to previous month */
  onPrevMonth?: () => void;
  /** Called when user navigates to next month */
  onNextMonth?: () => void;
  /** Override today's date for testing (YYYY-MM-DD). Defaults to actual today. */
  today?: string;
}

const WEEKDAY_LABELS = ['S', 'M', 'T', 'W', 'T', 'F', 'S'] as const;

export function MonthCalendar({
  year,
  month,
  days,
  blockColor,
  onDayPress,
  onPrevMonth,
  onNextMonth,
  today: todayProp,
}: MonthCalendarProps) {
  const computedToday = useMemo(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
  }, []);
  const today = todayProp ?? computedToday;

  const swipeHandled = useRef(false);
  const panResponder = useMemo(() => PanResponder.create({
    onMoveShouldSetPanResponder: (_, gestureState) =>
      Math.abs(gestureState.dx) > 20 && Math.abs(gestureState.dy) < Math.abs(gestureState.dx),
    onPanResponderGrant: () => { swipeHandled.current = false; },
    onPanResponderMove: (_, gestureState) => {
      if (swipeHandled.current) return;
      if (gestureState.dx > 50 && onPrevMonth) {
        swipeHandled.current = true;
        onPrevMonth();
      } else if (gestureState.dx < -50 && onNextMonth) {
        swipeHandled.current = true;
        onNextMonth();
      }
    },
  }), [onPrevMonth, onNextMonth]);

  const grid = useMemo(() => buildGrid(year, month, days), [year, month, days]);

  const currentWeekRowIndex = useMemo(() => {
    for (let i = 0; i < grid.length; i++) {
      if (grid[i].some(cell => cell?.date === today)) return i;
    }
    return -1;
  }, [grid, today]);

  const monthName = useMemo(() => {
    const d = new Date(year, month, 1);
    return d.toLocaleString('default', { month: 'long' });
  }, [year, month]);

  return (
    <View style={styles.container} {...panResponder.panHandlers}>
      <View style={styles.monthHeader}>
        {onPrevMonth ? (
          <TouchableOpacity onPress={onPrevMonth} style={styles.monthNavButton}>
            <Text style={styles.monthNavText}>{'\u2039'}</Text>
          </TouchableOpacity>
        ) : <View style={styles.monthNavButton} />}
        <Text style={styles.monthLabel}>
          {monthName.toUpperCase()} {year}
        </Text>
        {onNextMonth ? (
          <TouchableOpacity onPress={onNextMonth} style={styles.monthNavButton}>
            <Text style={styles.monthNavText}>{'\u203A'}</Text>
          </TouchableOpacity>
        ) : <View style={styles.monthNavButton} />}
      </View>

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
        <View
          key={weekIndex}
          style={[
            styles.weekRow,
            weekIndex === currentWeekRowIndex && styles.currentWeekRow,
          ]}
          testID={weekIndex === currentWeekRowIndex ? 'current-week-row' : undefined}
        >
          {week.map((cell, cellIndex) => {
            if (!cell) {
              return <View key={cellIndex} style={styles.dayCell} />;
            }

            const isToday = cell.date === today;
            const isPast = cell.date < today;
            const isFuture = cell.date > today;
            const isCurrentWeek = weekIndex === currentWeekRowIndex;

            return (
              <TouchableOpacity
                key={cellIndex}
                style={styles.dayCell}
                onPress={() => onDayPress(cell)}
                disabled={!cell.isCompleted}
                activeOpacity={0.6}
              >
                <View
                  style={[
                    styles.dayCircle,
                    cell.isCompleted && styles.dayCircleCompleted,
                    isToday && !cell.isCompleted && styles.dayCircleToday,
                    isToday && !cell.isCompleted && { borderColor: blockColor },
                  ]}
                >
                  <Text
                    style={[
                      styles.dayNumber,
                      cell.isCompleted && styles.dayNumberCompleted,
                      isToday && !cell.isCompleted && styles.dayNumberToday,
                      !cell.isTrainingDay && !isToday && !cell.isCompleted && styles.dayNumberRest,
                      cell.isTrainingDay && !cell.isCompleted && isPast && styles.dayNumberMissed,
                      cell.isTrainingDay && isFuture && !cell.isCompleted && styles.dayNumberUpcoming,
                      cell.isTrainingDay && isFuture && !cell.isCompleted && isCurrentWeek && styles.dayNumberCurrentWeekUpcoming,
                    ]}
                  >
                    {cell.dayNumber}
                  </Text>
                </View>
                {isToday && !cell.isCompleted && (
                  <View style={[styles.todayDot, { backgroundColor: blockColor }]} />
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
  },
  monthHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.md,
    paddingHorizontal: Spacing.xs,
  },
  monthNavButton: {
    width: Spacing.xxxl,
    height: Spacing.xxxl,
    alignItems: 'center',
    justifyContent: 'center',
  },
  monthNavText: {
    color: Colors.textSecondary,
    fontSize: FontSize.xxl,
    fontWeight: '600',
  },
  monthLabel: {
    color: Colors.textDim,
    fontSize: FontSize.xs,
    fontWeight: '700',
    letterSpacing: 1,
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
  currentWeekRow: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.button,
    marginHorizontal: -Spacing.xs,
    paddingHorizontal: Spacing.xs,
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
  dayCircleCompleted: {
    backgroundColor: Colors.green,
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
  dayNumberCompleted: {
    color: Colors.bg,
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
  dayNumberCurrentWeekUpcoming: {
    color: Colors.text,
    fontWeight: '600',
  },
  todayDot: {
    width: Spacing.xs,
    height: Spacing.xs,
    borderRadius: Spacing.xs / 2,
    marginTop: BorderRadius.xs,
  },
});

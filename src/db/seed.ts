/**
 * APEX — Seed Data
 * Pre-populates the database with sample run logs and workout sessions
 * for testing progress charts and trends.
 * Call from Settings screen via "Load Sample Data" button.
 */

import { getDatabase, generateId } from './database';

/** Seed run logs with realistic progression data */
export async function seedRunLogs(): Promise<number> {
  const db = await getDatabase();

  // Check if we already have runs
  const existing = await db.getFirstAsync<{ count: number }>(
    "SELECT COUNT(*) as count FROM run_logs"
  );
  if (existing && existing.count > 5) return 0; // Already has data

  const runs = generateRunData();
  for (const run of runs) {
    await db.runAsync(
      `INSERT INTO run_logs (id, date, duration_min, distance, pain_level, pain_level_24h, notes, included_pickups)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        generateId(), run.date, run.durationMin, run.distance,
        run.painLevel, run.painLevel24h, run.notes ?? null, run.pickups ? 1 : 0,
      ]
    );
  }
  return runs.length;
}

/** Generate ~12 weeks of run data showing gradual improvement */
function generateRunData() {
  const runs: {
    date: string;
    durationMin: number;
    distance: number;
    painLevel: number;
    painLevel24h: number;
    notes?: string;
    pickups: boolean;
  }[] = [];

  const startDate = new Date();
  startDate.setDate(startDate.getDate() - 84); // 12 weeks ago

  // Generate 2-3 runs per week for 12 weeks
  for (let week = 0; week < 12; week++) {
    const runsThisWeek = week < 3 ? 2 : 3; // Start with 2, increase to 3
    const daysInWeek = [1, 3, 5]; // Tue, Thu, Sat

    for (let r = 0; r < runsThisWeek; r++) {
      const d = new Date(startDate);
      d.setDate(d.getDate() + week * 7 + daysInWeek[r]);
      if (d > new Date()) break; // Don't seed future dates

      // Duration increases from ~12 to ~25 min
      const baseDuration = 12 + week * 1.2 + Math.random() * 3;
      const durationMin = Math.round(baseDuration);

      // Pain decreases from ~7 to ~2
      const basePain = Math.max(0, 7 - week * 0.5 + (Math.random() * 2 - 1));
      const painLevel = Math.round(Math.min(10, Math.max(0, basePain)));

      // 24h pain is usually 1-2 lower than acute
      const pain24h = Math.round(Math.max(0, painLevel - 1 - Math.random()));

      // Distance increases from ~1.0 to ~2.5 mi
      const baseDistance = 1.0 + week * 0.13 + Math.random() * 0.3;
      const distance = Math.round(baseDistance * 10) / 10;

      // Pickups start around week 4
      const pickups = week >= 4 && r === 1;

      runs.push({
        date: d.toISOString().split('T')[0],
        durationMin,
        distance,
        painLevel,
        painLevel24h: pain24h,
        pickups,
      });
    }
  }

  return runs;
}

/** Seed workout sessions with set logs for progress charts */
export async function seedWorkoutSessions(programId: string): Promise<number> {
  const db = await getDatabase();

  // Check existing sessions
  const existing = await db.getFirstAsync<{ count: number }>(
    "SELECT COUNT(*) as count FROM sessions WHERE program_id = ?",
    [programId]
  );
  if (existing && existing.count > 5) return 0;

  // Ensure exercises exist
  const exercises = [
    { id: 'back_squat', name: 'Back Squat', type: 'compound', muscle_groups: '["quads","glutes"]' },
    { id: 'bench_press', name: 'Bench Press', type: 'compound', muscle_groups: '["chest","triceps"]' },
    { id: 'overhead_press', name: 'Overhead Press', type: 'compound', muscle_groups: '["shoulders","triceps"]' },
    { id: 'weighted_pullup', name: 'Weighted Pull-up', type: 'compound', muscle_groups: '["back","biceps"]' },
    { id: 'romanian_deadlift', name: 'Romanian Deadlift', type: 'compound', muscle_groups: '["hamstrings","glutes"]' },
    { id: 'zercher_squat', name: 'Zercher Squat', type: 'compound', muscle_groups: '["quads","core"]' },
  ];

  for (const ex of exercises) {
    await db.runAsync(
      `INSERT OR IGNORE INTO exercises (id, name, type, muscle_groups, alternatives)
       VALUES (?, ?, ?, ?, '[]')`,
      [ex.id, ex.name, ex.type, ex.muscle_groups]
    );
  }

  const sessions = generateSessionData(programId, exercises);
  let count = 0;
  for (const s of sessions) {
    await db.runAsync(
      `INSERT INTO sessions (id, program_id, week_number, block_name, day_template_id,
        scheduled_day, actual_day, date, sleep, soreness, energy,
        warmup_rope, warmup_ankle, warmup_hip_ir, conditioning_done,
        started_at, completed_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, 1, 1, 1, ?, ?)`,
      [
        s.id, programId, s.weekNumber, s.blockName, s.dayTemplateId,
        s.day, s.day, s.date,
        3 + Math.round(Math.random() * 2), // sleep 3-5
        2 + Math.round(Math.random() * 2), // soreness 2-4
        3 + Math.round(Math.random() * 2), // energy 3-5
        s.startedAt, s.completedAt,
      ]
    );

    for (const set of s.sets) {
      await db.runAsync(
        `INSERT INTO set_logs (id, session_id, exercise_id, set_number,
          target_weight, target_reps, actual_weight, actual_reps, rpe, status, timestamp)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'completed', ?)`,
        [
          generateId(), s.id, set.exerciseId, set.setNumber,
          set.weight, set.reps, set.weight, set.reps, set.rpe,
          s.startedAt,
        ]
      );
    }
    count++;
  }

  return count;
}

function generateSessionData(programId: string, exercises: { id: string }[]) {
  const sessions: {
    id: string;
    weekNumber: number;
    blockName: string;
    dayTemplateId: string;
    day: string;
    date: string;
    startedAt: string;
    completedAt: string;
    sets: { exerciseId: string; setNumber: number; weight: number; reps: number; rpe: number }[];
  }[] = [];

  const startDate = new Date();
  startDate.setDate(startDate.getDate() - 42); // 6 weeks ago

  // Day rotation
  const daySchedule = [
    { day: 'monday', template: 'power_upper' },
    { day: 'tuesday', template: 'power_lower' },
    { day: 'thursday', template: 'strength_upper' },
    { day: 'friday', template: 'strength_lower' },
  ];

  // Base weights (will progress over weeks)
  const baseWeights: Record<string, number> = {
    back_squat: 185, bench_press: 155, overhead_press: 95,
    weighted_pullup: 25, romanian_deadlift: 165, zercher_squat: 135,
  };

  for (let week = 1; week <= 6; week++) {
    const blockName = week <= 3 ? 'Hypertrophy' : 'Strength';

    for (const sched of daySchedule) {
      const d = new Date(startDate);
      // Find the right day of the week
      const dayIdx = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'].indexOf(sched.day);
      d.setDate(d.getDate() + (week - 1) * 7 + dayIdx);
      if (d > new Date()) continue; // Don't seed future

      const sessionId = generateId();
      const started = new Date(d);
      started.setHours(6, 30, 0);
      const completed = new Date(started);
      completed.setMinutes(completed.getMinutes() + 45 + Math.round(Math.random() * 20));

      // Pick 3 exercises for this session
      const sessionExercises = sched.template.includes('upper')
        ? [exercises[1], exercises[2], exercises[3]] // bench, OHP, pullup
        : [exercises[0], exercises[4], exercises[5]]; // squat, RDL, zercher

      const sets: { exerciseId: string; setNumber: number; weight: number; reps: number; rpe: number }[] = [];

      for (const ex of sessionExercises) {
        const base = baseWeights[ex.id] ?? 100;
        const weekMultiplier = 1 + (week - 1) * 0.025; // 2.5% per week
        const numSets = blockName === 'Hypertrophy' ? 4 : 3;
        const repsTarget = blockName === 'Hypertrophy' ? 10 : 5;

        for (let s = 1; s <= numSets; s++) {
          const weight = Math.round((base * weekMultiplier) / 5) * 5; // Round to nearest 5
          const reps = repsTarget + (Math.random() > 0.7 ? 1 : 0); // Occasionally hit +1
          const rpe = 7 + Math.round(Math.random() * 2); // RPE 7-9
          sets.push({ exerciseId: ex.id, setNumber: s, weight, reps, rpe });
        }
      }

      sessions.push({
        id: sessionId,
        weekNumber: week,
        blockName,
        dayTemplateId: sched.template,
        day: sched.day,
        date: d.toISOString().split('T')[0],
        startedAt: started.toISOString(),
        completedAt: completed.toISOString(),
        sets,
      });
    }
  }

  return sessions;
}

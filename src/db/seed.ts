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
      `INSERT INTO run_logs (id, date, duration_min, distance, pain_level, pain_level_24h, notes, included_pickups, is_sample)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        generateId(), run.date, run.durationMin, run.distance,
        run.painLevel, run.painLevel24h, run.notes ?? null, run.pickups ? 1 : 0, 1,
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

/** Seed a completed historical program with sessions and set logs */
export async function seedHistoricalProgram(): Promise<number> {
  const db = await getDatabase();

  // Check if we already have a completed program
  const existing = await db.getFirstAsync<{ count: number }>(
    "SELECT COUNT(*) as count FROM programs WHERE status = 'completed'"
  );
  if (existing && existing.count > 0) return 0;

  // Ensure exercises exist
  const exercises = [
    { id: 'back_squat', name: 'Back Squat', type: 'compound', muscle_groups: '["Legs"]', input_fields: null },
    { id: 'bench_press', name: 'Bench Press', type: 'compound', muscle_groups: '["Chest"]', input_fields: null },
    { id: 'overhead_press', name: 'Overhead Press', type: 'compound', muscle_groups: '["Shoulders"]', input_fields: null },
    { id: 'weighted_pullup', name: 'Weighted Pull-up', type: 'compound', muscle_groups: '["Back"]', input_fields: null },
    { id: 'romanian_deadlift', name: 'Romanian Deadlift', type: 'compound', muscle_groups: '["Legs"]', input_fields: null },
    { id: 'zercher_squat', name: 'Zercher Squat', type: 'compound', muscle_groups: '["Legs"]', input_fields: null },
    { id: 'barbell_curl', name: 'Barbell Curl', type: 'isolation', muscle_groups: '["Arms"]', input_fields: null },
    { id: 'lateral_raises', name: 'Lateral Raises', type: 'isolation', muscle_groups: '["Shoulders"]', input_fields: null },
    { id: 'leg_curl', name: 'Leg Curl', type: 'isolation', muscle_groups: '["Legs"]', input_fields: null },
    { id: 'face_pulls', name: 'Face Pulls', type: 'isolation', muscle_groups: '["Back"]', input_fields: null },
    { id: 'hanging_leg_raise', name: 'Hanging Leg Raise', type: 'core', muscle_groups: '["Core"]', input_fields: JSON.stringify([{ type: 'reps' }]) },
    { id: 'dumbbell_row', name: 'Dumbbell Row', type: 'compound', muscle_groups: '["Back"]', input_fields: null },
  ];

  for (const ex of exercises) {
    await db.runAsync(
      `INSERT OR IGNORE INTO exercises (id, name, type, muscle_groups, alternatives, input_fields, is_sample)
       VALUES (?, ?, ?, ?, '[]', ?, ?)`,
      [ex.id, ex.name, ex.type, ex.muscle_groups, ex.input_fields, 1]
    );
  }

  // Program started 22 weeks ago
  const activatedDate = new Date();
  activatedDate.setDate(activatedDate.getDate() - 22 * 7);
  const activatedDateStr = activatedDate.toISOString().split('T')[0];

  // Build the weekly target helper for definition_json
  const allWeeks = [1,2,3,4,5,6,7,8];
  function makeTargets() {
    return [
      { weeks: [1,2,3], sets: 4, reps: 10 },
      { weeks: [4], sets: 3, reps: 8 },
      { weeks: [5,6,7], sets: 4, reps: 6 },
      { weeks: [8], sets: 3, reps: 8 },
    ];
  }

  function makeExerciseDef(exerciseId: string) {
    return { exercise_id: exerciseId, category: 'main', targets: makeTargets() };
  }

  const definitionJson = JSON.stringify({
    program: {
      name: 'Foundation Builder',
      duration_weeks: 8,
      created: activatedDateStr,
      blocks: [
        { name: 'Base Building', weeks: [1, 2, 3], main_lift_scheme: {} },
        { name: 'Deload', weeks: [4], main_lift_scheme: {} },
        { name: 'Progressive', weeks: [5, 6, 7], main_lift_scheme: {} },
        { name: 'Deload', weeks: [8], main_lift_scheme: {} },
      ],
      weekly_template: {
        monday: {
          name: 'Upper A',
          warmup: 'standard',
          exercises: [
            makeExerciseDef('bench_press'),
            makeExerciseDef('overhead_press'),
            makeExerciseDef('weighted_pullup'),
          ],
        },
        tuesday: {
          name: 'Lower A',
          warmup: 'standard',
          exercises: [
            makeExerciseDef('back_squat'),
            makeExerciseDef('romanian_deadlift'),
            makeExerciseDef('zercher_squat'),
          ],
        },
        wednesday: { type: 'rest' },
        thursday: {
          name: 'Upper B',
          warmup: 'standard',
          exercises: [
            makeExerciseDef('bench_press'),
            makeExerciseDef('overhead_press'),
            makeExerciseDef('weighted_pullup'),
          ],
        },
        friday: {
          name: 'Lower B',
          warmup: 'standard',
          exercises: [
            makeExerciseDef('back_squat'),
            makeExerciseDef('romanian_deadlift'),
            makeExerciseDef('zercher_squat'),
          ],
        },
        saturday: { type: 'rest' },
        sunday: { type: 'rest' },
      },
      exercise_definitions: [],
      warmup_protocols: {},
    },
  });

  const oneRmValues = JSON.stringify({
    back_squat: 185,
    bench_press: 155,
    overhead_press: 95,
    weighted_pullup: 15,
    romanian_deadlift: 165,
    zercher_squat: 125,
  });

  const programId = generateId();
  await db.runAsync(
    `INSERT INTO programs (id, name, duration_weeks, created_date, status, definition_json, one_rm_values, activated_date, is_sample)
     VALUES (?, ?, ?, ?, 'completed', ?, ?, ?, ?)`,
    [programId, 'Foundation Builder', 8, activatedDateStr, definitionJson, oneRmValues, activatedDateStr, 1]
  );

  // Generate sessions
  const sessions = generateHistoricalSessionData(programId, exercises, activatedDate);
  let count = 0;
  for (const s of sessions) {
    await db.runAsync(
      `INSERT INTO sessions (id, program_id, name, week_number, block_name, day_template_id,
        scheduled_day, actual_day, date, sleep, soreness, energy,
        started_at, completed_at, is_sample)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        s.id, programId, s.name, s.weekNumber, s.blockName, s.dayTemplateId,
        s.day, s.day, s.date,
        3 + Math.round(Math.random() * 2),
        2 + Math.round(Math.random() * 2),
        3 + Math.round(Math.random() * 2),
        s.startedAt, s.completedAt, 1,
      ]
    );

    for (const set of s.sets) {
      await db.runAsync(
        `INSERT INTO set_logs (id, session_id, exercise_id, set_number,
          target_weight, target_reps, actual_weight, actual_reps, rpe, status, timestamp, is_sample)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'completed', ?, ?)`,
        [
          generateId(), s.id, set.exerciseId, set.setNumber,
          set.weight, set.reps, set.weight, set.reps, set.rpe,
          s.startedAt, 1,
        ]
      );
    }

    // Insert protocol rows
    for (let i = 0; i < s.protocols.length; i++) {
      const p = s.protocols[i];
      await db.runAsync(
        `INSERT INTO session_protocols (session_id, type, protocol_key, protocol_name, completed, sort_order, is_sample)
         VALUES (?, ?, ?, ?, ?, ?, 1)`,
        [s.id, p.type, p.protocolKey, p.protocolName, p.completed ? 1 : 0, i]
      );
    }

    count++;
  }

  return count;
}

function generateHistoricalSessionData(
  programId: string,
  exercises: { id: string }[],
  startDate: Date
): SessionData[] {
  const sessions: SessionData[] = [];

  const daySchedule = [
    { day: 'monday', template: 'upper_a', name: 'Upper A' },
    { day: 'tuesday', template: 'lower_a', name: 'Lower A' },
    { day: 'thursday', template: 'upper_b', name: 'Upper B' },
    { day: 'friday', template: 'lower_b', name: 'Lower B' },
  ];

  // Lower starting weights for the historical program
  const baseWeights: Record<string, number> = {
    back_squat: 185,
    bench_press: 155,
    overhead_press: 95,
    weighted_pullup: 15,
    romanian_deadlift: 165,
    zercher_squat: 125,
    barbell_curl: 65,
    lateral_raises: 15,
    leg_curl: 85,
    face_pulls: 30,
    hanging_leg_raise: 0,
    dumbbell_row: 55,
  };

  const upperAccessories = ['barbell_curl', 'lateral_raises', 'face_pulls', 'dumbbell_row'];
  const lowerAccessories = ['leg_curl', 'hanging_leg_raise'];

  // Skip ~5 sessions across 8 weeks for ~85% completion (32 total, skip 5 = 84%)
  const skippedSessions = new Set([
    '2-2',  // week 2, thursday
    '3-3',  // week 3, friday
    '5-0',  // week 5, monday
    '6-2',  // week 6, thursday
    '8-1',  // week 8, tuesday
  ]);

  function getBlock(week: number): { name: string; sets: number; reps: number; weightMult: number } {
    if (week <= 3) return { name: 'Base Building', sets: 4, reps: 10, weightMult: 1.0 };
    if (week === 4) return { name: 'Deload', sets: 3, reps: 8, weightMult: 0.6 };
    if (week <= 7) return { name: 'Progressive', sets: 4, reps: 6, weightMult: 1.15 };
    return { name: 'Deload', sets: 3, reps: 8, weightMult: 0.6 };
  }

  function getRpeRange(week: number): [number, number] {
    if (week <= 2) return [6, 7];
    if (week <= 3) return [7, 8];
    if (week === 4) return [5, 6];
    if (week <= 6) return [7, 8];
    if (week === 7) return [8, 9];
    return [5, 6];
  }

  let sessionIndex = 0;

  for (let week = 1; week <= 8; week++) {
    const block = getBlock(week);
    const [rpeMin, rpeMax] = getRpeRange(week);

    for (let di = 0; di < daySchedule.length; di++) {
      const sched = daySchedule[di];

      if (skippedSessions.has(`${week}-${di}`)) continue;

      const d = new Date(startDate);
      const dayIdx = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'].indexOf(sched.day);
      d.setDate(d.getDate() + (week - 1) * 7 + dayIdx);

      const sessionId = generateId();
      const started = new Date(d);
      started.setHours(6, 30, 0);
      const completed = new Date(started);
      completed.setMinutes(completed.getMinutes() + 45 + Math.round(Math.random() * 20));

      const isUpper = sched.template.includes('upper');

      const mainExercises = isUpper
        ? [exercises[1], exercises[2], exercises[3]] // bench, OHP, pullup
        : [exercises[0], exercises[4], exercises[5]]; // squat, RDL, zercher

      const accessoryPool = isUpper ? upperAccessories : lowerAccessories;
      const acc1Id = accessoryPool[sessionIndex % accessoryPool.length];
      const acc2Id = accessoryPool[(sessionIndex + 1) % accessoryPool.length];
      const accessoryExercises = [
        exercises.find(e => e.id === acc1Id)!,
        exercises.find(e => e.id === acc2Id)!,
      ];

      const sets: SessionData['sets'] = [];

      // Week progression: +2-3% per week within each block phase
      let weekProgression: number;
      if (week <= 3) {
        weekProgression = 1 + (week - 1) * 0.025;
      } else if (week === 4) {
        weekProgression = 1.0;
      } else if (week <= 7) {
        weekProgression = 1 + (week - 5) * 0.03;
      } else {
        weekProgression = 1.0;
      }

      // Main lifts
      for (const ex of mainExercises) {
        const base = baseWeights[ex.id] ?? 100;
        const weight = Math.round((base * block.weightMult * weekProgression) / 5) * 5;

        for (let s = 1; s <= block.sets; s++) {
          const repVariation = (sessionIndex + s) % 7 === 0 ? 1 : (sessionIndex + s) % 11 === 0 ? -1 : 0;
          const reps = Math.max(1, block.reps + repVariation);
          const rpe = rpeMin + ((sessionIndex + s) % (rpeMax - rpeMin + 1));
          sets.push({ exerciseId: ex.id, setNumber: s, weight, reps, rpe });
        }
      }

      // Accessories
      for (const ex of accessoryExercises) {
        const base = baseWeights[ex.id] ?? 30;
        const weight = base === 0 ? 0 : Math.round((base * (1 + (week - 1) * 0.015)) / 5) * 5;
        const accReps = 10 + ((sessionIndex) % 3);

        for (let s = 1; s <= 3; s++) {
          const rpe = Math.min(rpeMin + 1, 8);
          sets.push({ exerciseId: ex.id, setNumber: s, weight, reps: accReps, rpe });
        }
      }

      const protocols: SessionData['protocols'] = [
        { type: 'warmup', protocolKey: 'jump_rope', protocolName: 'Jump Rope', completed: warmupPattern(sessionIndex, 85) },
        { type: 'warmup', protocolKey: 'full_ankle', protocolName: 'Full Ankle Protocol', completed: warmupPattern(sessionIndex, 70) },
        { type: 'conditioning', protocolKey: null, protocolName: 'Conditioning Finisher', completed: warmupPattern(sessionIndex, 75) },
      ];

      sessions.push({
        id: sessionId,
        name: sched.name,
        weekNumber: week,
        blockName: block.name,
        dayTemplateId: sched.template,
        day: sched.day,
        date: d.toISOString().split('T')[0],
        startedAt: started.toISOString(),
        completedAt: completed.toISOString(),
        protocols,
        sets,
      });

      sessionIndex++;
    }
  }

  return sessions;
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

  // Ensure exercises exist — main lifts + accessories
  const exercises = [
    { id: 'back_squat', name: 'Back Squat', type: 'compound', muscle_groups: '["Legs"]', input_fields: null },
    { id: 'bench_press', name: 'Bench Press', type: 'compound', muscle_groups: '["Chest"]', input_fields: null },
    { id: 'overhead_press', name: 'Overhead Press', type: 'compound', muscle_groups: '["Shoulders"]', input_fields: null },
    { id: 'weighted_pullup', name: 'Weighted Pull-up', type: 'compound', muscle_groups: '["Back"]', input_fields: null },
    { id: 'romanian_deadlift', name: 'Romanian Deadlift', type: 'compound', muscle_groups: '["Legs"]', input_fields: null },
    { id: 'zercher_squat', name: 'Zercher Squat', type: 'compound', muscle_groups: '["Legs"]', input_fields: null },
    { id: 'barbell_curl', name: 'Barbell Curl', type: 'isolation', muscle_groups: '["Arms"]', input_fields: null },
    { id: 'lateral_raises', name: 'Lateral Raises', type: 'isolation', muscle_groups: '["Shoulders"]', input_fields: null },
    { id: 'leg_curl', name: 'Leg Curl', type: 'isolation', muscle_groups: '["Legs"]', input_fields: null },
    { id: 'face_pulls', name: 'Face Pulls', type: 'isolation', muscle_groups: '["Back"]', input_fields: null },
    { id: 'hanging_leg_raise', name: 'Hanging Leg Raise', type: 'core', muscle_groups: '["Core"]', input_fields: JSON.stringify([{ type: 'reps' }]) },
    { id: 'dumbbell_row', name: 'Dumbbell Row', type: 'compound', muscle_groups: '["Back"]', input_fields: null },
  ];

  for (const ex of exercises) {
    await db.runAsync(
      `INSERT OR IGNORE INTO exercises (id, name, type, muscle_groups, alternatives, input_fields, is_sample)
       VALUES (?, ?, ?, ?, '[]', ?, ?)`,
      [ex.id, ex.name, ex.type, ex.muscle_groups, ex.input_fields, 1]
    );
  }

  const sessions = generateSessionData(programId, exercises);
  let count = 0;
  for (const s of sessions) {
    await db.runAsync(
      `INSERT INTO sessions (id, program_id, name, week_number, block_name, day_template_id,
        scheduled_day, actual_day, date, sleep, soreness, energy,
        started_at, completed_at, is_sample)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        s.id, programId, s.name, s.weekNumber, s.blockName, s.dayTemplateId,
        s.day, s.day, s.date,
        3 + Math.round(Math.random() * 2), // sleep 3-5
        2 + Math.round(Math.random() * 2), // soreness 2-4
        3 + Math.round(Math.random() * 2), // energy 3-5
        s.startedAt, s.completedAt, 1,
      ]
    );

    for (const set of s.sets) {
      await db.runAsync(
        `INSERT INTO set_logs (id, session_id, exercise_id, set_number,
          target_weight, target_reps, actual_weight, actual_reps, rpe, status, timestamp, is_sample)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'completed', ?, ?)`,
        [
          generateId(), s.id, set.exerciseId, set.setNumber,
          set.weight, set.reps, set.weight, set.reps, set.rpe,
          s.startedAt, 1,
        ]
      );
    }

    // Insert protocol rows
    for (let i = 0; i < s.protocols.length; i++) {
      const p = s.protocols[i];
      await db.runAsync(
        `INSERT INTO session_protocols (session_id, type, protocol_key, protocol_name, completed, sort_order, is_sample)
         VALUES (?, ?, ?, ?, ?, ?, 1)`,
        [s.id, p.type, p.protocolKey, p.protocolName, p.completed ? 1 : 0, i]
      );
    }

    count++;
  }

  return count;
}

/** Deterministic-ish pattern for warmup/conditioning variation */
function warmupPattern(sessionIndex: number, rate: number): boolean {
  // Use a simple hash-like pattern based on session index to be deterministic
  const patterns: Record<number, number[]> = {
    85: [1,1,1,1,1,1,0,1,1,1,1,0,1,1,1,1,1,0,1,1,1,1,1,1,1,0,1,1,1,1,1,1,0,1,1,1,1,1,1,1],
    70: [1,1,0,1,1,1,0,1,1,0,1,1,0,1,1,1,0,1,1,1,0,1,0,1,1,1,0,1,1,1,0,1,1,0,1,1,0,1,1,1],
    60: [1,1,0,1,0,1,0,1,1,0,0,1,1,0,1,0,1,0,1,1,0,1,0,1,0,1,1,0,1,0,1,0,1,1,0,0,1,0,1,1],
    75: [1,1,1,0,1,1,0,1,1,1,0,1,1,0,1,1,1,0,1,1,1,0,1,0,1,1,1,0,1,1,0,1,1,1,0,1,1,0,1,1],
  };
  const pattern = patterns[rate] ?? patterns[75];
  return pattern[sessionIndex % pattern.length] === 1;
}

interface SessionData {
  id: string;
  name: string;
  weekNumber: number;
  blockName: string;
  dayTemplateId: string;
  day: string;
  date: string;
  startedAt: string;
  completedAt: string;
  protocols: { type: string; protocolKey: string | null; protocolName: string; completed: boolean }[];
  sets: { exerciseId: string; setNumber: number; weight: number; reps: number; rpe: number }[];
}

function generateSessionData(programId: string, exercises: { id: string }[]): SessionData[] {
  const sessions: SessionData[] = [];

  const startDate = new Date();
  startDate.setDate(startDate.getDate() - 70); // 10 weeks ago

  // Day rotation
  const daySchedule = [
    { day: 'monday', template: 'power_upper', name: 'Athletic Power & Conditioning' },
    { day: 'tuesday', template: 'power_lower', name: 'Athletic Lower Power' },
    { day: 'thursday', template: 'strength_upper', name: 'Upper Strength & Hypertrophy' },
    { day: 'friday', template: 'strength_lower', name: 'Lower Strength & Hypertrophy' },
  ];

  // Base weights
  const baseWeights: Record<string, number> = {
    back_squat: 225,
    bench_press: 185,
    overhead_press: 115,
    weighted_pullup: 35,
    romanian_deadlift: 195,
    zercher_squat: 155,
    barbell_curl: 75,
    lateral_raises: 20,
    leg_curl: 100,
    face_pulls: 40,
    hanging_leg_raise: 0,
    dumbbell_row: 65,
  };

  // Upper accessories and lower accessories
  const upperAccessories = ['barbell_curl', 'lateral_raises', 'face_pulls', 'dumbbell_row'];
  const lowerAccessories = ['leg_curl', 'hanging_leg_raise'];

  // Sessions to skip: (week, dayIndex) pairs — ~90% completion
  // Skip 1 in week 2, 1 in week 4, 2 in week 7
  const skippedSessions = new Set([
    '2-2', // week 2, thursday
    '4-3', // week 4, friday
    '7-0', // week 7, monday
    '7-2', // week 7, thursday
  ]);

  // Block structure
  function getBlock(week: number): { name: string; sets: number; reps: number; weightMult: number } {
    if (week <= 4) return { name: 'Hypertrophy', sets: 4, reps: 10, weightMult: 1.0 };
    if (week === 5) return { name: 'Deload', sets: 3, reps: 8, weightMult: 0.6 };
    if (week <= 9) return { name: 'Strength', sets: 4, reps: 5, weightMult: 1.15 };
    return { name: 'Deload', sets: 3, reps: 8, weightMult: 0.6 };
  }

  // RPE by block phase
  function getRpeRange(week: number): [number, number] {
    if (week <= 2) return [6, 7];   // early hypertrophy
    if (week <= 4) return [7, 8];   // mid hypertrophy
    if (week === 5) return [5, 6];  // deload
    if (week <= 7) return [7, 8];   // early strength
    if (week <= 9) return [8, 9];   // peak strength
    return [5, 6];                  // deload
  }

  let sessionIndex = 0;

  for (let week = 1; week <= 10; week++) {
    const block = getBlock(week);
    const [rpeMin, rpeMax] = getRpeRange(week);

    for (let di = 0; di < daySchedule.length; di++) {
      const sched = daySchedule[di];

      // Check if this session is skipped
      if (skippedSessions.has(`${week}-${di}`)) continue;

      const d = new Date(startDate);
      // Find the right day of the week
      const dayIdx = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'].indexOf(sched.day);
      d.setDate(d.getDate() + (week - 1) * 7 + dayIdx);
      // Don't seed current week or future — prevents false "Workout complete" on home screen
      const daysAgo = Math.floor((Date.now() - d.getTime()) / (1000 * 60 * 60 * 24));
      if (daysAgo < 7) continue;

      const sessionId = generateId();
      const started = new Date(d);
      started.setHours(6, 30, 0);
      const completed = new Date(started);
      completed.setMinutes(completed.getMinutes() + 45 + Math.round(Math.random() * 20));

      const isUpper = sched.template.includes('upper');

      // Pick 3 main exercises
      const mainExercises = isUpper
        ? [exercises[1], exercises[2], exercises[3]] // bench, OHP, pullup
        : [exercises[0], exercises[4], exercises[5]]; // squat, RDL, zercher

      // Pick 2 accessories — rotate through available options
      const accessoryPool = isUpper ? upperAccessories : lowerAccessories;
      const acc1Id = accessoryPool[sessionIndex % accessoryPool.length];
      const acc2Id = accessoryPool[(sessionIndex + 1) % accessoryPool.length];
      const accessoryExercises = [
        exercises.find(e => e.id === acc1Id)!,
        exercises.find(e => e.id === acc2Id)!,
      ];

      const sets: SessionData['sets'] = [];

      // Week progression multiplier (within each block phase)
      let weekProgression: number;
      if (week <= 4) {
        weekProgression = 1 + (week - 1) * 0.025; // +2.5% per week in hypertrophy
      } else if (week === 5) {
        weekProgression = 1.0; // deload uses weightMult directly
      } else if (week <= 9) {
        weekProgression = 1 + (week - 6) * 0.025; // +2.5% per week in strength
      } else {
        weekProgression = 1.0; // deload
      }

      // Main lifts
      for (const ex of mainExercises) {
        const base = baseWeights[ex.id] ?? 100;
        const weight = Math.round((base * block.weightMult * weekProgression) / 5) * 5;

        for (let s = 1; s <= block.sets; s++) {
          // Vary reps slightly: occasionally +1 or -1
          const repVariation = (sessionIndex + s) % 7 === 0 ? 1 : (sessionIndex + s) % 11 === 0 ? -1 : 0;
          const reps = Math.max(1, block.reps + repVariation);
          const rpe = rpeMin + ((sessionIndex + s) % (rpeMax - rpeMin + 1));
          sets.push({ exerciseId: ex.id, setNumber: s, weight, reps, rpe });
        }
      }

      // Accessory lifts — lighter, higher reps, 3 sets
      for (const ex of accessoryExercises) {
        const base = baseWeights[ex.id] ?? 30;
        // Accessories don't change much with blocks, just light progression
        const weight = base === 0 ? 0 : Math.round((base * (1 + (week - 1) * 0.015)) / 5) * 5;
        const accReps = 10 + ((sessionIndex) % 3); // 10-12

        for (let s = 1; s <= 3; s++) {
          const rpe = Math.min(rpeMin + 1, 8); // accessories capped at RPE 8
          sets.push({ exerciseId: ex.id, setNumber: s, weight, reps: accReps, rpe });
        }
      }

      // Warmup/conditioning variation
      const protocols: SessionData['protocols'] = [
        { type: 'warmup', protocolKey: 'jump_rope', protocolName: 'Jump Rope', completed: warmupPattern(sessionIndex, 85) },
        { type: 'warmup', protocolKey: 'full_ankle', protocolName: 'Full Ankle Protocol', completed: warmupPattern(sessionIndex, 70) },
        { type: 'conditioning', protocolKey: null, protocolName: 'Conditioning Finisher', completed: warmupPattern(sessionIndex, 75) },
      ];

      sessions.push({
        id: sessionId,
        name: sched.name,
        weekNumber: week,
        blockName: block.name,
        dayTemplateId: sched.template,
        day: sched.day,
        date: d.toISOString().split('T')[0],
        startedAt: started.toISOString(),
        completedAt: completed.toISOString(),
        protocols,
        sets,
      });

      sessionIndex++;
    }
  }

  return sessions;
}

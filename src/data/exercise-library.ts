/**
 * APEX — Built-in Exercise Library
 * Complete exercise catalog grouped by muscle group for the exercise picker.
 */

import type { InputField } from '../types/fields';

export type LibraryExercise = {
  id: string;
  name: string;
  muscleGroup: typeof MUSCLE_GROUPS[number];
  type: 'main' | 'accessory' | 'core' | 'conditioning';
  inputFields?: InputField[];
};

export const MUSCLE_GROUPS = [
  'Chest', 'Back', 'Shoulders', 'Quads', 'Hamstrings & Glutes',
  'Calves', 'Arms', 'Abs', 'Conditioning', 'Movement',
] as const;

export const EXERCISE_LIBRARY: LibraryExercise[] = [
  // ── Chest (12) ──────────────────────────────────────────────
  { id: 'bench_press', name: 'Bench Press', muscleGroup: 'Chest', type: 'main' },
  { id: 'cable_flys', name: 'Cable Flys', muscleGroup: 'Chest', type: 'accessory' },
  { id: 'dips', name: 'Dips', muscleGroup: 'Chest', type: 'accessory', inputFields: [{ type: 'reps' }] },
  { id: 'flat_bench_db', name: 'Flat Bench - DB', muscleGroup: 'Chest', type: 'accessory' },
  { id: 'hammer_incline_press', name: 'Hammer Incline Press', muscleGroup: 'Chest', type: 'accessory' },
  { id: 'incline_bench_bb', name: 'Incline Bench - BB', muscleGroup: 'Chest', type: 'accessory' },
  { id: 'incline_db_press', name: 'Incline Bench - DB', muscleGroup: 'Chest', type: 'accessory' },
  { id: 'one_arm_cable_fly', name: 'One Arm Cable Fly', muscleGroup: 'Chest', type: 'accessory' },
  { id: 'pec_dec', name: 'Pec Dec', muscleGroup: 'Chest', type: 'accessory' },
  { id: 'plyo_pushup', name: 'Plyo Push-up', muscleGroup: 'Chest', type: 'accessory', inputFields: [{ type: 'reps' }] },
  { id: 'pushups', name: 'Pushups', muscleGroup: 'Chest', type: 'accessory', inputFields: [{ type: 'reps' }] },
  { id: 'smith_incline_bench', name: 'Smith Incline Bench', muscleGroup: 'Chest', type: 'accessory' },

  // ── Back (18) ───────────────────────────────────────────────
  { id: 'barbell_row', name: 'BB Rows', muscleGroup: 'Back', type: 'main' },
  { id: 'bb_shrugs', name: 'BB Shrugs', muscleGroup: 'Back', type: 'accessory' },
  { id: 'cable_row', name: 'Cable Row', muscleGroup: 'Back', type: 'accessory' },
  { id: 'db_row_overhead', name: 'DB Row - Overhead', muscleGroup: 'Back', type: 'accessory' },
  { id: 'deadlift', name: 'Deadlift', muscleGroup: 'Back', type: 'main' },
  { id: 'hammer_row', name: 'Hammer Row', muscleGroup: 'Back', type: 'accessory' },
  { id: 'kt_swings', name: 'KT Swings', muscleGroup: 'Back', type: 'accessory' },
  { id: 'landmine_explosive_row', name: 'Landmine Explosive Row', muscleGroup: 'Back', type: 'accessory' },
  { id: 'lat_pulldown', name: 'Lat Pulldown', muscleGroup: 'Back', type: 'accessory' },
  { id: 'lat_pulldowns_machine', name: 'Lat Pulldowns - Machine', muscleGroup: 'Back', type: 'accessory' },
  { id: 'lat_pullovers', name: 'Lat Pullovers', muscleGroup: 'Back', type: 'accessory' },
  { id: 'low_row', name: 'Low Row', muscleGroup: 'Back', type: 'accessory' },
  { id: 'one_arm_cable_lat_pulls', name: 'One Arm Cable Lat Pulls', muscleGroup: 'Back', type: 'accessory' },
  { id: 'pullups', name: 'Pullups', muscleGroup: 'Back', type: 'accessory', inputFields: [{ type: 'reps' }] },
  { id: 'shrugs_db', name: 'Shrugs - DB', muscleGroup: 'Back', type: 'accessory' },
  { id: 'smith_machine_rows', name: 'Smith Machine Rows', muscleGroup: 'Back', type: 'accessory' },
  { id: 't_bar_row', name: 'T-Bar Row', muscleGroup: 'Back', type: 'accessory' },
  { id: 'weighted_pullup', name: 'Weighted Pull-up', muscleGroup: 'Back', type: 'main' },

  // ── Shoulders (13) ─────────────────────────────────────────
  { id: 'arnold_press', name: 'Arnold Press', muscleGroup: 'Shoulders', type: 'accessory' },
  { id: 'db_hang_high_pull', name: 'DB Hang High Pull', muscleGroup: 'Shoulders', type: 'accessory' },
  { id: 'face_pulls', name: 'Face Pulls', muscleGroup: 'Shoulders', type: 'accessory' },
  { id: 'hammer_shoulder', name: 'Hammer Shoulder', muscleGroup: 'Shoulders', type: 'accessory' },
  { id: 'lateral_flys_cable', name: 'Lateral Flys - Cable', muscleGroup: 'Shoulders', type: 'accessory' },
  { id: 'lateral_raises', name: 'Lateral Raises', muscleGroup: 'Shoulders', type: 'accessory' },
  { id: 'overhead_press', name: 'Overhead Press', muscleGroup: 'Shoulders', type: 'main' },
  { id: 'rear_delt_flys', name: 'Rear Delt Flys', muscleGroup: 'Shoulders', type: 'accessory' },
  { id: 'rev_cable_x_one_arm', name: 'Rev Cable X - One Arm', muscleGroup: 'Shoulders', type: 'accessory' },
  { id: 'reverse_cable_crossover', name: 'Reverse Cable Crossover', muscleGroup: 'Shoulders', type: 'accessory' },
  { id: 'rotator_cuff_db', name: 'Rotator Cuff - DB', muscleGroup: 'Shoulders', type: 'accessory' },
  { id: 'rotator_cuff_luke', name: 'Rotator Cuff - Luke', muscleGroup: 'Shoulders', type: 'accessory' },
  { id: 'shoulder_press_db', name: 'Shoulder Press - DB', muscleGroup: 'Shoulders', type: 'accessory' },

  // ── Quads (19) ──────────────────────────────────────────────
  { id: 'back_squat', name: 'Back Squat', muscleGroup: 'Quads', type: 'main' },
  { id: 'box_jump', name: 'Box Jump', muscleGroup: 'Quads', type: 'accessory', inputFields: [{ type: 'reps' }] },
  { id: 'bulgarian_split_squat', name: 'Bulgarian Split Squat', muscleGroup: 'Quads', type: 'accessory' },
  { id: 'close_stance_smith_squat', name: 'Close-Stance Smith Squat', muscleGroup: 'Quads', type: 'accessory' },
  { id: 'cossack_squat', name: 'Cossack Squat', muscleGroup: 'Quads', type: 'accessory' },
  { id: 'cossack_squat_bw', name: 'Cossack Squat - BW', muscleGroup: 'Quads', type: 'accessory', inputFields: [{ type: 'reps' }] },
  { id: 'front_squat', name: 'Front Squat', muscleGroup: 'Quads', type: 'main' },
  { id: 'hack_squat', name: 'Hack Squat', muscleGroup: 'Quads', type: 'accessory' },
  { id: 'hack_squat_front', name: 'Hack Squat - Front', muscleGroup: 'Quads', type: 'accessory' },
  { id: 'jump_lunges', name: 'Jump Lunges', muscleGroup: 'Quads', type: 'accessory', inputFields: [{ type: 'reps' }] },
  { id: 'leg_extension', name: 'Leg Extension', muscleGroup: 'Quads', type: 'accessory' },
  { id: 'lunges_bb', name: 'Lunges - BB', muscleGroup: 'Quads', type: 'accessory' },
  { id: 'lunges_kt', name: 'Lunges - KT', muscleGroup: 'Quads', type: 'accessory' },
  { id: 'one_leg_step_down_squat', name: 'One Leg Step Down Squat', muscleGroup: 'Quads', type: 'accessory' },
  { id: 'side_to_side_jumps', name: 'Side to Side Jumps', muscleGroup: 'Quads', type: 'accessory', inputFields: [{ type: 'reps' }] },
  { id: 'sled_push', name: 'Sled Push', muscleGroup: 'Quads', type: 'conditioning', inputFields: [{ type: 'weight', unit: 'lbs' }, { type: 'distance', unit: 'm' }] },
  { id: 'split_squats_kt', name: 'Split Squats - KT', muscleGroup: 'Quads', type: 'accessory' },
  { id: 'trap_bar_squat_to_box_jump', name: 'Trap Bar Squat to Box Jump', muscleGroup: 'Quads', type: 'accessory' },
  { id: 'zercher_squat', name: 'Zercher Squat', muscleGroup: 'Quads', type: 'main' },

  // ── Hamstrings & Glutes (11) ────────────────────────────────
  { id: 'cable_kick_backs', name: 'Cable Kick Backs', muscleGroup: 'Hamstrings & Glutes', type: 'accessory' },
  { id: 'glute_med', name: 'Glute Med', muscleGroup: 'Hamstrings & Glutes', type: 'accessory' },
  { id: 'hip_abduction', name: 'Hip Abductors', muscleGroup: 'Hamstrings & Glutes', type: 'accessory' },
  { id: 'hip_adduction', name: 'Hip Adductors', muscleGroup: 'Hamstrings & Glutes', type: 'accessory' },
  { id: 'hip_thrust', name: 'Hip Thrust', muscleGroup: 'Hamstrings & Glutes', type: 'accessory' },
  { id: 'leg_press', name: 'Leg Press', muscleGroup: 'Hamstrings & Glutes', type: 'accessory' },
  { id: 'lying_leg_curl', name: 'Lying Leg Curl', muscleGroup: 'Hamstrings & Glutes', type: 'accessory' },
  { id: 'nordic_curl', name: 'Nordic Hamstring Curl', muscleGroup: 'Hamstrings & Glutes', type: 'accessory', inputFields: [{ type: 'reps' }] },
  { id: 'romanian_deadlift', name: 'Romanian Deadlift', muscleGroup: 'Hamstrings & Glutes', type: 'main' },
  { id: 'side_plank', name: 'Side Plank', muscleGroup: 'Hamstrings & Glutes', type: 'core', inputFields: [{ type: 'duration', unit: 'sec' }] },
  { id: 'standing_one_leg_ham_curl', name: 'Standing One Leg Ham Curl', muscleGroup: 'Hamstrings & Glutes', type: 'accessory' },

  // ── Calves (3) ──────────────────────────────────────────────
  { id: 'pogo_hops', name: 'Pogo Hops', muscleGroup: 'Calves', type: 'accessory', inputFields: [{ type: 'reps' }] },
  { id: 'seated_calf_raises', name: 'Seated Calf Raises', muscleGroup: 'Calves', type: 'accessory' },
  { id: 'standing_calf_raises', name: 'Standing Calf Raises', muscleGroup: 'Calves', type: 'accessory' },

  // ── Arms (17) ───────────────────────────────────────────────
  { id: 'cable_curls', name: 'Cable Curls', muscleGroup: 'Arms', type: 'accessory' },
  { id: 'close_grip_pushups', name: 'Close Grip Pushups', muscleGroup: 'Arms', type: 'accessory', inputFields: [{ type: 'reps' }] },
  { id: 'curls', name: 'Curls', muscleGroup: 'Arms', type: 'accessory' },
  { id: 'db_curls', name: 'DB Curls', muscleGroup: 'Arms', type: 'accessory' },
  { id: 'fixed_elbow_curl', name: 'Fixed Elbow Curl', muscleGroup: 'Arms', type: 'accessory' },
  { id: 'forearm_curls', name: 'Forearm Curls', muscleGroup: 'Arms', type: 'accessory' },
  { id: 'hammer_curl', name: 'Hammer Curl', muscleGroup: 'Arms', type: 'accessory' },
  { id: 'incline_curls', name: 'Incline Curls', muscleGroup: 'Arms', type: 'accessory' },
  { id: 'one_arm_tri_ex', name: 'One Arm Tri Ex', muscleGroup: 'Arms', type: 'accessory' },
  { id: 'overhead_db_tri_ex', name: 'Overhead DB Tri Ex', muscleGroup: 'Arms', type: 'accessory' },
  { id: 'overhead_tricep_extension', name: 'Overhead Tricep Extension', muscleGroup: 'Arms', type: 'accessory' },
  { id: 'preacher_curl', name: 'Preacher Curl', muscleGroup: 'Arms', type: 'accessory' },
  { id: 'seated_dip', name: 'Seated Dip', muscleGroup: 'Arms', type: 'accessory' },
  { id: 'skull_crushers', name: 'Skull Crushers', muscleGroup: 'Arms', type: 'accessory' },
  { id: 'standing_bicep_curls', name: 'Standing Bicep Curls', muscleGroup: 'Arms', type: 'accessory' },
  { id: 'tricep_dips', name: 'Tricep Dips', muscleGroup: 'Arms', type: 'accessory' },
  { id: 'tricep_pushdown', name: 'Tri Pushdowns', muscleGroup: 'Arms', type: 'accessory' },

  // ── Abs (15) ────────────────────────────────────────────────
  { id: 'ab_wheel', name: 'Ab Wheel', muscleGroup: 'Abs', type: 'core', inputFields: [{ type: 'reps' }] },
  { id: 'cable_ab_crunch', name: 'Cable Ab Crunch', muscleGroup: 'Abs', type: 'core' },
  { id: 'cable_twists', name: 'Cable Twists', muscleGroup: 'Abs', type: 'core' },
  { id: 'core_circuit', name: 'Core Circuit', muscleGroup: 'Abs', type: 'core', inputFields: [{ type: 'reps' }] },
  { id: 'decline_russian_twists', name: 'Decline Russian Twists', muscleGroup: 'Abs', type: 'core', inputFields: [{ type: 'reps' }] },
  { id: 'decline_situp', name: 'Decline Situp', muscleGroup: 'Abs', type: 'core', inputFields: [{ type: 'reps' }] },
  { id: 'dragonflys', name: 'Dragonflys', muscleGroup: 'Abs', type: 'core', inputFields: [{ type: 'reps' }] },
  { id: 'hanging_leg_raise', name: 'Hanging Leg Raises', muscleGroup: 'Abs', type: 'core', inputFields: [{ type: 'reps' }] },
  { id: 'lateral_cable_ex', name: 'Lateral Cable Ex', muscleGroup: 'Abs', type: 'core' },
  { id: 'low_ab_crunch', name: 'Low Ab Crunch', muscleGroup: 'Abs', type: 'core', inputFields: [{ type: 'reps' }] },
  { id: 'med_ball_slams', name: 'Med Ball Slams', muscleGroup: 'Abs', type: 'core', inputFields: [{ type: 'reps' }] },
  { id: 'neck_fixed_twists', name: 'Neck Fixed Twists', muscleGroup: 'Abs', type: 'core', inputFields: [{ type: 'reps' }] },
  { id: 'one_handed_farmers_carry', name: 'One Handed Farmers Carry', muscleGroup: 'Abs', type: 'core', inputFields: [{ type: 'weight', unit: 'lbs' }, { type: 'distance', unit: 'm' }] },
  { id: 'russian_twists_kt', name: 'Russian Twists - KT', muscleGroup: 'Abs', type: 'core' },
  { id: 'weighted_side_crunch', name: 'Weighted Side Crunch', muscleGroup: 'Abs', type: 'core' },

  // ── Conditioning (6) ────────────────────────────────────────
  { id: 'broad_jump', name: 'Broad Jump', muscleGroup: 'Conditioning', type: 'conditioning', inputFields: [{ type: 'reps' }] },
  { id: 'easy_run', name: 'Easy Run', muscleGroup: 'Conditioning', type: 'conditioning', inputFields: [{ type: 'duration', unit: 'sec' }] },
  { id: 'farmers_carry', name: "Farmer's Carry", muscleGroup: 'Conditioning', type: 'conditioning', inputFields: [{ type: 'weight', unit: 'lbs' }, { type: 'distance', unit: 'm' }] },
  { id: 'kb_swings_heavy', name: 'KB Swings - Heavy', muscleGroup: 'Conditioning', type: 'conditioning' },
  { id: 'light_farmers_carry', name: "Light Farmer's Carry", muscleGroup: 'Conditioning', type: 'conditioning', inputFields: [{ type: 'weight', unit: 'lbs' }, { type: 'distance', unit: 'm' }] },
  { id: 'skierg_intervals', name: 'SkiErg Intervals', muscleGroup: 'Conditioning', type: 'conditioning', inputFields: [{ type: 'distance', unit: 'm' }] },

  // ── Movement (2) ────────────────────────────────────────────
  { id: 'agility_drills', name: 'Agility Drills', muscleGroup: 'Movement', type: 'conditioning', inputFields: [{ type: 'duration', unit: 'sec' }] },
  { id: 'hip_mobility_flow', name: 'Hip Mobility Flow', muscleGroup: 'Movement', type: 'conditioning', inputFields: [{ type: 'duration', unit: 'sec' }] },
];

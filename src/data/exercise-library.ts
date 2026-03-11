/**
 * APEX — Built-in Exercise Library
 * Common exercises grouped by muscle group for the ad-hoc exercise picker.
 */

import type { InputField } from '../types/fields';

export type LibraryExercise = {
  id: string;
  name: string;
  muscleGroup: string;
  type: 'main' | 'accessory' | 'core' | 'conditioning';
  inputFields?: InputField[];
};

export const MUSCLE_GROUPS = [
  'Chest', 'Back', 'Shoulders', 'Legs', 'Arms', 'Core',
] as const;

export const EXERCISE_LIBRARY: LibraryExercise[] = [
  // Chest
  { id: 'bench_press', name: 'Bench Press', muscleGroup: 'Chest', type: 'main' },
  { id: 'incline_bench_press', name: 'Incline Bench Press', muscleGroup: 'Chest', type: 'accessory' },
  { id: 'dumbbell_bench_press', name: 'Dumbbell Bench Press', muscleGroup: 'Chest', type: 'accessory' },
  { id: 'dumbbell_flyes', name: 'Dumbbell Flyes', muscleGroup: 'Chest', type: 'accessory' },
  { id: 'push_ups', name: 'Push-ups', muscleGroup: 'Chest', type: 'accessory', inputFields: [{ type: 'reps' }] },
  { id: 'cable_crossover', name: 'Cable Crossover', muscleGroup: 'Chest', type: 'accessory' },
  { id: 'dips', name: 'Dips', muscleGroup: 'Chest', type: 'accessory', inputFields: [{ type: 'reps' }] },

  // Back
  { id: 'weighted_pullup', name: 'Weighted Pull-up', muscleGroup: 'Back', type: 'main' },
  { id: 'pull_ups', name: 'Pull-ups', muscleGroup: 'Back', type: 'accessory', inputFields: [{ type: 'reps' }] },
  { id: 'barbell_row', name: 'Barbell Row', muscleGroup: 'Back', type: 'accessory' },
  { id: 'dumbbell_row', name: 'Dumbbell Row', muscleGroup: 'Back', type: 'accessory' },
  { id: 'lat_pulldown', name: 'Lat Pulldown', muscleGroup: 'Back', type: 'accessory' },
  { id: 'cable_row', name: 'Cable Row', muscleGroup: 'Back', type: 'accessory' },
  { id: 'face_pulls', name: 'Face Pulls', muscleGroup: 'Back', type: 'accessory' },
  { id: 'romanian_deadlift', name: 'Romanian Deadlift', muscleGroup: 'Back', type: 'main' },

  // Shoulders
  { id: 'overhead_press', name: 'Overhead Press', muscleGroup: 'Shoulders', type: 'main' },
  { id: 'dumbbell_shoulder_press', name: 'Dumbbell Shoulder Press', muscleGroup: 'Shoulders', type: 'accessory' },
  { id: 'lateral_raises', name: 'Lateral Raises', muscleGroup: 'Shoulders', type: 'accessory' },
  { id: 'front_raises', name: 'Front Raises', muscleGroup: 'Shoulders', type: 'accessory' },
  { id: 'rear_delt_flyes', name: 'Rear Delt Flyes', muscleGroup: 'Shoulders', type: 'accessory' },
  { id: 'arnold_press', name: 'Arnold Press', muscleGroup: 'Shoulders', type: 'accessory' },

  // Legs
  { id: 'back_squat', name: 'Back Squat', muscleGroup: 'Legs', type: 'main' },
  { id: 'front_squat', name: 'Front Squat', muscleGroup: 'Legs', type: 'main' },
  { id: 'zercher_squat', name: 'Zercher Squat', muscleGroup: 'Legs', type: 'main' },
  { id: 'leg_press', name: 'Leg Press', muscleGroup: 'Legs', type: 'accessory' },
  { id: 'lunges', name: 'Lunges', muscleGroup: 'Legs', type: 'accessory' },
  { id: 'bulgarian_split_squat', name: 'Bulgarian Split Squat', muscleGroup: 'Legs', type: 'accessory' },
  { id: 'leg_curl', name: 'Leg Curl', muscleGroup: 'Legs', type: 'accessory' },
  { id: 'leg_extension', name: 'Leg Extension', muscleGroup: 'Legs', type: 'accessory' },
  { id: 'calf_raises', name: 'Calf Raises', muscleGroup: 'Legs', type: 'accessory' },
  { id: 'hip_thrust', name: 'Hip Thrust', muscleGroup: 'Legs', type: 'accessory' },
  { id: 'broad_jump', name: 'Broad Jump', muscleGroup: 'Legs', type: 'accessory', inputFields: [{ type: 'reps' }] },

  // Arms
  { id: 'barbell_curl', name: 'Barbell Curl', muscleGroup: 'Arms', type: 'accessory' },
  { id: 'dumbbell_curl', name: 'Dumbbell Curl', muscleGroup: 'Arms', type: 'accessory' },
  { id: 'hammer_curl', name: 'Hammer Curl', muscleGroup: 'Arms', type: 'accessory' },
  { id: 'tricep_pushdown', name: 'Tricep Pushdown', muscleGroup: 'Arms', type: 'accessory' },
  { id: 'skull_crushers', name: 'Skull Crushers', muscleGroup: 'Arms', type: 'accessory' },
  { id: 'overhead_tricep_extension', name: 'Overhead Tricep Extension', muscleGroup: 'Arms', type: 'accessory' },

  // Core
  { id: 'plank', name: 'Plank', muscleGroup: 'Core', type: 'core', inputFields: [{ type: 'duration', unit: 'sec' }] },
  { id: 'hanging_leg_raise', name: 'Hanging Leg Raise', muscleGroup: 'Core', type: 'core', inputFields: [{ type: 'reps' }] },
  { id: 'ab_wheel', name: 'Ab Wheel', muscleGroup: 'Core', type: 'core', inputFields: [{ type: 'reps' }] },
  { id: 'cable_woodchop', name: 'Cable Woodchop', muscleGroup: 'Core', type: 'core' },
  { id: 'pallof_press', name: 'Pallof Press', muscleGroup: 'Core', type: 'core' },
  { id: 'russian_twist', name: 'Russian Twist', muscleGroup: 'Core', type: 'core', inputFields: [{ type: 'reps' }] },
  { id: 'dead_bug', name: 'Dead Bug', muscleGroup: 'Core', type: 'core', inputFields: [{ type: 'reps' }] },
];

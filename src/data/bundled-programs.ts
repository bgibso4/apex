/**
 * APEX — Bundled programs
 * Programs shipped with the app. Auto-imported on first library open and
 * refreshed (definition + exercises) on every launch for active/inactive rows.
 */

import type { ProgramDefinition } from '../types';
import FunctionalAthlete from './functional-athlete.json';
import FunctionalAthletePillars from './functional-athlete-pillars.json';

// Order matters: when multiple bundled programs define the same exercise id,
// the later entry wins the exercise-metadata upsert on each launch refresh
// (currently only box_jump.alternatives differs between entries below).
export const BUNDLED_PROGRAMS: ProgramDefinition[] = [
  FunctionalAthlete as unknown as ProgramDefinition,
  FunctionalAthletePillars as unknown as ProgramDefinition,
];

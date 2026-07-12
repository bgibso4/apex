# Exercise Repository & Progress Improvements Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Expand the All Exercises screen into a full exercise repository with add-exercise support, enrich the exercise detail page with resource links, and improve the progress tab's e1RM card curation.

**Architecture:** Four independent workstreams: (1) All Exercises list UX improvements (spacing, show all exercises not just logged ones), (2) Add Exercise form, (3) Exercise resource links on detail page, (4) Progress tab e1RM card curation. Each workstream produces a working, testable feature. New `exercise_resources` table for links. New `getAllExercises()` query to show library + logged exercises together.

**Tech Stack:** React Native (Expo), TypeScript, SQLite (expo-sqlite), Jest + @testing-library/react-native

**GitHub Issue:** #48

---

## File Structure

### New Files
- `src/db/exercises.ts` — getAllExercises and insertExercise queries (separate from metrics.ts which is already 800+ lines)
- `src/components/AddExerciseModal.tsx` — Modal form for creating new exercises
- `src/db/exerciseResources.ts` — CRUD for exercise resource links
- `__tests__/db/exerciseResources.test.ts` — Tests for resource link queries
- `__tests__/db/exercises.test.ts` — Tests for new exercise queries (getAllExercises, insertExercise)
- `__tests__/components/AddExerciseModal.test.tsx` — Component tests for add exercise form
- `docs/mockups/exercise-detail-resources-2026-03-22.html` — Mockup for resource links section
- `docs/mockups/all-exercises-2026-03-22.html` — Mockup for improved all exercises screen
- `docs/mockups/add-exercise-2026-03-22.html` — Mockup for add exercise modal

### Modified Files
- `src/db/schema.ts` — Add `exercise_resources` table, bump SCHEMA_VERSION to 12
- `src/db/database.ts` — Add migration for v12 (exercise_resources table), update `clearAllData` to include exercise_resources
- `src/db/index.ts` — Re-export new functions from exercises.ts and exerciseResources.ts
- `src/data/exercise-library.ts` — Complete rewrite: ~122 exercises across 10 muscle groups (Chest, Back, Shoulders, Quads, Hamstrings & Glutes, Calves, Arms, Abs, Conditioning, Movement). Sourced from user's exercise spreadsheet + active program definitions. Replaces current ~47 exercise library.
- `app/exercises.tsx` — Show all exercises (merged DB + library), improve spacing/tap targets, add "+" button
- `app/exercise/[id].tsx` — Add resource links section below sessions
- `app/(tabs)/progress.tsx` — Update curated lift arrays (swap weighted pull-up for front squat)

---

## Workstream A: All Exercises List Improvements

### Task A0: Rebuild Exercise Library Data File

**Files:**
- Modify: `src/data/exercise-library.ts`

This is a prerequisite for all other tasks. The exercise library is the source of truth for "all known exercises" and must be rebuilt from the user's spreadsheet + active program definitions.

**Sources:**
1. User's personal exercise spreadsheet (~100 exercises across 8 groups)
2. Functional Athlete program definitions (~40 exercises, some overlap with spreadsheet)

**Muscle groups (new):** Chest, Back, Shoulders, Quads, Hamstrings & Glutes, Calves, Arms, Abs, Conditioning, Movement

- [ ] **Step 1: Rewrite MUSCLE_GROUPS and EXERCISE_LIBRARY**

Update `src/data/exercise-library.ts` with:

```typescript
export const MUSCLE_GROUPS = [
  'Chest', 'Back', 'Shoulders', 'Quads', 'Hamstrings & Glutes',
  'Calves', 'Arms', 'Abs', 'Conditioning', 'Movement',
] as const;
```

Replace the `EXERCISE_LIBRARY` array with the complete ~122 exercise list below.

**IMPORTANT:** Preserve existing IDs for exercises already in the program (`bench_press`, `back_squat`, `weighted_pullup`, `overhead_press`, `zercher_squat`, `romanian_deadlift`, `barbell_row`, `face_pulls`, `lateral_raises`, `incline_db_press`, `tricep_pushdown`, `overhead_tricep_extension`, `lat_pulldown`, `hip_thrust`, `close_stance_smith_squat`, `bulgarian_split_squat`, `nordic_curl`, `lying_leg_curl`, `hip_adduction`, `hip_abduction`, `cossack_squat`, `cossack_squat_bw`, `sled_push`, `broad_jump`, `box_jump`, `plyo_pushup`, `pogo_hops`, `landmine_explosive_row`, `trap_bar_squat_to_box_jump`, `db_hang_high_pull`, `curls`, `db_curls`, `tricep_dips`, `skierg_intervals`, `farmers_carry`, `light_farmers_carry`, `kb_swings_heavy`, `easy_run`, `agility_drills`, `hip_mobility_flow`, `core_circuit`). These IDs are already in the database with logged set data.

**Complete exercise list by muscle group (alphabetized within each group):**

**Chest (12):**
`bench_press` Bench Press (weight+reps), `cable_flys` Cable Flys (weight+reps), `dips` Dips (reps), `flat_bench_db` Flat Bench - DB (weight+reps), `hammer_incline_press` Hammer Incline Press (weight+reps), `incline_bench_bb` Incline Bench - BB (weight+reps), `incline_db_press` Incline Bench - DB (weight+reps), `one_arm_cable_fly` One Arm Cable Fly (weight+reps), `pec_dec` Pec Dec (weight+reps), `plyo_pushup` Plyo Push-up (reps), `pushups` Pushups (reps), `smith_incline_bench` Smith Incline Bench (weight+reps)

**Back (18):**
`barbell_row` BB Rows (weight+reps), `bb_shrugs` BB Shrugs (weight+reps), `cable_row` Cable Row (weight+reps), `db_row_overhead` DB Row - Overhead (weight+reps), `deadlift` Deadlift (weight+reps), `hammer_row` Hammer Row (weight+reps), `kt_swings` KT Swings (weight+reps), `landmine_explosive_row` Landmine Explosive Row (weight+reps), `lat_pulldown` Lat Pulldown (weight+reps), `lat_pulldowns_machine` Lat Pulldowns - Machine (weight+reps), `lat_pullovers` Lat Pullovers (weight+reps), `low_row` Low Row (weight+reps), `one_arm_cable_lat_pulls` One Arm Cable Lat Pulls (weight+reps), `pullups` Pullups (reps), `shrugs_db` Shrugs - DB (weight+reps), `smith_machine_rows` Smith Machine Rows (weight+reps), `t_bar_row` T-Bar Row (weight+reps), `weighted_pullup` Weighted Pull-up (weight+reps)

**Shoulders (13):**
`arnold_press` Arnold Press (weight+reps), `db_hang_high_pull` DB Hang High Pull (weight+reps), `face_pulls` Face Pulls (weight+reps), `hammer_shoulder` Hammer Shoulder (weight+reps), `lateral_flys_cable` Lateral Flys - Cable (weight+reps), `lateral_raises` Lateral Raises (weight+reps), `overhead_press` Overhead Press (weight+reps), `rear_delt_flys` Rear Delt Flys (weight+reps), `rev_cable_x_one_arm` Rev Cable X - One Arm (weight+reps), `reverse_cable_crossover` Reverse Cable Crossover (weight+reps), `rotator_cuff_db` Rotator Cuff - DB (weight+reps), `rotator_cuff_luke` Rotator Cuff - Luke (weight+reps), `shoulder_press_db` Shoulder Press - DB (weight+reps)

**Quads (19):**
`back_squat` Back Squat (weight+reps), `box_jump` Box Jump (reps), `bulgarian_split_squat` Bulgarian Split Squat (weight+reps), `close_stance_smith_squat` Close-Stance Smith Squat (weight+reps), `cossack_squat` Cossack Squat (weight+reps), `cossack_squat_bw` Cossack Squat - BW (reps), `front_squat` Front Squat (weight+reps), `hack_squat` Hack Squat (weight+reps), `hack_squat_front` Hack Squat - Front (weight+reps), `jump_lunges` Jump Lunges (reps), `leg_extension` Leg Extension (weight+reps), `lunges_bb` Lunges - BB (weight+reps), `lunges_kt` Lunges - KT (weight+reps), `one_leg_step_down_squat` One Leg Step Down Squat (weight+reps), `side_to_side_jumps` Side to Side Jumps (reps), `sled_push` Sled Push (weight+distance), `split_squats_kt` Split Squats - KT (weight+reps), `trap_bar_squat_to_box_jump` Trap Bar Squat to Box Jump (weight+reps), `zercher_squat` Zercher Squat (weight+reps)

**Hamstrings & Glutes (11):**
`cable_kick_backs` Cable Kick Backs (weight+reps), `glute_med` Glute Med (weight+reps), `hip_abduction` Hip Abductors (weight+reps), `hip_adduction` Hip Adductors (weight+reps), `hip_thrust` Hip Thrust (weight+reps), `leg_press` Leg Press (weight+reps), `lying_leg_curl` Lying Leg Curl (weight+reps), `nordic_curl` Nordic Hamstring Curl (reps), `romanian_deadlift` Romanian Deadlift (weight+reps), `side_plank` Side Plank (duration), `standing_one_leg_ham_curl` Standing One Leg Ham Curl (weight+reps)

**Calves (3):**
`pogo_hops` Pogo Hops (reps), `seated_calf_raises` Seated Calf Raises (weight+reps), `standing_calf_raises` Standing Calf Raises (weight+reps)

**Arms (17):**
`cable_curls` Cable Curls (weight+reps), `close_grip_pushups` Close Grip Pushups (reps), `curls` Curls (weight+reps), `db_curls` DB Curls (weight+reps), `fixed_elbow_curl` Fixed Elbow Curl (weight+reps), `forearm_curls` Forearm Curls (weight+reps), `hammer_curl` Hammer Curl (weight+reps), `incline_curls` Incline Curls (weight+reps), `one_arm_tri_ex` One Arm Tri Ex (weight+reps), `overhead_db_tri_ex` Overhead DB Tri Ex (weight+reps), `overhead_tricep_extension` Overhead Tricep Extension (weight+reps), `preacher_curl` Preacher Curl (weight+reps), `seated_dip` Seated Dip (weight+reps), `skull_crushers` Skull Crushers (weight+reps), `standing_bicep_curls` Standing Bicep Curls (weight+reps), `tricep_dips` Tricep Dips (weight+reps), `tricep_pushdown` Tri Pushdowns (weight+reps)

**Abs (15):**
`ab_wheel` Ab Wheel (reps), `cable_ab_crunch` Cable Ab Crunch (weight+reps), `cable_twists` Cable Twists (weight+reps), `core_circuit` Core Circuit (reps), `decline_russian_twists` Decline Russian Twists (reps), `decline_situp` Decline Situp (reps), `dragonflys` Dragonflys (reps), `hanging_leg_raise` Hanging Leg Raises (reps), `lateral_cable_ex` Lateral Cable Ex (weight+reps), `low_ab_crunch` Low Ab Crunch (reps), `med_ball_slams` Med Ball Slams (reps), `neck_fixed_twists` Neck Fixed Twists (reps), `one_handed_farmers_carry` One Handed Farmers Carry (weight+distance), `russian_twists_kt` Russian Twists - KT (weight+reps), `weighted_side_crunch` Weighted Side Crunch (weight+reps)

**Conditioning (6):**
`broad_jump` Broad Jump (reps), `easy_run` Easy Run (duration), `farmers_carry` Farmer's Carry (weight+distance), `kb_swings_heavy` KB Swings - Heavy (weight+reps), `light_farmers_carry` Light Farmer's Carry (weight+distance), `skierg_intervals` SkiErg Intervals (distance)

**Movement (2):**
`agility_drills` Agility Drills (duration), `hip_mobility_flow` Hip Mobility Flow (duration)

- [ ] **Step 2: Update the LibraryExercise type if needed**

The current type has `muscleGroup: string` (singular). With the new groups, this should remain as-is — each exercise belongs to one primary muscle group for grouping purposes.

- [ ] **Step 3: Run tests to verify nothing breaks**

```bash
npm test
```

- [ ] **Step 4: Commit**

```bash
git add src/data/exercise-library.ts
git commit -m "feat: rebuild exercise library with 122 exercises across 10 muscle groups"
```

---

### Task A1: Mockup — Improved All Exercises Screen

**Files:**
- Create: `docs/mockups/all-exercises-2026-03-22.html`

- [ ] **Step 1: Create mockup**

Build an HTML mockup showing:
- Larger row padding (min 48px tap targets) for gym-proof tapping
- Collapsible muscle group headers: Chest, Back, Shoulders, Quads, Hamstrings & Glutes, Calves, Arms, Abs, Conditioning, Movement
- All known exercises shown (~122), not just those with logged sets
- Exercises with logged data show sparkline + metric value on the right
- Exercises without data show a muted dash or "—"
- Exercises alphabetized within each group
- "+" button in the header to add a new exercise
- Follow existing app dark theme (use `Colors.bg: #0A0A0F`, `Colors.card: #141419`, etc.)

Reference existing `app/exercises.tsx` for current layout. Reference `src/theme/` for token values.

- [ ] **Step 2: Open mockup for review**

```bash
open docs/mockups/all-exercises-2026-03-22.html
```

**STOP — Wait for user approval before proceeding.**

---

### Task A2: DB — getAllExercises query

**Files:**
- Create: `__tests__/db/exercises.test.ts`
- Create: `src/db/exercises.ts`
- Modify: `src/db/index.ts`

**Key design decision:** The `exercises` table only contains exercises that have been used in a program or added ad-hoc. The in-code `EXERCISE_LIBRARY` (`src/data/exercise-library.ts`) contains ~122 exercises across 10 muscle groups. To show "all known exercises" per the issue, `getAllExercises()` must **merge** the DB exercises with the in-code library, deduplicating by ID. DB entries take precedence (they may have user-modified names/fields).

- [ ] **Step 1: Write failing test for getAllExercises**

```typescript
// __tests__/db/exercises.test.ts
import { getAllExercises } from '../../src/db';

describe('getAllExercises', () => {
  it('returns exercises from DB merged with built-in library', async () => {
    const all = await getAllExercises();
    // Built-in library has ~122 exercises
    expect(all.length).toBeGreaterThanOrEqual(100);
    // Should include a known library exercise even if not in DB
    expect(all.find(e => e.id === 'pec_dec')).toBeDefined();
  });

  it('marks exercises with logged sets correctly', async () => {
    const all = await getAllExercises();
    const bench = all.find(e => e.id === 'bench_press');
    expect(bench).toBeDefined();
    expect(typeof bench!.hasLoggedSets).toBe('boolean');
  });

  it('DB exercises override library entries with same ID', async () => {
    const all = await getAllExercises();
    const bench = all.find(e => e.id === 'bench_press');
    expect(bench).toBeDefined();
  });
});
```

Follow the existing test patterns in `__tests__/db/` for DB setup.

- [ ] **Step 2: Run test to verify it fails**

```bash
npm test -- --testPathPattern="__tests__/db/exercises.test" --verbose
```

Expected: FAIL — `getAllExercises` not defined

- [ ] **Step 3: Implement getAllExercises**

In `src/db/exercises.ts` (new file — metrics.ts is already 800+ lines):

```typescript
import { getDatabase } from './database';
import { EXERCISE_LIBRARY } from '../data/exercise-library';

export interface ExerciseListItem {
  id: string;
  name: string;
  type: string;
  muscleGroups: string[];
  inputFields: string | null;
  hasLoggedSets: boolean;
}

export async function getAllExercises(): Promise<ExerciseListItem[]> {
  const db = await getDatabase();

  // Get all DB exercises with logged-set status
  const rows = await db.getAllAsync<{
    id: string;
    name: string;
    type: string;
    muscle_groups: string;
    input_fields: string | null;
    has_logged: number;
  }>(`
    SELECT e.id, e.name, e.type, e.muscle_groups, e.input_fields,
      CASE WHEN sl.exercise_id IS NOT NULL THEN 1 ELSE 0 END as has_logged
    FROM exercises e
    LEFT JOIN (SELECT DISTINCT exercise_id FROM set_logs WHERE status = 'completed') sl
      ON sl.exercise_id = e.id
  `);

  // Build map from DB rows (DB takes precedence)
  const exerciseMap = new Map<string, ExerciseListItem>();
  for (const r of rows) {
    exerciseMap.set(r.id, {
      id: r.id,
      name: r.name,
      type: r.type,
      muscleGroups: JSON.parse(r.muscle_groups || '[]'),
      inputFields: r.input_fields,
      hasLoggedSets: r.has_logged === 1,
    });
  }

  // Merge in-code library entries (only if not already in DB)
  for (const lib of EXERCISE_LIBRARY) {
    if (!exerciseMap.has(lib.id)) {
      exerciseMap.set(lib.id, {
        id: lib.id,
        name: lib.name,
        type: lib.type,
        muscleGroups: [lib.muscleGroup],
        inputFields: lib.inputFields ? JSON.stringify(lib.inputFields) : null,
        hasLoggedSets: false,
      });
    }
  }

  // Sort client-side by name (grouping by muscle group is done in the UI layer)
  return Array.from(exerciseMap.values()).sort((a, b) => a.name.localeCompare(b.name));
}
```

Re-export from `src/db/index.ts`.

- [ ] **Step 4: Run test to verify it passes**

```bash
npm test -- --testPathPattern="__tests__/db/exercises.test" --verbose
```

- [ ] **Step 5: Commit**

```bash
git add __tests__/db/exercises.test.ts src/db/exercises.ts src/db/index.ts
git commit -m "feat: add getAllExercises merging DB + built-in library"
```

---

### Task A3: Update All Exercises Screen

**Files:**
- Modify: `app/exercises.tsx`

- [ ] **Step 1: Replace getLoggedExercises with getAllExercises**

Update `app/exercises.tsx` to:
1. Import and call `getAllExercises()` instead of `getLoggedExercises()`
2. Only fetch e1RM/sparkline data for exercises where `hasLoggedSets === true`
3. Show all exercises in the grouped list, with a muted "—" for unlogged ones
4. Increase row `paddingVertical` from `Spacing.md` (12) to at least `Spacing.lg` (16) for larger tap targets
5. Group by `muscleGroups[0]` using the `MUSCLE_GROUPS` order from exercise-library.ts (already updated in Task A0)
6. Add collapsible state per group: `const [collapsed, setCollapsed] = useState<Set<string>>(new Set())` — tapping the group header toggles collapse. All groups expanded by default.
7. Exercises alphabetized within each group.

- [ ] **Step 2: Add "+" header button**

Add a TouchableOpacity with `Ionicons "add"` icon in the header row, next to the title. On press, show `AddExerciseModal` (built in Workstream B). For now, just add the button with a placeholder `onPress`.

- [ ] **Step 3: Verify on device or in tests**

```bash
npm test
```

- [ ] **Step 4: Commit**

```bash
git add app/exercises.tsx src/data/exercise-library.ts
git commit -m "feat: show all exercises in repository, improve tap targets"
```

---

## Workstream B: Add Exercise

### Task B1: Mockup — Add Exercise Modal

**Files:**
- Create: `docs/mockups/add-exercise-2026-03-22.html`

- [ ] **Step 1: Create mockup**

Simple modal with:
- Title: "New Exercise"
- Text input: Exercise name (required)
- Picker/chips: Exercise type (main, accessory, core, conditioning)
- Picker/chips: Muscle group (select one from MUSCLE_GROUPS)
- Picker/chips: Input fields preset (weight+reps, reps only, weight+distance, distance+time, duration) — all 5 profiles from `FIELD_PROFILES` in `src/types/fields.ts`
- "Save" button (disabled until name filled)
- "Cancel" button or swipe-to-dismiss
- Dark theme matching app

- [ ] **Step 2: Open mockup for review**

```bash
open docs/mockups/add-exercise-2026-03-22.html
```

**STOP — Wait for user approval before proceeding.**

---

### Task B2: DB — insertExercise

**Files:**
- Modify: `__tests__/db/exercises.test.ts`
- Modify: `src/db/exercises.ts`
- Modify: `src/db/index.ts`

- [ ] **Step 1: Write failing test**

```typescript
describe('insertExercise', () => {
  it('inserts a new exercise into the exercises table', async () => {
    await insertExercise({
      name: 'Goblet Squat',
      type: 'accessory',
      muscleGroup: 'Legs',
      inputFields: [{ type: 'weight', unit: 'lbs' }, { type: 'reps' }],
    });
    const all = await getAllExercises();
    expect(all.find(e => e.name === 'Goblet Squat')).toBeDefined();
  });

  it('generates a snake_case ID from the name', async () => {
    const id = await insertExercise({ name: 'Cable Lateral Raise', type: 'accessory', muscleGroup: 'Shoulders' });
    expect(id).toBe('cable_lateral_raise');
  });

  it('appends UUID suffix when derived ID collides with existing exercise', async () => {
    // 'bench_press' already exists in the DB/library
    const id = await insertExercise({ name: 'Bench Press!', type: 'main', muscleGroup: 'Chest' });
    // Should not be 'bench_press' — should have a suffix
    expect(id).not.toBe('bench_press');
    expect(id).toMatch(/^bench_press_[a-z0-9]+$/);
  });

  it('rejects duplicate names (case-insensitive)', async () => {
    await insertExercise({ name: 'My Custom Lift', type: 'accessory', muscleGroup: 'Chest' });
    await expect(insertExercise({ name: 'My Custom Lift', type: 'main', muscleGroup: 'Chest' }))
      .rejects.toThrow();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

```bash
npm test -- --testPathPattern="__tests__/db/exercises.test" --verbose
```

- [ ] **Step 3: Implement insertExercise**

In `src/db/exercises.ts`:

```typescript
import * as Crypto from 'expo-crypto';

export async function insertExercise(params: {
  name: string;
  type: string;
  muscleGroup: string;
  inputFields?: InputField[];
}): Promise<string> {
  const db = await getDatabase();
  let id = params.name.toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_|_$/g, '');

  // Check for ID collision — append short UUID suffix if needed
  const existing = await db.getFirstAsync<{ id: string }>(
    'SELECT id FROM exercises WHERE id = ?', [id]
  );
  if (existing) {
    id = `${id}_${Crypto.randomUUID().slice(0, 8)}`;
  }

  await db.runAsync(
    `INSERT INTO exercises (id, name, type, muscle_groups, input_fields)
     VALUES (?, ?, ?, ?, ?)`,
    [id, params.name, params.type, JSON.stringify([params.muscleGroup]),
     params.inputFields ? JSON.stringify(params.inputFields) : null]
  );
  return id;
}
```

Re-export from `src/db/index.ts`.

- [ ] **Step 4: Run test to verify it passes**

- [ ] **Step 5: Commit**

```bash
git add __tests__/db/exercises.test.ts src/db/exercises.ts src/db/index.ts
git commit -m "feat: add insertExercise with collision-safe ID generation"
```

---

### Task B3: AddExerciseModal Component

**Files:**
- Create: `src/components/AddExerciseModal.tsx`
- Create: `__tests__/components/AddExerciseModal.test.tsx`

- [ ] **Step 1: Write component test**

Test that:
- Modal renders with name input, type picker, muscle group picker
- Save button is disabled when name is empty
- Save button calls `insertExercise` with correct params and closes modal
- Cancel closes the modal

- [ ] **Step 2: Run test to verify it fails**

- [ ] **Step 3: Implement AddExerciseModal**

Props: `{ visible: boolean; onClose: () => void; onSaved: (id: string) => void }`

UI:
- Modal with slide-up presentation
- TextInput for name
- Horizontal chip rows for type selection (default: 'accessory')
- Horizontal chip rows for muscle group (default: first in MUSCLE_GROUPS)
- Horizontal chip rows for input field preset (default: weight+reps)
- Save + Cancel buttons
- All using design tokens

- [ ] **Step 4: Run test to verify it passes**

- [ ] **Step 5: Wire into exercises.tsx**

Update `app/exercises.tsx` to:
1. Import AddExerciseModal
2. Add `showAddModal` state
3. Wire the "+" button to open the modal
4. On save, reload the exercise list

- [ ] **Step 6: Commit**

```bash
git add src/components/AddExerciseModal.tsx __tests__/components/AddExerciseModal.test.tsx app/exercises.tsx
git commit -m "feat: add exercise creation modal to repository screen"
```

---

## Workstream C: Exercise Resource Links

### Task C1: Mockup — Resource Links on Exercise Detail

**Files:**
- Create: `docs/mockups/exercise-detail-resources-2026-03-22.html`

- [ ] **Step 1: Create mockup**

Show the exercise detail page (`app/exercise/[id].tsx`) with a new "Resources" section below "Recent Sessions":
- Section label: "RESOURCES"
- Each resource: card row with label text (left) and external link icon (right)
- Tapping opens URL in browser/YouTube app
- "Add Resource" row at the bottom with "+" icon — tapping shows a simple form (inline or mini-modal) with label + URL inputs
- Empty state: "No resources yet — tap + to add a tutorial link"
- Keep it minimal: just a list of labeled URLs

Reference `app/exercise/[id].tsx` lines 386-430 for how Recent Sessions section is structured. Mirror that pattern.

- [ ] **Step 2: Open mockup for review**

```bash
open docs/mockups/exercise-detail-resources-2026-03-22.html
```

**STOP — Wait for user approval before proceeding.**

---

### Task C2: DB — exercise_resources table + CRUD

**Files:**
- Modify: `src/db/schema.ts` (bump to v12, add table)
- Modify: `src/db/database.ts` (add v12 migration)
- Create: `src/db/exerciseResources.ts`
- Create: `__tests__/db/exerciseResources.test.ts`
- Modify: `src/db/index.ts`

- [ ] **Step 1: Write failing tests**

```typescript
// __tests__/db/exerciseResources.test.ts
describe('exercise resources', () => {
  it('addExerciseResource inserts a resource link', async () => {
    const id = await addExerciseResource('bench_press', 'Form Tutorial', 'https://youtube.com/watch?v=abc');
    expect(id).toBeDefined();
    const resources = await getExerciseResources('bench_press');
    expect(resources).toHaveLength(1);
    expect(resources[0].label).toBe('Form Tutorial');
    expect(resources[0].url).toBe('https://youtube.com/watch?v=abc');
  });

  it('deleteExerciseResource removes a resource', async () => {
    const id = await addExerciseResource('bench_press', 'Video', 'https://example.com');
    await deleteExerciseResource(id);
    const resources = await getExerciseResources('bench_press');
    expect(resources).toHaveLength(0);
  });

  it('getExerciseResources returns empty array for exercise with no resources', async () => {
    const resources = await getExerciseResources('nonexistent');
    expect(resources).toEqual([]);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

- [ ] **Step 3: Add schema + migration**

In `src/db/schema.ts`, add to `CREATE_TABLES`:

```sql
CREATE TABLE IF NOT EXISTS exercise_resources (
  id TEXT PRIMARY KEY,
  exercise_id TEXT NOT NULL,
  label TEXT NOT NULL,
  url TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (exercise_id) REFERENCES exercises(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_exercise_resources_exercise ON exercise_resources(exercise_id);
```

Bump `SCHEMA_VERSION` to 12.

In `src/db/database.ts`, add v12 migration:

```typescript
if (currentVersion < 12) {
  try {
    await db.execAsync(`
      CREATE TABLE IF NOT EXISTS exercise_resources (
        id TEXT PRIMARY KEY,
        exercise_id TEXT NOT NULL,
        label TEXT NOT NULL,
        url TEXT NOT NULL,
        created_at TEXT NOT NULL DEFAULT (datetime('now')),
        FOREIGN KEY (exercise_id) REFERENCES exercises(id) ON DELETE CASCADE
      );
      CREATE INDEX IF NOT EXISTS idx_exercise_resources_exercise ON exercise_resources(exercise_id);
    `);
  } catch (e) {
    console.warn('Migration to v12 warning:', e);
  }
}
```

- [ ] **Step 4: Implement CRUD functions**

In `src/db/exerciseResources.ts`:

```typescript
import { getDatabase } from './database';
import * as Crypto from 'expo-crypto';

export interface ExerciseResource {
  id: string;
  exerciseId: string;
  label: string;
  url: string;
  createdAt: string;
}

export async function getExerciseResources(exerciseId: string): Promise<ExerciseResource[]> {
  const db = await getDatabase();
  const rows = await db.getAllAsync<{
    id: string; exercise_id: string; label: string; url: string; created_at: string;
  }>(
    'SELECT * FROM exercise_resources WHERE exercise_id = ? ORDER BY created_at',
    [exerciseId]
  );
  return rows.map(r => ({
    id: r.id, exerciseId: r.exercise_id, label: r.label, url: r.url, createdAt: r.created_at,
  }));
}

export async function addExerciseResource(
  exerciseId: string, label: string, url: string
): Promise<string> {
  const db = await getDatabase();
  const id = Crypto.randomUUID();
  await db.runAsync(
    'INSERT INTO exercise_resources (id, exercise_id, label, url) VALUES (?, ?, ?, ?)',
    [id, exerciseId, label, url]
  );
  return id;
}

export async function deleteExerciseResource(id: string): Promise<void> {
  const db = await getDatabase();
  await db.runAsync('DELETE FROM exercise_resources WHERE id = ?', [id]);
}
```

Re-export from `src/db/index.ts`.

- [ ] **Step 5: Run tests to verify they pass**

```bash
npm test -- --testPathPattern="__tests__/db/exerciseResources" --verbose
```

- [ ] **Step 6: Update clearAllData**

In `src/db/database.ts`, add `DELETE FROM exercise_resources;` to the `clearAllData` function, before the `DELETE FROM exercises` line (since exercise_resources has a foreign key to exercises).

- [ ] **Step 7: Commit**

```bash
git add src/db/schema.ts src/db/database.ts src/db/exerciseResources.ts src/db/index.ts __tests__/db/exerciseResources.test.ts
git commit -m "feat: add exercise_resources table with CRUD for tutorial links"
```

---

### Task C3: Exercise Detail — Resource Links UI

**Files:**
- Modify: `app/exercise/[id].tsx`

- [ ] **Step 1: Add resources section to exercise detail**

After the "Recent Sessions" section (around line 430), add:

1. Load resources: add `getExerciseResources(id)` call in `loadData`
2. State: `const [resources, setResources] = useState<ExerciseResource[]>([])`
3. State: `const [showAddResource, setShowAddResource] = useState(false)`
4. Section label: "RESOURCES"
5. Resource rows in a card (same style as sessionsCard), each row:
   - Label text (left)
   - External link icon (right)
   - `onPress` → `Linking.openURL(resource.url)`
   - Long press or swipe → delete (simple: just a small trash icon on the right edge)
6. "Add Resource" row at bottom:
   - If `showAddResource` is false: tappable row with "+" icon and "Add link" text
   - If `showAddResource` is true: two TextInputs (label, URL) + Save/Cancel buttons inline
7. Empty state text when no resources exist

- [ ] **Step 2: Write component tests for resource links**

Create or extend tests in `__tests__/screens/exerciseDetail.test.tsx` (or the appropriate test file):
- Test that resources section renders when resources exist
- Test that "Add link" row appears
- Test that tapping a resource calls `Linking.openURL`
- Test that the add resource form shows label + URL inputs when tapped

- [ ] **Step 3: Run tests**

```bash
npm test
```

- [ ] **Step 4: Commit**

```bash
git add app/exercise/[id].tsx __tests__/screens/exerciseDetail.test.tsx
git commit -m "feat: add resource links section to exercise detail page"
```

---

## Workstream D: Progress Tab — e1RM Card Curation

### Task D1: Replace Hardcoded Lifts with Curated Config

**Files:**
- Modify: `app/(tabs)/progress.tsx`

This is the simplest workstream. The issue says to keep the 6 cards curated but swap weighted pull-up for a more relevant compound lift.

**Decision:** Swap `weighted_pullup` for `front_squat` (Front Squat). Front squat is a main compound lift in the user's program and provides a more meaningful e1RM to track alongside back squat. The issue specifically mentions "zercher squat or deadlift variant" as alternatives — front squat fits the same category. This can be adjusted during mockup review if the user prefers a different swap.

- [ ] **Step 1: Update the lift arrays**

In `app/(tabs)/progress.tsx`, replace:

```typescript
const COMPACT_LIFTS = [
  { id: 'overhead_press', name: 'Overhead Press' },
  { id: 'weighted_pullup', name: 'Weighted Pull-up' },
  { id: 'zercher_squat', name: 'Zercher Squat' },
  { id: 'romanian_deadlift', name: 'RDL' },
];
```

With:

```typescript
// TODO (#48): Make curated lifts configurable from Settings in a future iteration
const COMPACT_LIFTS = [
  { id: 'overhead_press', name: 'Overhead Press' },
  { id: 'front_squat', name: 'Front Squat' },
  { id: 'zercher_squat', name: 'Zercher Squat' },
  { id: 'romanian_deadlift', name: 'RDL' },
];
```

- [ ] **Step 2: Run tests to verify nothing breaks**

```bash
npm test
```

- [ ] **Step 3: Commit**

```bash
git add app/(tabs)/progress.tsx
git commit -m "feat: swap weighted pull-up for front squat in progress e1RM cards"
```

---

## Workstream Order & Dependencies

```
A0 (exercise library rebuild) ──► A1 (mockup) ──► A2 (DB query) ──► A3 (UI update) ──► B3 (wire add modal)
                                                                                           ▲
                                   B1 (mockup) ──► B2 (DB insert) ────────────────────────┘

                                   C1 (mockup) ──► C2 (DB + migration) ──► C3 (UI)

                                   D1 (standalone — no dependencies)
```

- **A0 is the first task** — rebuilds the exercise library data, which A1/A2/A3 all depend on
- **A and B share a dependency:** B3 wires the add modal into A3's screen
- **C is fully independent** — can be done in parallel with A/B (after A0)
- **D is fully independent** — can be done anytime
- All mockups (A1, B1, C1) must be approved before their implementation tasks

## Notes for the Implementing Agent

1. **Mockup-first is mandatory.** Per CLAUDE.md: "Never skip straight to code without a visual reference." Create the mockup, open it, and wait for approval.
2. **Branch strategy:** Create a single feature branch `48-exercise-repository` from main. All workstreams commit to this branch.
3. **Migration safety:** The v12 migration uses `CREATE TABLE IF NOT EXISTS` — safe to re-run. The `exercise_resources` table is new, no data migration needed.
4. **DB + Library merge:** The `exercises` table only has exercises that have been used in a program or added ad-hoc. `getAllExercises()` must merge DB rows with the in-code `EXERCISE_LIBRARY` to show the full set of known exercises. DB entries take precedence over library entries with the same ID.
5. **Test DB setup:** Follow patterns in existing `__tests__/db/` files for how to initialize the test database. Check `__tests__/db/metrics.test.ts` for examples.
6. **Design tokens:** Never use raw hex values or hardcoded spacing. Import from `src/theme/`.
7. **Expo Crypto:** Use `expo-crypto` for UUID generation (already used elsewhere in the codebase — check `src/db/sessions.ts` for pattern).
8. **clearAllData:** When adding new tables, always update `clearAllData()` in `src/db/database.ts` to include them, respecting foreign key ordering.

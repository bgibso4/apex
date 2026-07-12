# Functional Athlete — Pillars: Program + App Design

**Date:** 2026-07-12
**Status:** Approved in conversation; pending final spec review
**Visual contract:** `docs/mockups/next-program-draft-2026-07-12.html` (interactive; also published as a Claude artifact)
**Supporting docs:** `docs/plans/2026-07-12-next-program-raw-notes.md` (decision log), `docs/plans/2026-07-12-next-program-ben-todo.md` (Ben's open items)

## Overview

A new 11-week program, **Functional Athlete — Pillars**, succeeding Functional Athlete. Goals in priority order: **hip strength & mobility, core strength, bigger/stronger back**. Chest, shoulders, and arms drop to maintenance; foot/ankle work moves mostly to a home protocol.

It ships as a **new bundled program** (new JSON, new `bundled_id`) — not an in-place edit — plus three small app changes: a `focus` chips feature, a legacy-row cleanup migration, and a session-detail bug fix.

## Part 1 — Program content

### Skeleton (identical to Functional Athlete)

| Weeks | Block | Main lifts | RPE |
|---|---|---|---|
| 1-4 | Hypertrophy | 4×8 @ 75/77/79/81% | 6-7 → 8 |
| 5 | Deload | 3×8 @ 65% | 4-5 |
| 6-9 | Strength | 4×5 @ 80/83/85/87% | 7 → 8-9 |
| 10 | Deload | 3×5 @ 70% | 4-5 |
| 11 | Realization | 3×3 @ 90% | 8-9 |

Accessories: fixed rep targets, auto-regulated weight, drop 1 set on deload weeks (same as FA).

Main lifts and 1RM seeds: Back Squat 315 · **Incline Bench Press 265 (new — est. 85% of flat 315, verify week 1)** · Barbell Row 245 · Overhead Press 180 · Zercher Squat 225 · Romanian Deadlift 205. Flat Bench Press is retired from the program (its exercise record and history remain untouched).

### Weekly template

**Saturday — Rest.**

**Sunday — Athletic Power & Conditioning** (warmup: jump rope, full ankle, dynamic)
1. Back Squat — main, %1RM wave
2. Trap Bar Squat → Box Jump — 4×(3+1) @ **225** (3 sets deload); note: hamstring-bias cues (deeper hinge, hips back)
3. **Quad-set** (superset `sunday-circuit`, wave 3/3/4/4/2/4/4/5/5/3/6): SkiErg 250m · Farmer's Carry **60m** @ 88 · KB Swings ×10 @ 88 · **Sprint 80m (new)** — sprint by feel: strides instead if not feeling good; logged by distance
4. Lying Leg Curl — 3×15 @ 100 (alternative: nordic curl — improvised setups documented in Ben's todo)
5. **Core Circuit (new placement)** — 3 rounds, 2-3 exercises
No conditioning finisher — the quad-set is the conditioning.

**Monday — Upper Strength · Heavy Pull** (warmup: jump rope, abbreviated ankle, dynamic)
1. Weighted Pull-up — 3×8 @ +35
2. **Incline Bench Press (new main)** — %1RM wave, seed 265
3. Barbell Row — main, %1RM wave (form audit noted)
4. **Dips, weighted (reused id `dips`)** — 3×8 @ +70 (Ben's chosen start; shoulder-aware ROM)
5. Face Pulls — 3×15 @ 40 (rear-delt contraction fix: lighter, slower, external-rotate at end range)
6. **Tricep superset (moved from Wed)** `monday-tricep`: Pushdown 3×8 @ 60 · Overhead Extension 3×8 @ 45
7. Core Circuit — 3 rounds
Finisher: 5-8 min

**Tuesday — Run + Hips** (warmup **trimmed** to protocols `jump_rope` + `abbreviated_ankle` — the old 18-min `full_ankle_plus_mobility` block is dropped; run happens early)
1. Easy Run — unchanged progression (15 → 25 min, pickups wk 8+)
2. **Copenhagen Plank (new)** — 3 × 20-30s/side (superset `tuesday-hips`); setup TBD in gym (bench vs box, knee-supported first)
3. **Step-Out Squat (new, "Pete's")** — 3 × 6-8/side, light KB (superset `tuesday-hips`); movement dose, not loaded
4. **90/90 Hip IR Lift-offs (new)** — 2 × 8/side, 2s pause; progression: seated → foot on box → weighted
5. Hip Mobility Flow — 5-8 min, **moved to end of session** (includes 90/90 switches + extra left IR)
Removed: standalone BW Cossack (absorbed by step-out).

**Wednesday — Upper Power · Push** (warmup: jump rope, abbreviated ankle, dynamic)
1. **Snatch-Grip High Pull (new, replaces DB Hang High Pull)** — **4×4 @ 155 lb, constant sets/reps/weight for the whole program** (no between-block rep micro-tweaks); deloads 3×4; goes first. Reference points: 135 is easy, ~185 possible with straps; straps optional (probably yes)
2. Overhead Press — main, %1RM wave (shoulder mobility work continues alongside)
3. Superset `wednesday-plyo-lat` (moved up): Plyo Push-up ×5 · Lat Pulldown ×8 @ 125/side — **reps never deload; sets always match across the superset**: 4 sets normal weeks, 2 sets deloads, 3 sets wk 11
4. **Hammer Row (new)** — 3×10/side, auto-reg; chest-supported, no lower-back cost
5. Lateral Raises — 3×10 @ 25
6. **Carry + curls superset (moved from Mon)** `wednesday-carry-curl`: Farmer's Carry 3×**60m** @ 88 · DB Curls **3**×12 @ 35 (set-count fix: was 2)
7. Core Circuit — 3 rounds
Finisher: 5-8 min
Cut: incline burnout (D13), incline DB press (slot absorbed).

**Thursday — Lower Strength & Development** (warmup: jump rope, full ankle, dynamic)
1. Zercher Squat — main, %1RM wave (alt: front squat)
2. Hip Thrust — 3×12 @ **225 floor** (down from 245; 2s squeeze, posterior tilt, no lumbar takeover)
3. **Split Squat (generic — variant TBD, D15)** — 3×8/side, auto-reg
4. Romanian Deadlift — main, %1RM wave
5. Close-Stance Smith Squat — 3×8 @ 225, burnout (hip activation work beside the machine)
6. **Calf Raises (new)** — 3×12, close stance, slow eccentric, pause at stretch
Finisher: row

**Friday — Athletic Lower & Agility** (warmup: jump rope, full ankle, dynamic, agility drills)
1. **One-Foot Lateral Box Jump (new variant)** — 4×3/side (3×2 deloads); revert to standard box jump if it doesn't feel right
2. Landmine Explosive Row — 3×12 @ 45 plate, superset `friday-landmine` with **Landmine Rotations (new, provisional)** — 2×8/side; may be removed after trial
3. Cossack Squat — 3×8/side @ 50, **strength focus: progress the load**
4. Hip Abduction — 3×12 @ 120
5. Hip Adduction — 3×12 @ 110
6. Pogo Hops — 3×15

### Exercise definitions — reuse existing ids where they exist

The in-code exercise library (`src/data/exercise-library.ts`) and DB `exercises` table already contain several of these movements. Reusing their ids links any existing ad-hoc logs into the program's history and keeps the exercise picker deduplicated. Program import upserts name/type/input_fields for reused ids.

**Reused ids:**

| id | name (after upsert) | notes |
|---|---|---|
| `incline_bench_bb` | Incline Bench Press | promoted to `main`, `uses_1rm`, `one_rm: 265` (renamed from "Incline Bench - BB") |
| `dips` | Dips | input gains weight field (added load) alongside reps; program prescribes +70 |
| `hammer_row` | Hammer Row | as-is |
| `bulgarian_split_squat` | Bulgarian Split Squat | fills the generic split-squat slot until D15 picks a variant (keeps trend continuity with FA); a different variant later gets its own id at that point |
| `standing_calf_raises` | Standing Calf Raises | close stance is a slot note |

**Genuinely new ids:**

| id | name | type | notes |
|---|---|---|---|
| `snatch_grip_high_pull` | Snatch-Grip High Pull | power | upper_back, traps, rear_delts, glutes |
| `copenhagen_plank` | Copenhagen Plank | movement | input: duration; adductors + core |
| `step_out_squat` | Step-Out Squat | movement | adductors, hip stabilizers, quads |
| `hip_ir_liftoff` | 90/90 Hip IR Lift-off | movement | input: reps |
| `sprints` | Sprints | conditioning | input: distance (m) |
| `landmine_rotation` | Landmine Rotation | core | input: reps |
| `box_jump_lateral` | One-Foot Lateral Box Jump | power | alternatives: `box_jump` |

Program metadata: `id: "functional-athlete-pillars"`, `name: "Functional Athlete — Pillars"`, `duration_weeks: 11`, **`focus: ["hips", "core", "back"]`** (new optional field).

## Part 2 — App changes

### 2.1 New bundled program (Approach B — decided)

- New file `src/data/functional-athlete-pillars.json`.
- Introduce a bundled-program registry (e.g., `BUNDLED_PROGRAMS` array exported from `src/data/`), consumed by both `app/_layout.tsx` (refresh loop) and `app/library.tsx` (auto-import loop). Replaces the single `FA_V2` import (alias retired).
- `refreshBundledProgram` and `importProgram` are already generic — no logic changes expected, just iteration.
- Downstream safety (verified in codebase exploration): sessions/set_logs snapshot at log time; 1RM trends are exercise-scoped so squat/row/OHP/Zercher/RDL trends continue across programs automatically, bench pauses, incline starts fresh. Activating Pillars archives the current FA run via existing `activateProgram` behavior (or FA completes normally first). Old FA remains restartable from the library under its own `bundled_id`.
- Renaming a program later is safe as long as `bundled_id` never changes (refresh matches `bundled_id` first).

### 2.2 Focus chips (small feature)

- Add optional `focus?: string[]` to `ProgramDefinition` (`src/types/program.ts`).
- Render as small uppercase chips (theme tokens; visual reference = the mock's header chips) on: library program card, home dashboard program card. Programs without `focus` render no chips.

### 2.3 Cleanup migration (schema v16)

- Archive legacy pre-launch rows: `UPDATE programs SET status='archived' WHERE name='Functional Athlete v2' AND bundled_id IS NULL AND status IN ('active','inactive')`.
- Rationale: that row holds the obsolete 12-week draft, can't be matched by the launch refresh (no bundled_id, name mismatch), and is currently activatable by accident. Archiving (not deleting) keeps it and any attached sessions recoverable.

### 2.4 Session-detail bug fix

- `app/session/[id].tsx` resolves block name, session name backfill, and superset grouping from `getActiveProgram()`. Change to resolve from the session's own `program_id` (fetch that program row's `definition_json`). Without this, past FA sessions would display Pillars' labels once Pillars is active.

### Non-goals

- No program versioning tables or in-app program editor (revisit if program iteration becomes frequent).
- No changes to completed/archived program data, metrics math, or the workout logging flow.
- No deletion of retired exercises (bench press etc. remain in the exercise library and history).

## Deferred / open items (tracked in Ben's todo doc)

- D15 split squat variant; D14 line-by-line audit of the final JSON (Ben reviews before activation); per-day core circuit menus; Copenhagen setup; incline 1RM verification in week 1; landmine rotations keep/cut review; nordic curl slot-in.

## Testing (TDD)

- **Unit — migration v16:** legacy v2 row (no bundled_id, inactive) → archived; row with bundled_id or completed status untouched; sessions attached to archived row still visible in history.
- **Unit — bundled registry:** both programs refresh on launch; both auto-import into library; catalog shows FA and Pillars as separate entries when a legacy row exists.
- **Unit — definition:** `functional-athlete-pillars.json` parses against `ProgramDefinition`, every exercise slot's id exists in `exercise_definitions`, every week 1-11 has a target for every non-optional slot, superset groups pair correctly.
- **Component — focus chips:** rendered from `focus`, absent when field missing.
- **Regression — session detail:** session labels resolve from the session's own program when a different program is active.
- Full suite green before completion; E2E flows (start/log/finish) re-run against the new program.

# Program Completion — Design Spec

**Issue:** [#62 — Graceful program completion + celebration animation](https://github.com/bgibso4/apex/issues/62)
**Date:** 2026-06-07
**Status:** Approved — ready for implementation plan

## Problem

APEX has no concept of a program *ending*. The current week is derived purely from calendar time since `activated_date` (`getCurrentWeek()` in `src/utils/program.ts`), clamped at a hardcoded `12`. Once 11+ weeks of wall-clock pass, the Home header overflows to **"Week 12 of 11 — Unknown Block"** (`getBlockForWeek()` returns `undefined`). Finishing a program produces no acknowledgement, no celebration, and no clean end state.

## Goals

- Detect when a program's training is finished and mark it complete.
- Celebrate the moment the final workout is logged (premium, on-brand).
- Present a program summary leading with the strength story and named PRs.
- Replace the broken "Week 12 of 11" header with a graceful post-completion Home state.
- Retroactively celebrate the user's already-finished program on first launch after this ships.

## Non-Goals (out of scope)

- **Ad-hoc / off-program logging** — training between programs is [#71](https://github.com/bgibso4/apex/issues/71).
- **Full program overview / "what's scheduled ahead"** — [#64](https://github.com/bgibso4/apex/issues/64).
- **Curated-lift configuration from Settings** — [#48]; the summary derives its lifts from the program (see Summary), independent of the Progress screen's hardcoded list.
- Repeat-program / program editing flows.

## Mockups (source of truth)

Locked, self-contained HTML in `docs/mockups/`:

- `program-complete-celebration-2026-06-07.html` — full-screen celebration (firework burst behind trophy).
- `program-complete-summary-2026-06-07.html` — program summary (strength gains + PRs).
- `program-complete-home-2026-06-07.html` — post-completion Home ("quiet luxury" completed card).

## User Flow

```
Final set of the final training day logged
  └─ finishSession() → completeSession() persists the set
       └─ completion detected
            ├─ program.status: 'active' → 'completed'  (+ completed_date, completion_seen=0)
            └─ Celebration (full-screen takeover)
                 └─ Program Summary (stats · strength gains · PRs · "Start a new program")
                      └─ Home shows the completed card until a new program is activated
```

## Design Detail

### 1. Completion detection

A program is complete when the **just-completed session is the last training day of the final week**:

- `session.week_number >= program.duration_weeks`, **and**
- the session's scheduled day is the **last non-rest day** of `weekly_template` in `DAY_ORDER` (rest days trimmed via the existing `getTrainingDays()`).

The `>=` (rather than `===`) keeps detection robust against rows created under the old hardcoded max-12 clamp and against behind-schedule users whose calendar week reached the final week.

Skipped earlier sessions do **not** block completion (per the "final session logged" decision). The check runs in `finishSession()` (`src/hooks/useWorkoutSession.ts`) immediately after `await completeSession(sessionId)` returns.

New pure helper (unit-testable, no DB):

```
isFinalTrainingSession(definition, weekNumber, scheduledDay): boolean
```

### 2. Week-tracking fix (the "Week 12 of 11" fix)

`getCurrentWeek()` returns calendar weeks since `activated_date` clamped to a hardcoded `12`. Change it to clamp to the program's own `duration_weeks` (passed in): `max(1, min(weeksSinceActivation, durationWeeks))`. The current week then can never exceed the program length, so `getBlockForWeek()` always resolves and "Unknown Block" cannot appear. Once a program completes, Home stops rendering the week/block header entirely (it shows the completed card).

The existing `getCurrentWeek()` test asserting "clamp to max 12" is updated to assert clamping to the passed `durationWeeks`.

> Completion is detected independently of the displayed week (§1), so a behind-schedule user (calendar past the final week) both caps at "Week N of N" and completes correctly when they log the final training day. The one case the calendar-derived week can lag is a user who compresses the program well ahead of schedule — acceptable for v1.

### 3. State model

Reuse the existing `programs.status` lifecycle (`'inactive' | 'active' | 'completed'`). Migration adds two columns:

- `completed_date TEXT` — local date the program was completed.
- `completion_seen INTEGER NOT NULL DEFAULT 0` — ensures the celebration fires exactly once.

Completion writes `status='completed'`, `completed_date=<today>`, `completion_seen=0`. After the celebration is shown, set `completion_seen=1`. Completed programs remain queryable for history (already supported by `getAllPrograms` / `status='completed'`).

> Note: `activateProgram()` already flips a prior `'active'` program to `'completed'` when a new one is activated. That path should set `completion_seen=1` (no retroactive celebration for a program abandoned by starting another) and a `completed_date`.

### 4. Backfill (the user's current program)

On app launch, detect any `'active'` program whose final training session is **already logged** (same rule as §1, evaluated against completed sessions). If found:

- flip it to `completed` with `completion_seen=0`,
- the celebration fires once on next Home/Workout entry, then `completion_seen=1`.

This delivers the moment for the just-finished Functional Athlete program. Runs once; idempotent (guarded by status + `completion_seen`).

### 5. Celebration (full-screen takeover)

Per `program-complete-celebration-2026-06-07.html`:

- Firework burst (spark particles + flash + shockwave) behind a trophy core that stamps in (`react-native-reanimated`, matching `SplashScreen.tsx` patterns).
- Real APEX wordmark at top; "Program Complete" / program name / `11 weeks · 38 sessions · 6 PRs`.
- Success haptic on entry (`Haptics.notificationAsync(Success)` — already used in `finishSession`).
- Dismiss → Program Summary. Respects reduced-motion (static end-state if motion is disabled).

### 6. Program Summary

Per `program-complete-summary-2026-06-07.html`. Sections:

- **Header** — trophy, program name, date range, weeks.
- **Stat trio** — Sessions · **Adherence** · PRs. (Adherence over raw counts, per the no-vanity-metrics tenet.)
- **Strength Gains (est. 1RM) — main lifts only.** Lifts are derived from the completed program: exercises with `category: 'main'` that are e1RM-trackable and have ≥2 non-deload data points in the program. Each row shows start → end e1RM and the delta, computed with the existing `getDeltaExcludingDeload()` (excludes deload weeks). Optional "show all tracked lifts" expander (future).
- **Personal Records** — named PR list (exercise, weight × reps, week, e1RM) from `src/db/personal-records.ts`.
- **CTA** — "Start a new program" (→ Library) primary; "Back to Home" secondary.

The summary is reachable later via "View full summary" on the completed Home card.

### 7. Post-completion Home

Per `program-complete-home-2026-06-07.html`. When the most recent program is `completed` and none is `active`, Home replaces the program-context header + today's-training card with the **completed card**:

- gold "✓ COMPLETED" label + thin gold top accent,
- program name (hero), date range · weeks,
- two stats, generous gap: **`6 PRs`   `95% Adherence`** (Option 3 layout),
- "View full summary →",
- "Start a new program" as the primary forward action.

Health bar (compact text bar) and month calendar are unchanged. Activating a new program returns Home to its normal active layout.

### 8. Adherence metric

**Adherence = training adherence** = completed scheduled sessions ÷ total scheduled training sessions for the program (use/extend `getTrainingConsistency`). Shown on both the summary stat trio and the Home completed card. (Protocol adherence — hitting prescribed sets/reps/loads — remains available but is not surfaced here.)

### 9. Design tokens

Add a semantic **achievement/gold** accent token (mockups use `#f0b429`; reconcile with existing `Colors.amber`). No raw hex in components, per the tokens tenet. Green deltas reuse `Colors.green`.

## Edge Cases

- **Skipped earlier sessions** — completion still fires on the final training day (by design).
- **Final week is a deload** — not the case for Functional Athlete (Realization is last), but the rule keys off `duration_weeks` + last training day, so it holds regardless.
- **Malformed template / no training days** — detection returns false; program stays active (fail safe, no false celebration).
- **Re-entering a completed program / extra sessions** — program remains `completed`; no re-celebration (`completion_seen=1`).
- **Backfill idempotency** — guarded by `status` + `completion_seen`; runs at most once per program.

## Testing (TDD)

- **Unit** — `isFinalTrainingSession()` across templates (trailing rest days, mid-week last day, skipped days); progress-based `getCurrentWeek()` (no overflow past `duration_weeks`); backfill detection; main-lift gains selection + `getDeltaExcludingDeload`; adherence calc.
- **Update existing** — `__tests__/utils/program.test.ts` week-clamp test (max-12 → `duration_weeks`).
- **Component** — celebration fires exactly once on final completion; completed Home card renders for completed-no-active state.
- **E2E** — finish-workout flow stays green; add: completing the final session reaches the celebration.

## Affected Code

| Area | File(s) |
|------|---------|
| Detection + finish hook | `src/hooks/useWorkoutSession.ts` (`finishSession`) |
| Completion / DB writes | `src/db/sessions.ts`, `src/db/programs.ts`, `src/db/schema.ts` (+ migration) |
| Week / block logic | `src/utils/program.ts` (`getCurrentWeek`, helpers) |
| Summary data | `src/db/metrics.ts`, `src/db/personal-records.ts`, `src/utils/deltaCalculation.ts` |
| Adherence | `src/db/metrics.ts` (`getTrainingConsistency`) |
| Home | `app/(tabs)/index.tsx` |
| New UI | celebration component, program summary screen, completed Home card |
| Tokens | `src/theme/colors.ts` (achievement/gold) |
| Tests | `__tests__/utils/`, `__tests__/db/`, component + E2E |

## Open Questions

None blocking. Confirm whether the summary's "Strength Gains" expander ("show all tracked lifts") ships in v1 or is deferred.

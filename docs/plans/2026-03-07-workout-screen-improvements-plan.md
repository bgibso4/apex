# Workout Screen Improvements — Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Comprehensive upgrade to the workout screen: session timer, PR detection, per-exercise notes, enhanced summary with edit/delete, session restore, animations, and various UX fixes.

**Architecture:** Schema additions (exercise_notes, personal_records tables, sessions.notes column already exists) + DB layer functions + hook enhancements + component updates. TDD throughout. Each task is independently testable.

**Tech Stack:** TypeScript, React Native, expo-sqlite, react-native-reanimated, Jest + @testing-library/react-native

---

### Task 1: Updated Mockup

**Files:**
- Create: `docs/mockups/workout-screen-2026-03-07.html`

**Step 1: Create updated mockup**

Copy `docs/mockups/workout-screen.html` as a starting point and update it to reflect all the design changes. The mockup should show these states:

1. **Day Selection** — same as current but ensure title sizing matches the design
2. **Rest Day** — moon icon, "Rest Day" message, "Next workout: [Day] — [Template Name]" card below
3. **Warmup** — same as current but with timer in header
4. **Exercise Logging (mid-workout)** — updated header with screen-title-sized workout name, "Week X — Block" subtitle, right-aligned timer. Progress bar shows both "2 of 6 exercises" (left) and "8 / 22 sets" (right). "+ Add exercise" link below. Exercise cards include "+ Add note" link. Show the pinned finish button at the bottom (outside scroll area).
5. **Exercise Logging (with note open)** — show an exercise card with the note text field expanded and some text entered
6. **Summary** — stat grid with Duration, Sets, Total Volume, PRs (amber). PR detail cards below. Exercise breakdown with notes shown. Session notes at bottom. Edit button top right.
7. **Summary (edit mode)** — values shown as editable, "Save" replaces "Edit", red "Delete Workout" link at very bottom.

Each state is a separate phone mockup. Use the same phone frame, dynamic island, status bar, and tab bar styling from the existing mockup. Match the design tokens (colors, spacing, font sizes) from `src/theme/colors.ts` and `src/theme/spacing.ts`.

Note: Animations can't be shown in static HTML but document them in HTML comments.

**Step 2: Open for review**

```bash
open docs/mockups/workout-screen-2026-03-07.html
```

**IMPORTANT:** Wait for explicit user approval before proceeding to any implementation tasks. Do not continue until the mockup is approved.

**Step 3: Commit**

```bash
git add docs/mockups/workout-screen-2026-03-07.html
git commit -m "Add updated workout screen mockup reflecting all improvements"
```

---

### Task 2: Schema — Add exercise_notes and personal_records tables

**Files:**
- Modify: `src/db/schema.ts`
- Modify: `src/db/database.ts` (migration logic)

**Step 1: Update schema.ts**

Add two new tables to `CREATE_TABLES` and bump `SCHEMA_VERSION` to 4:

```typescript
// In schema.ts, update:
export const SCHEMA_VERSION = 4;

// Add to CREATE_TABLES string, before the indexes section:

-- Exercise-level notes (per exercise per session)
CREATE TABLE IF NOT EXISTS exercise_notes (
  id TEXT PRIMARY KEY,
  session_id TEXT NOT NULL,
  exercise_id TEXT NOT NULL,
  note TEXT NOT NULL DEFAULT '',
  created_at TEXT NOT NULL,
  FOREIGN KEY (session_id) REFERENCES sessions(id) ON DELETE CASCADE,
  UNIQUE(session_id, exercise_id)
);

-- Personal records (e1RM and rep bests)
CREATE TABLE IF NOT EXISTS personal_records (
  id TEXT PRIMARY KEY,
  exercise_id TEXT NOT NULL,
  record_type TEXT NOT NULL,
  rep_count INTEGER,
  value REAL NOT NULL,
  previous_value REAL,
  session_id TEXT NOT NULL,
  date TEXT NOT NULL,
  FOREIGN KEY (exercise_id) REFERENCES exercises(id),
  FOREIGN KEY (session_id) REFERENCES sessions(id) ON DELETE CASCADE
);

-- Add indexes:
CREATE INDEX IF NOT EXISTS idx_exercise_notes_session ON exercise_notes(session_id);
CREATE INDEX IF NOT EXISTS idx_personal_records_exercise ON personal_records(exercise_id, record_type, rep_count);
CREATE INDEX IF NOT EXISTS idx_personal_records_session ON personal_records(session_id);
```

**Step 2: Add migration in database.ts**

In the version check block in `getDatabase()`, add a migration for version 3→4:

```typescript
if (currentVersion < 4) {
  await db.execAsync(`
    CREATE TABLE IF NOT EXISTS exercise_notes (
      id TEXT PRIMARY KEY,
      session_id TEXT NOT NULL,
      exercise_id TEXT NOT NULL,
      note TEXT NOT NULL DEFAULT '',
      created_at TEXT NOT NULL,
      FOREIGN KEY (session_id) REFERENCES sessions(id) ON DELETE CASCADE,
      UNIQUE(session_id, exercise_id)
    );
    CREATE TABLE IF NOT EXISTS personal_records (
      id TEXT PRIMARY KEY,
      exercise_id TEXT NOT NULL,
      record_type TEXT NOT NULL,
      rep_count INTEGER,
      value REAL NOT NULL,
      previous_value REAL,
      session_id TEXT NOT NULL,
      date TEXT NOT NULL,
      FOREIGN KEY (exercise_id) REFERENCES exercises(id),
      FOREIGN KEY (session_id) REFERENCES sessions(id) ON DELETE CASCADE
    );
    CREATE INDEX IF NOT EXISTS idx_exercise_notes_session ON exercise_notes(session_id);
    CREATE INDEX IF NOT EXISTS idx_personal_records_exercise ON personal_records(exercise_id, record_type, rep_count);
    CREATE INDEX IF NOT EXISTS idx_personal_records_session ON personal_records(session_id);
  `);
}
```

**Step 3: Commit**

```bash
git add src/db/schema.ts src/db/database.ts
git commit -m "Add exercise_notes and personal_records tables (schema v4)"
```

---

### Task 3: DB Layer — Exercise notes CRUD

**Files:**
- Create: `src/db/notes.ts`
- Modify: `src/db/index.ts` (re-export)
- Create: `__tests__/db/notes.test.ts`

**Step 1: Write failing tests**

```typescript
// __tests__/db/notes.test.ts
import { getDatabase, generateId } from '../../src/db/database';
import {
  saveExerciseNote,
  getExerciseNotesForSession,
  deleteExerciseNote,
} from '../../src/db/notes';

jest.mock('../../src/db/database', () => ({
  getDatabase: jest.fn(),
  generateId: jest.fn(() => 'note-id-123'),
}));

function createMockDb() {
  return {
    runAsync: jest.fn().mockResolvedValue({ changes: 1 }),
    getFirstAsync: jest.fn().mockResolvedValue(null),
    getAllAsync: jest.fn().mockResolvedValue([]),
  };
}

describe('exercise notes', () => {
  let mockDb: ReturnType<typeof createMockDb>;

  beforeEach(() => {
    jest.clearAllMocks();
    mockDb = createMockDb();
    (getDatabase as jest.Mock).mockResolvedValue(mockDb);
  });

  describe('saveExerciseNote', () => {
    it('upserts a note for a session+exercise pair', async () => {
      await saveExerciseNote('session-1', 'bench_press', 'Left shoulder tight');
      expect(mockDb.runAsync).toHaveBeenCalledWith(
        expect.stringContaining('INSERT OR REPLACE'),
        expect.arrayContaining(['session-1', 'bench_press', 'Left shoulder tight'])
      );
    });
  });

  describe('getExerciseNotesForSession', () => {
    it('returns all notes for a session keyed by exercise_id', async () => {
      mockDb.getAllAsync.mockResolvedValue([
        { exercise_id: 'bench_press', note: 'Shoulder tight' },
        { exercise_id: 'squat', note: 'Felt strong' },
      ]);
      const result = await getExerciseNotesForSession('session-1');
      expect(result).toEqual({
        bench_press: 'Shoulder tight',
        squat: 'Felt strong',
      });
    });

    it('returns empty object when no notes exist', async () => {
      const result = await getExerciseNotesForSession('session-1');
      expect(result).toEqual({});
    });
  });

  describe('deleteExerciseNote', () => {
    it('deletes a note by session and exercise', async () => {
      await deleteExerciseNote('session-1', 'bench_press');
      expect(mockDb.runAsync).toHaveBeenCalledWith(
        expect.stringContaining('DELETE'),
        ['session-1', 'bench_press']
      );
    });
  });
});
```

**Step 2: Run tests to verify they fail**

Run: `npx jest __tests__/db/notes.test.ts --no-coverage`
Expected: FAIL — module not found

**Step 3: Implement src/db/notes.ts**

```typescript
import { getDatabase, generateId } from './database';

/** Upsert a note for an exercise in a session */
export async function saveExerciseNote(
  sessionId: string,
  exerciseId: string,
  note: string
): Promise<void> {
  const db = await getDatabase();
  const id = generateId();
  await db.runAsync(
    `INSERT OR REPLACE INTO exercise_notes (id, session_id, exercise_id, note, created_at)
     VALUES (
       COALESCE((SELECT id FROM exercise_notes WHERE session_id = ? AND exercise_id = ?), ?),
       ?, ?, ?, datetime('now')
     )`,
    [sessionId, exerciseId, id, sessionId, exerciseId, note]
  );
}

/** Get all exercise notes for a session, keyed by exercise_id */
export async function getExerciseNotesForSession(
  sessionId: string
): Promise<Record<string, string>> {
  const db = await getDatabase();
  const rows = await db.getAllAsync<{ exercise_id: string; note: string }>(
    'SELECT exercise_id, note FROM exercise_notes WHERE session_id = ?',
    [sessionId]
  );
  const map: Record<string, string> = {};
  for (const row of rows) {
    map[row.exercise_id] = row.note;
  }
  return map;
}

/** Delete a note for an exercise in a session */
export async function deleteExerciseNote(
  sessionId: string,
  exerciseId: string
): Promise<void> {
  const db = await getDatabase();
  await db.runAsync(
    'DELETE FROM exercise_notes WHERE session_id = ? AND exercise_id = ?',
    [sessionId, exerciseId]
  );
}
```

**Step 4: Add re-exports in src/db/index.ts**

```typescript
export { saveExerciseNote, getExerciseNotesForSession, deleteExerciseNote } from './notes';
```

**Step 5: Run tests to verify they pass**

Run: `npx jest __tests__/db/notes.test.ts --no-coverage`
Expected: PASS

**Step 6: Commit**

```bash
git add src/db/notes.ts src/db/index.ts __tests__/db/notes.test.ts
git commit -m "Add exercise notes CRUD (per-exercise per-session)"
```

---

### Task 4: DB Layer — PR detection and storage

**Files:**
- Create: `src/db/personal-records.ts`
- Modify: `src/db/index.ts` (re-export)
- Create: `__tests__/db/personal-records.test.ts`

**Step 1: Write failing tests**

```typescript
// __tests__/db/personal-records.test.ts
import { getDatabase, generateId } from '../../src/db/database';
import { calculateEpley } from '../../src/db/metrics';
import {
  detectPRs,
  getPRsForSession,
  getExercisePRHistory,
} from '../../src/db/personal-records';

jest.mock('../../src/db/database', () => ({
  getDatabase: jest.fn(),
  generateId: jest.fn(() => 'pr-id-123'),
}));

function createMockDb() {
  return {
    runAsync: jest.fn().mockResolvedValue({ changes: 1 }),
    getFirstAsync: jest.fn().mockResolvedValue(null),
    getAllAsync: jest.fn().mockResolvedValue([]),
  };
}

describe('personal records', () => {
  let mockDb: ReturnType<typeof createMockDb>;

  beforeEach(() => {
    jest.clearAllMocks();
    mockDb = createMockDb();
    (getDatabase as jest.Mock).mockResolvedValue(mockDb);
  });

  describe('detectPRs', () => {
    const PR_REP_COUNTS = [1, 3, 5, 8, 12, 15];

    it('detects an e1RM PR when new e1RM exceeds previous best', async () => {
      // Session sets: 225 lbs × 5 reps → e1RM = 263
      const sessionSets = [
        { exercise_id: 'bench_press', actual_weight: 225, actual_reps: 5, status: 'completed' as const },
      ];
      // No previous e1RM record
      mockDb.getFirstAsync.mockResolvedValue(null);

      const prs = await detectPRs('session-1', '2026-03-07', sessionSets);

      expect(prs.length).toBeGreaterThanOrEqual(1);
      expect(prs).toContainEqual(expect.objectContaining({
        exercise_id: 'bench_press',
        record_type: 'e1rm',
        value: calculateEpley(225, 5),
      }));
    });

    it('does not detect e1RM PR when below previous best', async () => {
      const sessionSets = [
        { exercise_id: 'bench_press', actual_weight: 200, actual_reps: 5, status: 'completed' as const },
      ];
      // Previous e1RM was 263
      mockDb.getFirstAsync.mockResolvedValue({ value: 263 });

      const prs = await detectPRs('session-1', '2026-03-07', sessionSets);

      const e1rmPRs = prs.filter(p => p.record_type === 'e1rm' && p.exercise_id === 'bench_press');
      expect(e1rmPRs).toHaveLength(0);
    });

    it('detects rep PR at tracked rep counts', async () => {
      const sessionSets = [
        { exercise_id: 'squat', actual_weight: 225, actual_reps: 5, status: 'completed' as const },
      ];
      // No previous rep best at 5 reps
      mockDb.getFirstAsync.mockResolvedValue(null);

      const prs = await detectPRs('session-1', '2026-03-07', sessionSets);

      expect(prs).toContainEqual(expect.objectContaining({
        exercise_id: 'squat',
        record_type: 'rep_best',
        rep_count: 5,
        value: 225,
      }));
    });

    it('ignores rep counts not in tracked list', async () => {
      const sessionSets = [
        { exercise_id: 'squat', actual_weight: 225, actual_reps: 7, status: 'completed' as const },
      ];
      mockDb.getFirstAsync.mockResolvedValue(null);

      const prs = await detectPRs('session-1', '2026-03-07', sessionSets);

      const repPRs = prs.filter(p => p.record_type === 'rep_best');
      expect(repPRs).toHaveLength(0);
    });

    it('skips sets with zero weight or reps', async () => {
      const sessionSets = [
        { exercise_id: 'pushups', actual_weight: 0, actual_reps: 15, status: 'completed' as const },
      ];
      mockDb.getFirstAsync.mockResolvedValue(null);

      const prs = await detectPRs('session-1', '2026-03-07', sessionSets);

      expect(prs).toHaveLength(0);
    });
  });

  describe('getPRsForSession', () => {
    it('returns all PRs for a given session', async () => {
      mockDb.getAllAsync.mockResolvedValue([
        {
          id: 'pr-1', exercise_id: 'bench_press', record_type: 'e1rm',
          rep_count: null, value: 263, previous_value: 250,
          session_id: 'session-1', date: '2026-03-07',
          exercise_name: 'Bench Press',
        },
      ]);

      const prs = await getPRsForSession('session-1');
      expect(prs).toHaveLength(1);
      expect(prs[0].exercise_id).toBe('bench_press');
    });
  });
});
```

**Step 2: Run tests to verify they fail**

Run: `npx jest __tests__/db/personal-records.test.ts --no-coverage`
Expected: FAIL — module not found

**Step 3: Implement src/db/personal-records.ts**

```typescript
import { getDatabase, generateId } from './database';
import { calculateEpley } from './metrics';

/** Rep counts we track for rep PRs */
export const PR_REP_COUNTS = [1, 3, 5, 8, 12, 15] as const;

export interface PRRecord {
  id: string;
  exercise_id: string;
  record_type: 'e1rm' | 'rep_best';
  rep_count: number | null;
  value: number;
  previous_value: number | null;
  session_id: string;
  date: string;
  exercise_name?: string;
}

interface SessionSet {
  exercise_id: string;
  actual_weight: number;
  actual_reps: number;
  status: string;
}

/**
 * Detect and save PRs for a completed session.
 * Returns the list of new PRs found.
 */
export async function detectPRs(
  sessionId: string,
  date: string,
  sessionSets: SessionSet[]
): Promise<PRRecord[]> {
  const db = await getDatabase();
  const newPRs: PRRecord[] = [];

  // Group sets by exercise
  const byExercise = new Map<string, SessionSet[]>();
  for (const set of sessionSets) {
    if (set.status !== 'completed' && set.status !== 'completed_below') continue;
    if (set.actual_weight <= 0 || set.actual_reps <= 0) continue;
    const existing = byExercise.get(set.exercise_id) ?? [];
    existing.push(set);
    byExercise.set(set.exercise_id, existing);
  }

  for (const [exerciseId, sets] of byExercise) {
    // --- e1RM PR ---
    let bestE1rm = 0;
    for (const set of sets) {
      const e1rm = calculateEpley(set.actual_weight, set.actual_reps);
      if (e1rm > bestE1rm) bestE1rm = e1rm;
    }

    if (bestE1rm > 0) {
      const previousBest = await db.getFirstAsync<{ value: number }>(
        `SELECT value FROM personal_records
         WHERE exercise_id = ? AND record_type = 'e1rm'
         ORDER BY value DESC LIMIT 1`,
        [exerciseId]
      );

      if (!previousBest || bestE1rm > previousBest.value) {
        const pr: PRRecord = {
          id: generateId(),
          exercise_id: exerciseId,
          record_type: 'e1rm',
          rep_count: null,
          value: bestE1rm,
          previous_value: previousBest?.value ?? null,
          session_id: sessionId,
          date,
        };
        newPRs.push(pr);
      }
    }

    // --- Rep PRs ---
    for (const repCount of PR_REP_COUNTS) {
      const matchingSets = sets.filter(s => s.actual_reps === repCount);
      if (matchingSets.length === 0) continue;

      const bestWeight = Math.max(...matchingSets.map(s => s.actual_weight));

      const previousBest = await db.getFirstAsync<{ value: number }>(
        `SELECT value FROM personal_records
         WHERE exercise_id = ? AND record_type = 'rep_best' AND rep_count = ?
         ORDER BY value DESC LIMIT 1`,
        [exerciseId, repCount]
      );

      if (!previousBest || bestWeight > previousBest.value) {
        const pr: PRRecord = {
          id: generateId(),
          exercise_id: exerciseId,
          record_type: 'rep_best',
          rep_count: repCount,
          value: bestWeight,
          previous_value: previousBest?.value ?? null,
          session_id: sessionId,
          date,
        };
        newPRs.push(pr);
      }
    }
  }

  // Save all new PRs
  for (const pr of newPRs) {
    await db.runAsync(
      `INSERT INTO personal_records (id, exercise_id, record_type, rep_count, value, previous_value, session_id, date)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [pr.id, pr.exercise_id, pr.record_type, pr.rep_count, pr.value, pr.previous_value, pr.session_id, pr.date]
    );
  }

  return newPRs;
}

/** Get all PRs for a session (with exercise names) */
export async function getPRsForSession(sessionId: string): Promise<PRRecord[]> {
  const db = await getDatabase();
  return db.getAllAsync<PRRecord>(
    `SELECT pr.*, e.name as exercise_name
     FROM personal_records pr
     LEFT JOIN exercises e ON e.id = pr.exercise_id
     WHERE pr.session_id = ?
     ORDER BY pr.record_type, pr.exercise_id`,
    [sessionId]
  );
}

/** Delete all PRs for a session (used when deleting a workout) */
export async function deletePRsForSession(sessionId: string): Promise<void> {
  const db = await getDatabase();
  await db.runAsync('DELETE FROM personal_records WHERE session_id = ?', [sessionId]);
}
```

**Step 4: Add re-exports in src/db/index.ts**

```typescript
export { detectPRs, getPRsForSession, deletePRsForSession, PR_REP_COUNTS } from './personal-records';
export type { PRRecord } from './personal-records';
```

**Step 5: Run tests to verify they pass**

Run: `npx jest __tests__/db/personal-records.test.ts --no-coverage`
Expected: PASS

**Step 6: Commit**

```bash
git add src/db/personal-records.ts src/db/index.ts __tests__/db/personal-records.test.ts
git commit -m "Add PR detection and storage (e1RM + rep bests)"
```

---

### Task 5: DB Layer — Session delete + in-progress session query

**Files:**
- Modify: `src/db/sessions.ts`
- Modify: `src/db/index.ts` (re-export)
- Modify: `__tests__/db/sessions.test.ts`

**Step 1: Write failing tests**

Add to `__tests__/db/sessions.test.ts`:

```typescript
describe('deleteSession', () => {
  it('deletes session and cascaded data', async () => {
    await deleteSession('session-1');
    // Should delete set_logs, exercise_notes, personal_records, then the session
    expect(mockDb.runAsync).toHaveBeenCalledTimes(4);
    expect(mockDb.runAsync).toHaveBeenCalledWith(
      expect.stringContaining('DELETE FROM sessions'),
      ['session-1']
    );
  });
});

describe('getInProgressSession', () => {
  it('returns session with started_at but no completed_at', async () => {
    mockDb.getFirstAsync.mockResolvedValue({
      id: 'session-1',
      program_id: 'prog-1',
      started_at: '2026-03-07T06:00:00Z',
      completed_at: null,
    });
    const result = await getInProgressSession('prog-1');
    expect(result).not.toBeNull();
    expect(result?.id).toBe('session-1');
  });

  it('returns null when no in-progress session exists', async () => {
    const result = await getInProgressSession('prog-1');
    expect(result).toBeNull();
  });
});
```

**Step 2: Run tests to verify they fail**

Run: `npx jest __tests__/db/sessions.test.ts --no-coverage`
Expected: FAIL — functions not found

**Step 3: Add functions to src/db/sessions.ts**

```typescript
/** Delete a session and all related data */
export async function deleteSession(sessionId: string): Promise<void> {
  const db = await getDatabase();
  await db.runAsync('DELETE FROM set_logs WHERE session_id = ?', [sessionId]);
  await db.runAsync('DELETE FROM exercise_notes WHERE session_id = ?', [sessionId]);
  await db.runAsync('DELETE FROM personal_records WHERE session_id = ?', [sessionId]);
  await db.runAsync('DELETE FROM sessions WHERE id = ?', [sessionId]);
}

/** Get an in-progress session (started but not completed) for a program */
export async function getInProgressSession(
  programId: string
): Promise<Session | null> {
  const db = await getDatabase();
  return db.getFirstAsync<Session>(
    `SELECT * FROM sessions
     WHERE program_id = ? AND started_at IS NOT NULL AND completed_at IS NULL
     ORDER BY started_at DESC LIMIT 1`,
    [programId]
  );
}
```

**Step 4: Add re-exports in src/db/index.ts**

Add `deleteSession` and `getInProgressSession` to the sessions re-export line.

**Step 5: Run tests to verify they pass**

Run: `npx jest __tests__/db/sessions.test.ts --no-coverage`
Expected: PASS

**Step 6: Commit**

```bash
git add src/db/sessions.ts src/db/index.ts __tests__/db/sessions.test.ts
git commit -m "Add session delete and in-progress session query"
```

---

### Task 6: Session Timer Hook

**Files:**
- Create: `src/hooks/useSessionTimer.ts`
- Create: `__tests__/hooks/useSessionTimer.test.ts`

**Step 1: Write failing tests**

```typescript
// __tests__/hooks/useSessionTimer.test.ts
import { renderHook, act } from '@testing-library/react-native';
import { useSessionTimer } from '../../src/hooks/useSessionTimer';

describe('useSessionTimer', () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });
  afterEach(() => {
    jest.useRealTimers();
  });

  it('starts at 0:00 when no startTime provided', () => {
    const { result } = renderHook(() => useSessionTimer(null));
    expect(result.current.display).toBe('0:00');
    expect(result.current.seconds).toBe(0);
  });

  it('shows elapsed time from startTime', () => {
    const startTime = new Date(Date.now() - 90000).toISOString(); // 90 seconds ago
    const { result } = renderHook(() => useSessionTimer(startTime));
    // Should be approximately 1:30
    expect(result.current.display).toBe('1:30');
    expect(result.current.seconds).toBe(90);
  });

  it('updates every second', () => {
    const startTime = new Date().toISOString();
    const { result } = renderHook(() => useSessionTimer(startTime));
    expect(result.current.display).toBe('0:00');

    act(() => { jest.advanceTimersByTime(1000); });
    expect(result.current.seconds).toBe(1);
    expect(result.current.display).toBe('0:01');
  });

  it('formats hours when >= 60 minutes', () => {
    const startTime = new Date(Date.now() - 3661000).toISOString(); // 1h 1m 1s ago
    const { result } = renderHook(() => useSessionTimer(startTime));
    expect(result.current.display).toBe('1:01:01');
  });

  it('returns 0 when not running', () => {
    const { result } = renderHook(() => useSessionTimer(null));
    act(() => { jest.advanceTimersByTime(5000); });
    expect(result.current.seconds).toBe(0);
  });
});
```

**Step 2: Run tests to verify they fail**

Run: `npx jest __tests__/hooks/useSessionTimer.test.ts --no-coverage`
Expected: FAIL — module not found

**Step 3: Implement the hook**

```typescript
// src/hooks/useSessionTimer.ts
import { useState, useEffect, useRef } from 'react';

function formatTime(totalSeconds: number): string {
  const hrs = Math.floor(totalSeconds / 3600);
  const mins = Math.floor((totalSeconds % 3600) / 60);
  const secs = totalSeconds % 60;

  if (hrs > 0) {
    return `${hrs}:${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  }
  return `${mins}:${String(secs).padStart(2, '0')}`;
}

export function useSessionTimer(startTime: string | null) {
  const getElapsed = () => {
    if (!startTime) return 0;
    return Math.max(0, Math.floor((Date.now() - new Date(startTime).getTime()) / 1000));
  };

  const [seconds, setSeconds] = useState(getElapsed);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (!startTime) {
      setSeconds(0);
      return;
    }

    setSeconds(getElapsed());

    intervalRef.current = setInterval(() => {
      setSeconds(getElapsed());
    }, 1000);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [startTime]);

  return {
    seconds,
    display: formatTime(seconds),
  };
}
```

**Step 4: Run tests to verify they pass**

Run: `npx jest __tests__/hooks/useSessionTimer.test.ts --no-coverage`
Expected: PASS

**Step 5: Commit**

```bash
git add src/hooks/useSessionTimer.ts __tests__/hooks/useSessionTimer.test.ts
git commit -m "Add useSessionTimer hook with formatted display"
```

---

### Task 7: ExerciseCard — Add per-exercise note and note animation

**Files:**
- Modify: `src/components/ExerciseCard.tsx`
- Modify: `__tests__/components/ExerciseCard.test.tsx`

**Step 1: Write failing tests**

Add to `__tests__/components/ExerciseCard.test.tsx`:

```typescript
it('shows "+ Add note" link when expanded and no note exists', () => {
  render(<ExerciseCard {...defaultProps} expanded={true} />);
  expect(screen.getByText('+ Add note')).toBeTruthy();
});

it('calls onNoteChange when note text is entered', () => {
  const onNoteChange = jest.fn();
  render(
    <ExerciseCard
      {...defaultProps}
      expanded={true}
      onNoteChange={onNoteChange}
    />
  );
  fireEvent.press(screen.getByText('+ Add note'));
  // Note input should appear
  const input = screen.getByPlaceholderText('Add a note for this exercise...');
  fireEvent.changeText(input, 'Left shoulder tight');
  expect(onNoteChange).toHaveBeenCalledWith('Left shoulder tight');
});

it('shows existing note text when note prop is provided', () => {
  render(
    <ExerciseCard
      {...defaultProps}
      expanded={true}
      note="Grip failed on last set"
    />
  );
  expect(screen.getByDisplayValue('Grip failed on last set')).toBeTruthy();
});
```

**Step 2: Run tests to verify they fail**

Run: `npx jest __tests__/components/ExerciseCard.test.tsx --no-coverage`
Expected: FAIL — new props not recognized, elements not found

**Step 3: Add note functionality to ExerciseCard**

Add to the `ExerciseCardProps` interface:

```typescript
note?: string;
onNoteChange?: (note: string) => void;
```

Add state and UI in the expanded view, after the RPE section:

```typescript
// Inside ExerciseCard component, add local state:
const [noteVisible, setNoteVisible] = useState(!!note);

// In the expanded view JSX, after the RPE section (but still inside expandedContent):
{/* Per-exercise note */}
{noteVisible || note ? (
  <View style={styles.noteSection}>
    <TextInput
      style={styles.noteInput}
      placeholder="Add a note for this exercise..."
      placeholderTextColor={Colors.textMuted}
      value={note ?? ''}
      onChangeText={onNoteChange}
      multiline
    />
  </View>
) : (
  <TouchableOpacity
    style={styles.addNoteBtn}
    onPress={() => setNoteVisible(true)}
  >
    <Text style={styles.addNoteText}>+ Add note</Text>
  </TouchableOpacity>
)}
```

Add styles:

```typescript
addNoteBtn: {
  marginTop: Spacing.md,
  paddingTop: Spacing.md,
  borderTopWidth: 1,
  borderTopColor: Colors.surface,
},
addNoteText: {
  color: Colors.textMuted,
  fontSize: FontSize.body,
},
noteSection: {
  marginTop: Spacing.md,
  paddingTop: Spacing.md,
  borderTopWidth: 1,
  borderTopColor: Colors.surface,
},
noteInput: {
  backgroundColor: Colors.surface,
  borderRadius: BorderRadius.button,
  paddingVertical: Spacing.sm,
  paddingHorizontal: Spacing.md,
  color: Colors.textSecondary,
  fontSize: FontSize.md,
  minHeight: 36,
},
```

Add `useState`, `TextInput` to imports.

**Step 4: Run tests to verify they pass**

Run: `npx jest __tests__/components/ExerciseCard.test.tsx --no-coverage`
Expected: PASS

**Step 5: Commit**

```bash
git add src/components/ExerciseCard.tsx __tests__/components/ExerciseCard.test.tsx
git commit -m "Add per-exercise note field to ExerciseCard"
```

---

### Task 8: Enhanced SessionSummary — Stats, PRs, Edit Mode, Delete

**Files:**
- Modify: `src/components/SessionSummary.tsx`
- Modify: `__tests__/components/SessionSummary.test.tsx`

**Step 1: Write failing tests**

Add to `__tests__/components/SessionSummary.test.tsx`:

```typescript
it('shows duration in stat grid', () => {
  render(<SessionSummary {...defaultProps} duration="52:18" />);
  expect(screen.getByText('52:18')).toBeTruthy();
  expect(screen.getByText('Duration')).toBeTruthy();
});

it('shows total volume in stat grid', () => {
  render(<SessionSummary {...defaultProps} totalVolume={12450} />);
  expect(screen.getByText('12,450')).toBeTruthy();
  expect(screen.getByText('Total lbs')).toBeTruthy();
});

it('shows PR count with amber styling', () => {
  const prs = [
    { id: '1', exercise_id: 'bench', record_type: 'e1rm' as const, rep_count: null,
      value: 263, previous_value: 250, session_id: 's1', date: '2026-03-07',
      exercise_name: 'Bench Press' },
  ];
  render(<SessionSummary {...defaultProps} prs={prs} />);
  expect(screen.getByText('1')).toBeTruthy(); // PR count
  expect(screen.getByText('PRs')).toBeTruthy();
});

it('shows PR detail cards with descriptions', () => {
  const prs = [
    { id: '1', exercise_id: 'bench', record_type: 'e1rm' as const, rep_count: null,
      value: 263, previous_value: 250, session_id: 's1', date: '2026-03-07',
      exercise_name: 'Bench Press' },
  ];
  render(<SessionSummary {...defaultProps} prs={prs} />);
  expect(screen.getByText(/Bench Press/)).toBeTruthy();
  expect(screen.getByText(/263/)).toBeTruthy();
});

it('shows Edit button and enters edit mode on press', () => {
  const onEdit = jest.fn();
  render(<SessionSummary {...defaultProps} onEdit={onEdit} />);
  const editBtn = screen.getByText('Edit');
  fireEvent.press(editBtn);
  expect(onEdit).toHaveBeenCalled();
});

it('shows Delete button in edit mode', () => {
  const onDelete = jest.fn();
  render(<SessionSummary {...defaultProps} editMode={true} onDelete={onDelete} />);
  expect(screen.getByText('Delete Workout')).toBeTruthy();
});
```

**Step 2: Run tests to verify they fail**

Run: `npx jest __tests__/components/SessionSummary.test.tsx --no-coverage`
Expected: FAIL

**Step 3: Update SessionSummary component**

Update the props interface to add:

```typescript
import type { PRRecord } from '../db/personal-records';

export interface SessionSummaryProps {
  // ... existing props ...
  prs?: PRRecord[];
  editMode?: boolean;
  onEdit?: () => void;
  onDelete?: () => void;
}
```

Update the stat grid to always show 4 cards: Duration, Sets, Total Volume, PRs. The PRs card uses amber styling when count > 0.

Add a PR detail section below the stat grid that renders each PR as a small card. For e1RM: "Bench Press — New est. 1RM: 263 lbs (+13 lbs)". For rep_best: "Squat — 225 lbs × 5 (best at 5 reps)".

Add an "Edit" button (or "Save" in edit mode) in the top right. Add a "Delete Workout" red text link at the bottom of the component, only visible in edit mode.

**Step 4: Run tests to verify they pass**

Run: `npx jest __tests__/components/SessionSummary.test.tsx --no-coverage`
Expected: PASS

**Step 5: Commit**

```bash
git add src/components/SessionSummary.tsx __tests__/components/SessionSummary.test.tsx
git commit -m "Enhance SessionSummary with duration, volume, PRs, edit mode, delete"
```

---

### Task 9: useWorkoutSession — Timer, Notes, PRs, Session Restore, Edit/Delete

**Files:**
- Modify: `src/hooks/useWorkoutSession.ts`
- Modify: `__tests__/hooks/useWorkoutSession.test.ts` (if it exists, otherwise create)

This is the largest task. It wires together all the new DB functions and the timer hook into the main workout hook.

**Step 1: Add timer integration**

- Import `useSessionTimer` from `./useSessionTimer`
- Track `startedAt` as a state variable (set when session is created, restored from DB on restore)
- Call `useSessionTimer(startedAt)` and expose `timer` (the display string) and `timerSeconds`
- On session create (`startSession`), capture `startedAt` from the `created_at` timestamp
- Compute `duration` string from `timerSeconds` for the summary screen

**Step 2: Add exercise notes integration**

- Import `saveExerciseNote`, `getExerciseNotesForSession` from `../db`
- Add `exerciseNotes: Record<string, string>` state
- Add `saveExerciseNoteAction(exerciseId: string, note: string)` that calls `saveExerciseNote` and updates local state
- On session restore / completed session load, also load exercise notes via `getExerciseNotesForSession`
- Expose `exerciseNotes` and `saveExerciseNoteAction` in the return value

**Step 3: Add PR detection integration**

- Import `detectPRs`, `getPRsForSession` from `../db`
- Import `getSetLogsForSession` (already imported indirectly)
- Add `prs: PRRecord[]` state
- In `finishSession`, after `completeSession`, load all set logs, call `detectPRs`, store result in state
- On completed session load, call `getPRsForSession` and store result
- Expose `prs` in the return value

**Step 4: Add total volume computation**

- Add `totalVolume` computed property: sum of `actualWeight * actualReps` across all completed sets in `exercises`
- Expose in return value

**Step 5: Add session restore**

- Import `getInProgressSession` from `../db`
- In `loadData`, before checking for completed session, check for in-progress session
- If found: load set logs, rebuild exercise states (same logic as completed session load), restore warmup state from session record, set `startedAt` from session's `started_at`, set phase to 'logging', expand first incomplete exercise
- The template is loaded from the program definition using `day_template_id`

**Step 6: Add edit mode + delete**

- Add `editMode: boolean` state, `setEditMode`
- Add `deleteSessionAction` that calls `deleteSession` from DB, resets all state, sets phase to 'select'
- Add `updateSetInEditMode(exerciseIdx, setIdx, weight, reps)` for inline editing in the summary
- Expose all in return value

**Step 7: Add conditioning finisher from template**

- Add `conditioningFinisher: string | null` derived from `selectedTemplate?.conditioning_finisher`
- Expose in return value (the workout screen will use this instead of hardcoded "Sled Push")

**Step 8: Run full test suite**

Run: `npx jest --no-coverage`
Expected: PASS (or fix any broken tests)

**Step 9: Commit**

```bash
git add src/hooks/useWorkoutSession.ts
git commit -m "Wire timer, notes, PRs, session restore, edit/delete into workout hook"
```

---

### Task 10: Workout Screen — Header, Progress Bar, Finish Button

**Files:**
- Modify: `app/(tabs)/workout.tsx`

**Step 1: Update logging header**

- Use `FontSize.screenTitle` and `fontWeight: '800'` for the workout name (matching other screen titles)
- Add subtitle: "Week {currentWeek} — {blockName}" in muted text
- Add timer display right-aligned: `w.timer`

**Step 2: Update progress bar**

- Left label: `{doneExerciseCount} of {w.exercises.length} exercises`
- Right label: `{setCount} / {totalSets} sets`
- Below right: "+ Add exercise" link (keep existing behavior)

**Step 3: Pinned finish button**

- Move "Finish Workout" button outside the ScrollView
- Only render when `setCount / totalSets >= 0.5`
- Add bottom padding to ScrollView content when button is visible
- Wrap in `Animated.View` with `translateY` animation (Task 12 will add the spring, for now just show/hide)

**Step 4: Wire conditioning finisher dynamically**

- Replace hardcoded "Sled Push" with `w.conditioningFinisher`
- Hide the conditioning card entirely when `w.conditioningFinisher` is null

**Step 5: Wire exercise notes**

- Pass `note={w.exerciseNotes[ex.slot.exercise_id]}` and `onNoteChange={(note) => w.saveExerciseNoteAction(ex.slot.exercise_id, note)}` to each `ExerciseCard`

**Step 6: Update summary phase**

- Pass new props to `SessionSummary`: `duration={w.timer}`, `totalVolume={w.totalVolume}`, `prs={w.prs}`, `editMode={w.editMode}`, `onEdit={() => w.setEditMode(true)}`, `onDelete={...}` (with confirmation alert)

**Step 7: Update post-completion state**

- When showing completed session summary, include Edit button and all enhanced stats

**Step 8: Run app to verify visually**

Run: `npx expo start` and test the workflow

**Step 9: Commit**

```bash
git add app/(tabs)/workout.tsx
git commit -m "Update workout screen: header, progress bar, pinned finish, notes, PRs"
```

---

### Task 11: Rest Day State Enhancement

**Files:**
- Modify: `app/(tabs)/workout.tsx`

**Step 1: Update rest day view**

Replace the simple text with:

```tsx
{w.phase === 'select' && !w.selectedTemplate && (
  <View style={styles.restDay}>
    <Ionicons name="moon-outline" size={48} color={Colors.textMuted} style={{ marginBottom: Spacing.lg }} />
    <Text style={styles.restDayText}>Rest Day</Text>
    <Text style={styles.restDaySubtext}>No workout scheduled for today</Text>
    {w.nextWorkout && (
      <View style={styles.nextWorkoutCard}>
        <Text style={styles.nextWorkoutLabel}>NEXT WORKOUT</Text>
        <Text style={styles.nextWorkoutTitle}>
          {w.nextWorkout.dayName} — {w.nextWorkout.templateName}
        </Text>
      </View>
    )}
  </View>
)}
```

**Step 2: Add nextWorkout to useWorkoutSession**

In the hook, compute from `trainingDays` and `selectedDay`:

```typescript
const nextWorkout = useMemo(() => {
  if (selectedTemplate) return null; // not a rest day
  const dayIdx = DAY_ORDER.indexOf(selectedDay as typeof DAY_ORDER[number]);
  for (let i = 1; i <= 7; i++) {
    const nextDay = DAY_ORDER[(dayIdx + i) % 7];
    const match = trainingDays.find(d => d.day === nextDay);
    if (match) {
      return { dayName: DAY_NAMES[nextDay], templateName: match.template.name };
    }
  }
  return null;
}, [selectedDay, selectedTemplate, trainingDays]);
```

Expose `nextWorkout` in the return value.

**Step 3: Add styles for next workout card**

```typescript
nextWorkoutCard: {
  marginTop: Spacing.xxl,
  backgroundColor: Colors.card,
  borderWidth: 1,
  borderColor: Colors.border,
  borderRadius: BorderRadius.cardInner,
  padding: Spacing.lg,
  width: '100%',
},
nextWorkoutLabel: {
  color: Colors.textMuted,
  fontSize: FontSize.sectionLabel,
  fontWeight: '600',
  textTransform: 'uppercase',
  letterSpacing: 0.5,
  marginBottom: Spacing.xs,
},
nextWorkoutTitle: {
  color: Colors.text,
  fontSize: FontSize.base,
  fontWeight: '600',
},
```

**Step 4: Commit**

```bash
git add app/(tabs)/workout.tsx src/hooks/useWorkoutSession.ts
git commit -m "Enhance rest day state with icon and next workout preview"
```

---

### Task 12: Session Restore — Integration Test

**Files:**
- Create: `__tests__/hooks/useWorkoutSession.restore.test.ts` (or add to existing)

**Step 1: Write a test that verifies session restore flow**

Mock the DB to return an in-progress session with partial set logs. Verify the hook:
1. Sets phase to 'logging'
2. Rebuilds exercise states with correct completed/pending statuses
3. Expands the first incomplete exercise
4. Sets `startedAt` to the session's `started_at` timestamp

**Step 2: Run test**

Run: `npx jest __tests__/hooks/useWorkoutSession.restore.test.ts --no-coverage`
Expected: PASS

**Step 3: Commit**

```bash
git add __tests__/hooks/useWorkoutSession.restore.test.ts
git commit -m "Add integration test for session restore flow"
```

---

### Task 13: Animations

**Files:**
- Modify: `app/(tabs)/workout.tsx`
- Modify: `src/components/ExerciseCard.tsx`

This task adds the 5 animations from the design doc. Use `react-native-reanimated` throughout.

**Step 1: Phase transition crossfade**

Wrap the phase content areas in `Animated.View` with `FadeIn` / `FadeOut` layout animations:

```typescript
import Animated, { FadeIn, FadeOut } from 'react-native-reanimated';

// Wrap each phase block:
{w.phase === 'logging' && (
  <Animated.View entering={FadeIn.duration(200)} exiting={FadeOut.duration(200)}>
    {/* ... logging content ... */}
  </Animated.View>
)}
```

**Step 2: Set completion pulse**

In `ExerciseCard`, wrap the checkmark button in an `Animated.View`. On completion, trigger a scale animation:

```typescript
import Animated, { useAnimatedStyle, useSharedValue, withSequence, withTiming } from 'react-native-reanimated';

// In the set button press handler, trigger:
const scale = useSharedValue(1);
// On complete: scale.value = withSequence(withTiming(1.15, {duration: 75}), withTiming(1, {duration: 75}));
```

**Step 3: Progress bar animated fill**

Replace the progress bar fill's `width` with an animated value:

```typescript
const progressWidth = useSharedValue(0);
// Update when setCount changes:
progressWidth.value = withTiming(totalSets > 0 ? (setCount / totalSets) * 100 : 0, { duration: 300 });
```

**Step 4: Finish button slide-up**

Wrap the pinned finish button in `Animated.View` with `SlideInDown` entering animation:

```typescript
<Animated.View entering={SlideInDown.springify().damping(15)} style={styles.finishButtonContainer}>
  {/* finish button */}
</Animated.View>
```

**Step 5: Exercise auto-advance layout animation**

Use `LayoutAnimationConfig` or `Layout` transition on the exercise card list to animate height changes when cards expand/collapse.

**Step 6: Test visually**

Run: `npx expo start` — verify all 5 animations look smooth and don't interfere with the one-tap logging flow.

**Step 7: Commit**

```bash
git add app/(tabs)/workout.tsx src/components/ExerciseCard.tsx
git commit -m "Add workout animations: phase fade, set pulse, progress fill, finish slide, card layout"
```

---

### Task 14: Final Integration Test & Verification

**Step 1: Run full test suite**

Run: `npx jest --no-coverage`
Expected: All tests pass

**Step 2: Fix any broken tests**

Address any failures from the broader changes.

**Step 3: Manual smoke test**

Run: `npx expo start` and walk through the complete flow:
1. Open workout tab → see day selector
2. Select a training day → see exercise preview
3. Tap Start Session → timer starts, warmup phase
4. Complete warmup → logging phase with progress bar (exercises + sets)
5. Complete sets → verify set completion animation, auto-advance
6. Add a note to an exercise
7. Complete ≥50% sets → finish button slides up
8. Finish workout → summary shows duration, volume, PRs
9. Navigate away and back → summary still shows (post-completion state)
10. Tap Edit → edit mode, modify a weight, save
11. Select a rest day → icon + next workout card
12. Kill app mid-workout → relaunch → session restored

**Step 4: Final commit**

```bash
git add -A
git commit -m "Workout screen improvements: complete integration"
```

# Warmup & Conditioning Refactor — Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Replace hardcoded warmup booleans and conditioning flag with a data-driven `session_protocols` table, reading protocols from program definitions.

**Architecture:** New `session_protocols` table stores per-session protocol items (warmup + conditioning). `DayTemplate.warmup` becomes `string[]`. All UI components, hooks, queries, and metrics read from this table instead of hardcoded boolean columns. `ON DELETE CASCADE` handles cleanup.

**Tech Stack:** SQLite (expo-sqlite), TypeScript, React Native, Jest

---

### Task 1: Add `session_protocols` table to schema

**Files:**
- Modify: `src/db/schema.ts`

**Step 1: Write the schema change**

In `src/db/schema.ts`, bump `SCHEMA_VERSION` to `8` and add the new table + index to `CREATE_TABLES`:

```sql
-- Session protocols (warmup + conditioning items per session)
CREATE TABLE IF NOT EXISTS session_protocols (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  session_id TEXT NOT NULL,
  type TEXT NOT NULL,
  protocol_key TEXT,
  protocol_name TEXT NOT NULL,
  completed INTEGER DEFAULT 0,
  sort_order INTEGER DEFAULT 0,
  FOREIGN KEY (session_id) REFERENCES sessions(id) ON DELETE CASCADE
);
```

Add index:
```sql
CREATE INDEX IF NOT EXISTS idx_session_protocols_session ON session_protocols(session_id);
```

Remove the 4 hardcoded columns from the `sessions` table definition:
- `warmup_rope INTEGER DEFAULT 0`
- `warmup_ankle INTEGER DEFAULT 0`
- `warmup_hip_ir INTEGER DEFAULT 0`
- `conditioning_done INTEGER DEFAULT 0`

**Step 2: Run tests to check for compilation issues**

Run: `npx tsc --noEmit`
Expected: Type errors in files that reference the removed session fields (this is expected — we'll fix them in later tasks).

**Step 3: Commit**

```bash
git add src/db/schema.ts
git commit -m "feat: add session_protocols table, remove hardcoded warmup columns"
```

---

### Task 2: Add `SessionProtocol` type and update `Session` type

**Files:**
- Modify: `src/types/training.ts`
- Modify: `src/types/program.ts`

**Step 1: Add SessionProtocol type to `src/types/training.ts`**

Add after the `Session` interface:

```typescript
export interface SessionProtocol {
  id: number;
  session_id: string;
  type: 'warmup' | 'conditioning';
  protocol_key: string | null;
  protocol_name: string;
  completed: boolean;
  sort_order: number;
}
```

Remove from the `Session` interface:
- `warmup_rope: boolean;`
- `warmup_ankle: boolean;`
- `warmup_hip_ir: boolean;`
- `conditioning_done: boolean;`

**Step 2: Update `DayTemplate.warmup` in `src/types/program.ts`**

Change line 54 from:
```typescript
warmup: string;
```
to:
```typescript
warmup: string[];
```

**Step 3: Commit**

```bash
git add src/types/training.ts src/types/program.ts
git commit -m "feat: add SessionProtocol type, update DayTemplate.warmup to string[]"
```

---

### Task 3: Add protocol DB functions

**Files:**
- Modify: `src/db/sessions.ts`

**Step 1: Write the failing test**

Create `__tests__/db/session-protocols.test.ts`:

```typescript
import { getDatabase, generateId } from '../../src/db/database';
import {
  createSession,
  insertSessionProtocols,
  getSessionProtocols,
  updateProtocolCompletion,
  deleteSession,
} from '../../src/db/sessions';

// Initialize DB before tests
beforeAll(async () => {
  const db = await getDatabase();
  // Ensure a program exists for FK
  await db.runAsync(
    `INSERT OR IGNORE INTO programs (id, name, duration_weeks, created_date, status, definition_json)
     VALUES (?, ?, ?, ?, ?, ?)`,
    ['test-prog', 'Test Program', 10, '2026-01-01', 'active', '{}']
  );
});

afterAll(async () => {
  const db = await getDatabase();
  await db.runAsync('DELETE FROM programs WHERE id = ?', ['test-prog']);
});

describe('session_protocols CRUD', () => {
  let sessionId: string;

  beforeEach(async () => {
    sessionId = await createSession({
      programId: 'test-prog',
      weekNumber: 1,
      blockName: 'Test Block',
      dayTemplateId: 'test_day',
      scheduledDay: 'monday',
      actualDay: 'monday',
      date: '2026-03-11',
    });
  });

  afterEach(async () => {
    await deleteSession(sessionId);
  });

  it('inserts and retrieves protocol items', async () => {
    await insertSessionProtocols(sessionId, [
      { type: 'warmup', protocolKey: 'jump_rope', protocolName: 'Jump Rope — 3 min' },
      { type: 'warmup', protocolKey: 'full_ankle', protocolName: 'Full Ankle Protocol' },
      { type: 'conditioning', protocolKey: null, protocolName: 'Assault Bike — 5 min' },
    ]);

    const protocols = await getSessionProtocols(sessionId);
    expect(protocols).toHaveLength(3);
    expect(protocols[0].protocol_key).toBe('jump_rope');
    expect(protocols[0].type).toBe('warmup');
    expect(protocols[0].completed).toBe(0);
    expect(protocols[0].sort_order).toBe(0);
    expect(protocols[1].sort_order).toBe(1);
    expect(protocols[2].type).toBe('conditioning');
    expect(protocols[2].sort_order).toBe(2);
  });

  it('updates protocol completion', async () => {
    await insertSessionProtocols(sessionId, [
      { type: 'warmup', protocolKey: 'jump_rope', protocolName: 'Jump Rope' },
    ]);

    const [protocol] = await getSessionProtocols(sessionId);
    expect(protocol.completed).toBe(0);

    await updateProtocolCompletion(protocol.id, true);

    const [updated] = await getSessionProtocols(sessionId);
    expect(updated.completed).toBe(1);
  });

  it('cascades delete when session is deleted', async () => {
    await insertSessionProtocols(sessionId, [
      { type: 'warmup', protocolKey: 'jump_rope', protocolName: 'Jump Rope' },
    ]);

    const db = await getDatabase();
    // Delete session directly to test CASCADE
    await db.runAsync('DELETE FROM sessions WHERE id = ?', [sessionId]);

    const protocols = await getSessionProtocols(sessionId);
    expect(protocols).toHaveLength(0);

    // Prevent afterEach from trying to delete again
    sessionId = 'already-deleted';
  });
});
```

**Step 2: Run test to verify it fails**

Run: `npm test -- __tests__/db/session-protocols.test.ts`
Expected: FAIL — `insertSessionProtocols` is not a function

**Step 3: Implement the protocol DB functions**

Add to `src/db/sessions.ts`:

```typescript
import type { SessionProtocol } from '../types';

/** Insert protocol items for a session */
export async function insertSessionProtocols(
  sessionId: string,
  protocols: { type: string; protocolKey: string | null; protocolName: string }[]
): Promise<void> {
  const db = await getDatabase();
  for (let i = 0; i < protocols.length; i++) {
    const p = protocols[i];
    await db.runAsync(
      `INSERT INTO session_protocols (session_id, type, protocol_key, protocol_name, sort_order)
       VALUES (?, ?, ?, ?, ?)`,
      [sessionId, p.type, p.protocolKey, p.protocolName, i]
    );
  }
}

/** Get all protocol items for a session */
export async function getSessionProtocols(sessionId: string): Promise<SessionProtocol[]> {
  const db = await getDatabase();
  return db.getAllAsync<SessionProtocol>(
    'SELECT * FROM session_protocols WHERE session_id = ? ORDER BY sort_order',
    [sessionId]
  );
}

/** Toggle completion of a single protocol item */
export async function updateProtocolCompletion(
  protocolId: number,
  completed: boolean
): Promise<void> {
  const db = await getDatabase();
  await db.runAsync(
    'UPDATE session_protocols SET completed = ? WHERE id = ?',
    [completed ? 1 : 0, protocolId]
  );
}
```

Also remove the old `updateWarmup()` function (lines 52-71) and update `completeSession()` to remove the `conditioningDone` parameter:

```typescript
export async function completeSession(sessionId: string): Promise<void> {
  const db = await getDatabase();
  await db.runAsync(
    "UPDATE sessions SET completed_at = ? WHERE id = ?",
    [new Date().toISOString(), sessionId]
  );
}
```

Add `session_protocols` cleanup to `deleteSession()`:

```typescript
export async function deleteSession(sessionId: string): Promise<void> {
  const db = await getDatabase();
  await db.runAsync('DELETE FROM session_protocols WHERE session_id = ?', [sessionId]);
  await db.runAsync('DELETE FROM set_logs WHERE session_id = ?', [sessionId]);
  await db.runAsync('DELETE FROM exercise_notes WHERE session_id = ?', [sessionId]);
  await db.runAsync('DELETE FROM personal_records WHERE session_id = ?', [sessionId]);
  await db.runAsync('DELETE FROM sessions WHERE id = ?', [sessionId]);
}
```

**Step 4: Run test to verify it passes**

Run: `npm test -- __tests__/db/session-protocols.test.ts`
Expected: PASS

**Step 5: Commit**

```bash
git add src/db/sessions.ts __tests__/db/session-protocols.test.ts
git commit -m "feat: add session protocol CRUD functions with tests"
```

---

### Task 4: Update `getFullSessionState` to include protocols

**Files:**
- Modify: `src/db/sessions.ts`

**Step 1: Write the failing test**

Add to `__tests__/db/session-protocols.test.ts`:

```typescript
import { getFullSessionState } from '../../src/db/sessions';

it('getFullSessionState includes protocols', async () => {
  await insertSessionProtocols(sessionId, [
    { type: 'warmup', protocolKey: 'jump_rope', protocolName: 'Jump Rope' },
  ]);

  const state = await getFullSessionState(sessionId);
  expect(state).not.toBeNull();
  expect(state!.protocols).toHaveLength(1);
  expect(state!.protocols[0].protocol_key).toBe('jump_rope');
});
```

**Step 2: Run test to verify it fails**

Run: `npm test -- __tests__/db/session-protocols.test.ts`
Expected: FAIL — `protocols` property doesn't exist

**Step 3: Update `getFullSessionState` return type and implementation**

In `src/db/sessions.ts`, update `getFullSessionState` to also fetch and return protocols:

```typescript
export async function getFullSessionState(sessionId: string): Promise<{
  session: Session;
  setLogs: SetLog[];
  exerciseNotes: Record<string, string>;
  protocols: SessionProtocol[];
} | null> {
  // ... existing session + setLogs + exerciseNotes code ...

  const protocols = await getSessionProtocols(sessionId);

  return { session, setLogs, exerciseNotes, protocols };
}
```

**Step 4: Run test to verify it passes**

Run: `npm test -- __tests__/db/session-protocols.test.ts`
Expected: PASS

**Step 5: Commit**

```bash
git add src/db/sessions.ts __tests__/db/session-protocols.test.ts
git commit -m "feat: include protocols in getFullSessionState"
```

---

### Task 5: Update program JSON — `warmup` field to arrays, add protocols

**Files:**
- Modify: `src/data/functional-athlete-v2.json`

**Step 1: Update day templates**

Change every `"warmup": "some_protocol"` to `"warmup": ["jump_rope", "some_protocol"]` (or whatever combination is appropriate per day). For example:

- Day with `"warmup": "full_ankle"` → `"warmup": ["jump_rope", "full_ankle"]`
- Day with `"warmup": "abbreviated_ankle"` → `"warmup": ["jump_rope", "abbreviated_ankle"]`
- Day with `"warmup": "full_ankle_plus_mobility"` → `"warmup": ["full_ankle_plus_mobility"]` (mobility day might not need jump rope)

**Step 2: Add `jump_rope` and `hip_ir_mobility` protocols to `warmup_protocols`**

```json
"jump_rope": {
  "duration_min": 3,
  "steps": [
    {
      "name": "Jump Rope",
      "prescription": "3 min continuous",
      "notes": "Any style — single bounce, alternating, or mixed"
    }
  ]
},
"hip_ir_mobility": {
  "duration_min": 5,
  "steps": [
    {
      "name": "Hip IR Mobility Work",
      "prescription": "5 min",
      "notes": "90/90 position, internal rotation stretches"
    }
  ]
}
```

**Step 3: Add a `name` field to each warmup protocol**

Each protocol in `warmup_protocols` should have a display-friendly `name`:

```json
"full_ankle": {
  "name": "Full Ankle Protocol",
  "duration_min": 10,
  "steps": [...]
},
"jump_rope": {
  "name": "Jump Rope",
  "duration_min": 3,
  "steps": [...]
}
```

**Step 4: Update `WarmupProtocol` type in `src/types/program.ts`**

Add `name` field:

```typescript
export interface WarmupProtocol {
  name: string;
  duration_min: number;
  steps: WarmupStep[];
  note?: string;
}
```

**Step 5: Commit**

```bash
git add src/data/functional-athlete-v2.json src/types/program.ts
git commit -m "feat: update program data — warmup arrays, add protocol names"
```

---

### Task 6: Update `useWorkoutSession` hook — protocol state

**Files:**
- Modify: `src/hooks/useWorkoutSession.ts`

**Step 1: Replace warmup boolean state with protocol array state**

Remove:
```typescript
const [warmupRope, setWarmupRope] = useState(false);
const [warmupAnkle, setWarmupAnkle] = useState(false);
const [warmupHipIr, setWarmupHipIr] = useState(false);
```

Replace with:
```typescript
const [protocols, setProtocols] = useState<SessionProtocol[]>([]);
```

Import `SessionProtocol` from types and `insertSessionProtocols`, `getSessionProtocols`, `updateProtocolCompletion` from db/sessions.

**Step 2: Update `startSession` to insert protocols**

After creating the session (line ~458), insert protocol rows based on the day template:

```typescript
// Insert warmup protocols from day template
const def = program.definition as ProgramDefinition;
const protocolItems: { type: string; protocolKey: string | null; protocolName: string }[] = [];

if (selectedTemplate.warmup) {
  for (const key of selectedTemplate.warmup) {
    const proto = def.warmup_protocols?.[key];
    const name = proto?.name ?? key.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
    protocolItems.push({ type: 'warmup', protocolKey: key, protocolName: name });
  }
}
if (selectedTemplate.conditioning_finisher) {
  protocolItems.push({
    type: 'conditioning',
    protocolKey: null,
    protocolName: selectedTemplate.conditioning_finisher,
  });
}

await insertSessionProtocols(id, protocolItems);
const sessionProtocols = await getSessionProtocols(id);
setProtocols(sessionProtocols);
```

**Step 3: Update `submitWarmup`**

Replace:
```typescript
const submitWarmup = async () => {
  if (sessionId) await updateWarmup(sessionId, {
    rope: warmupRope, ankle: warmupAnkle, hipIr: warmupHipIr,
  });
  setPhase('logging');
};
```

With:
```typescript
const submitWarmup = async () => {
  // Protocol completions are already persisted on toggle — just advance phase
  setPhase('logging');
};
```

**Step 4: Update protocol toggle function**

Replace the individual toggle callbacks with a single toggle-by-id:

```typescript
const toggleProtocol = async (protocolId: number) => {
  const current = protocols.find(p => p.id === protocolId);
  if (!current) return;
  const newCompleted = !current.completed;
  await updateProtocolCompletion(protocolId, newCompleted);
  setProtocols(prev => prev.map(p =>
    p.id === protocolId ? { ...p, completed: newCompleted } : p
  ));
};
```

**Step 5: Update `finishSession`**

Change:
```typescript
await completeSession(sessionId, conditioningDone);
```
To:
```typescript
await completeSession(sessionId);
```

(Conditioning completion is already stored in `session_protocols`.)

**Step 6: Update `performRestore` to restore protocols**

Replace lines 351-354 (warmup flag restoration) with:

```typescript
// Restore protocol state
const restoredProtocols = fullState.protocols;
setProtocols(restoredProtocols);
```

Remove restoration of `conditioningDone` from the session object — instead derive it:
```typescript
// conditioningDone is derived from protocols
```

**Step 7: Update `deleteSessionAction` to reset protocols state**

Add `setProtocols([]);` to the reset block.

**Step 8: Update return object**

Remove from return:
- `warmupRope`, `toggleWarmupRope`
- `warmupAnkle`, `toggleWarmupAnkle`
- `warmupHipIr`, `toggleWarmupHipIr`
- `setConditioningDone`

Add to return:
- `protocols` — the array of `SessionProtocol` items
- `toggleProtocol` — function to toggle a protocol by id
- `conditioningDone` — derived: `protocols.some(p => p.type === 'conditioning' && p.completed)`

**Step 9: Commit**

```bash
git add src/hooks/useWorkoutSession.ts
git commit -m "feat: replace warmup booleans with dynamic protocols in hook"
```

---

### Task 7: Update `WarmupChecklist` component

**Files:**
- Modify: `src/components/WarmupChecklist.tsx`
- Modify: `__tests__/components/WarmupChecklist.test.tsx`

**Step 1: Write the failing test**

Replace `__tests__/components/WarmupChecklist.test.tsx`:

```typescript
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react-native';
import { WarmupChecklist } from '../../src/components/WarmupChecklist';
import type { SessionProtocol } from '../../src/types';

const mockProtocols: SessionProtocol[] = [
  { id: 1, session_id: 's1', type: 'warmup', protocol_key: 'jump_rope', protocol_name: 'Jump Rope — 3 min', completed: false, sort_order: 0 },
  { id: 2, session_id: 's1', type: 'warmup', protocol_key: 'full_ankle', protocol_name: 'Full Ankle Protocol — 10 min', completed: false, sort_order: 1 },
];

const defaultProps = {
  protocols: mockProtocols,
  onToggle: jest.fn(),
  onContinue: jest.fn(),
};

describe('WarmupChecklist', () => {
  beforeEach(() => jest.clearAllMocks());

  it('renders all protocol items from data', () => {
    render(<WarmupChecklist {...defaultProps} />);
    expect(screen.getByText('Jump Rope — 3 min')).toBeTruthy();
    expect(screen.getByText('Full Ankle Protocol — 10 min')).toBeTruthy();
  });

  it('renders continue button', () => {
    render(<WarmupChecklist {...defaultProps} />);
    expect(screen.getByText(/Continue to Exercises/)).toBeTruthy();
  });

  it('calls onToggle with protocol id when pressed', () => {
    const onToggle = jest.fn();
    render(<WarmupChecklist {...defaultProps} onToggle={onToggle} />);
    fireEvent.press(screen.getByText('Jump Rope — 3 min'));
    expect(onToggle).toHaveBeenCalledWith(1);
  });

  it('shows checked state for completed protocols', () => {
    const completed = [
      { ...mockProtocols[0], completed: true },
      mockProtocols[1],
    ];
    render(<WarmupChecklist {...defaultProps} protocols={completed} />);
    // The checkmark character should be present for the completed item
    expect(screen.getByText('✓')).toBeTruthy();
  });

  it('calls onContinue when continue button is pressed', () => {
    const onContinue = jest.fn();
    render(<WarmupChecklist {...defaultProps} onContinue={onContinue} />);
    fireEvent.press(screen.getByText(/Continue to Exercises/));
    expect(onContinue).toHaveBeenCalledTimes(1);
  });

  it('renders with empty protocols list', () => {
    render(<WarmupChecklist protocols={[]} onToggle={jest.fn()} onContinue={jest.fn()} />);
    expect(screen.getByText(/Continue to Exercises/)).toBeTruthy();
  });

  it('displays the workout timer when provided', () => {
    render(<WarmupChecklist {...defaultProps} timer="03:45" />);
    expect(screen.getByText('03:45')).toBeTruthy();
  });
});
```

**Step 2: Run test to verify it fails**

Run: `npm test -- __tests__/components/WarmupChecklist.test.tsx`
Expected: FAIL — props don't match new interface

**Step 3: Rewrite `WarmupChecklist` component**

```typescript
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import * as Haptics from 'expo-haptics';
import { Colors, Spacing, FontSize, BorderRadius, ComponentSize } from '../theme';
import type { SessionProtocol } from '../types';

export interface WarmupChecklistProps {
  protocols: SessionProtocol[];
  onToggle: (protocolId: number) => void;
  onContinue: () => void;
  timer?: string;
}

export function WarmupChecklist({
  protocols, onToggle, onContinue, timer,
}: WarmupChecklistProps) {
  // Only show warmup-type protocols in the checklist
  const warmupProtocols = protocols.filter(p => p.type === 'warmup');

  return (
    <View style={styles.container}>
      <View style={styles.titleRow}>
        <Text style={styles.title}>Warm Up</Text>
        {timer && (
          <Text style={styles.timerDisplay}>{timer}</Text>
        )}
      </View>
      <View style={styles.items}>
        {warmupProtocols.map((protocol) => (
          <TouchableOpacity
            key={protocol.id}
            style={[
              styles.warmupItem,
              protocol.completed && styles.warmupItemChecked,
            ]}
            onPress={() => {
              onToggle(protocol.id);
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            }}
            activeOpacity={0.7}
          >
            <View style={[
              styles.warmupCheck,
              protocol.completed && styles.warmupCheckChecked,
            ]}>
              {protocol.completed && <Text style={styles.warmupCheckText}>{'\u2713'}</Text>}
            </View>
            <Text style={[
              styles.warmupLabel,
              protocol.completed && styles.warmupLabelChecked,
            ]}>{protocol.protocol_name}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <TouchableOpacity
        style={styles.continueButton}
        onPress={onContinue}
        activeOpacity={0.8}
      >
        <Text style={styles.continueButtonText}>Continue to Exercises {'\u2192'}</Text>
      </TouchableOpacity>
    </View>
  );
}
```

Keep existing styles unchanged.

**Step 4: Run test to verify it passes**

Run: `npm test -- __tests__/components/WarmupChecklist.test.tsx`
Expected: PASS

**Step 5: Commit**

```bash
git add src/components/WarmupChecklist.tsx __tests__/components/WarmupChecklist.test.tsx
git commit -m "feat: make WarmupChecklist data-driven from session protocols"
```

---

### Task 8: Update `workout.tsx` — wire new props

**Files:**
- Modify: `app/(tabs)/workout.tsx`

**Step 1: Update WarmupChecklist usage**

Replace lines 295-305:
```tsx
<WarmupChecklist
  warmupRope={w.warmupRope}
  warmupAnkle={w.warmupAnkle}
  warmupHipIr={w.warmupHipIr}
  blockColor={w.blockColor}
  onToggleRope={w.toggleWarmupRope}
  onToggleAnkle={w.toggleWarmupAnkle}
  onToggleHipIr={w.toggleWarmupHipIr}
  onContinue={w.submitWarmup}
  timer={w.timer}
/>
```

With:
```tsx
<WarmupChecklist
  protocols={w.protocols}
  onToggle={w.toggleProtocol}
  onContinue={w.submitWarmup}
  timer={w.timer}
/>
```

**Step 2: Update SessionSummary warmup prop**

Replace line ~493:
```tsx
warmup={{ rope: w.warmupRope, ankle: w.warmupAnkle, hipIr: w.warmupHipIr }}
```

With:
```tsx
protocols={w.protocols}
```

(This requires updating `SessionSummary` props in the next task.)

**Step 3: Commit**

```bash
git add app/(tabs)/workout.tsx
git commit -m "feat: wire data-driven protocols into workout screen"
```

---

### Task 9: Update `SessionSummary` component

**Files:**
- Modify: `src/components/SessionSummary.tsx`

**Step 1: Update props and protocol chip logic**

Replace props:
```typescript
warmup?: { rope: boolean; ankle: boolean; hipIr: boolean };
conditioningFinisher?: string | null;
conditioningDone?: boolean;
```

With:
```typescript
protocols?: SessionProtocol[];
```

Replace the protocol chip building logic (lines 76-85):
```typescript
const protocols: { label: string; done: boolean }[] = [];
if (warmup) {
  protocols.push({ label: 'Jump Rope', done: warmup.rope });
  protocols.push({ label: 'Ankle', done: warmup.ankle });
  protocols.push({ label: 'Hip IR', done: warmup.hipIr });
}
if (conditioningFinisher) {
  protocols.push({ label: 'Conditioning', done: conditioningDone ?? false });
}
```

With:
```typescript
const protocolChips = (protocols ?? []).map(p => ({
  label: p.protocol_name,
  done: !!p.completed,
}));
```

Update the rendering to use `protocolChips` instead of `protocols`.

**Step 2: Commit**

```bash
git add src/components/SessionSummary.tsx
git commit -m "feat: make SessionSummary protocol chips data-driven"
```

---

### Task 10: Update `session/[id].tsx` — history view

**Files:**
- Modify: `app/session/[id].tsx`

**Step 1: Load protocols for the session**

Import `getSessionProtocols` from `src/db/sessions`. In the data loading effect, fetch protocols:

```typescript
const [protocols, setProtocols] = useState<SessionProtocol[]>([]);

// In the useEffect that loads session data:
const sessionProtocols = await getSessionProtocols(session.id);
setProtocols(sessionProtocols);
```

**Step 2: Replace hardcoded chips**

Replace lines 158-184 (the hardcoded warmup_rope/warmup_ankle/warmup_hip_ir/conditioning_done chips):

```tsx
<View style={styles.chipRow}>
  {protocols.filter(p => p.completed).map(p => (
    <View key={p.id} style={styles.chip}>
      <Ionicons name="checkmark" size={12} color={Colors.green} />
      <Text style={styles.chipText}>{p.protocol_name}</Text>
    </View>
  ))}
</View>
```

**Step 3: Commit**

```bash
git add app/session/[id].tsx
git commit -m "feat: display data-driven protocol chips in session detail"
```

---

### Task 11: Update `getProtocolConsistency` metrics

**Files:**
- Modify: `src/db/metrics.ts`

**Step 1: Write the failing test**

Add to `__tests__/db/metrics-extended.test.ts` (or create if needed):

```typescript
it('getProtocolConsistency returns data from session_protocols', async () => {
  // Setup: create sessions with protocol rows
  // ...
  const items = await getProtocolConsistency(programId);
  // Should return items based on actual protocol data, not hardcoded names
  expect(items.every(i => i.total > 0)).toBe(true);
});
```

**Step 2: Rewrite `getProtocolConsistency`**

Replace the hardcoded query with:

```typescript
export async function getProtocolConsistency(
  programId: string | null
): Promise<ProtocolItem[]> {
  const db = await getDatabase();

  let sql = `SELECT
       sp.protocol_name as name,
       COUNT(*) as total,
       SUM(sp.completed) as completed
     FROM session_protocols sp
     JOIN sessions s ON s.id = sp.session_id
     WHERE s.completed_at IS NOT NULL`;

  const params: string[] = [];

  if (programId !== null) {
    sql += `\n       AND s.program_id = ?`;
    params.push(programId);
  }

  sql += `\n     GROUP BY sp.protocol_name ORDER BY sp.type, sp.sort_order`;

  const rows = await db.getAllAsync<{ name: string; total: number; completed: number }>(sql, params);
  return rows.map(r => ({ name: r.name, completed: r.completed, total: r.total }));
}
```

**Step 3: Run tests**

Run: `npm test -- __tests__/db/metrics-extended.test.ts`
Expected: PASS

**Step 4: Commit**

```bash
git add src/db/metrics.ts __tests__/db/metrics-extended.test.ts
git commit -m "feat: make getProtocolConsistency data-driven from session_protocols"
```

---

### Task 12: Update `stopProgram` and data cleanup functions

**Files:**
- Modify: `src/db/programs.ts`
- Modify: `src/db/database.ts`

**Step 1: Add session_protocols cleanup to `stopProgram`**

In `src/db/programs.ts`, add before the sessions delete (line ~148):

```typescript
await db.runAsync(
  `DELETE FROM session_protocols WHERE session_id IN
   (SELECT id FROM sessions WHERE program_id = ?)`,
  [programId]
);
```

**Step 2: Add to `clearAllData` and `clearSampleData`**

In `src/db/database.ts`, add `DELETE FROM session_protocols;` in `clearAllData()` (before `DELETE FROM sessions`).

In `clearSampleData()`, add:
```sql
DELETE FROM session_protocols WHERE session_id IN (SELECT id FROM sessions WHERE is_sample = 1);
```
(before `DELETE FROM sessions WHERE is_sample = 1`)

**Step 3: Commit**

```bash
git add src/db/programs.ts src/db/database.ts
git commit -m "feat: propagate session_protocols cleanup to all delete paths"
```

---

### Task 13: Update seed data

**Files:**
- Modify: `src/db/seed.ts`

**Step 1: Update `SessionData` interface**

Replace:
```typescript
warmupRope: boolean;
warmupAnkle: boolean;
warmupHipIr: boolean;
conditioningDone: boolean;
```

With:
```typescript
protocols: { type: string; protocolKey: string | null; protocolName: string; completed: boolean }[];
```

**Step 2: Update `generateSessionData`**

Replace the warmup boolean generation (lines ~670-673) with protocol generation:

```typescript
const protocols: SessionData['protocols'] = [];

// Warmup protocols — vary by day template
const warmupKeys = ['jump_rope', 'full_ankle']; // standard warmup combo
for (const key of warmupKeys) {
  const name = key === 'jump_rope' ? 'Jump Rope — 3 min' : 'Full Ankle Protocol — 10 min';
  protocols.push({
    type: 'warmup',
    protocolKey: key,
    protocolName: name,
    completed: warmupPattern(sessionIndex, key === 'jump_rope' ? 85 : 70),
  });
}

// Conditioning
protocols.push({
  type: 'conditioning',
  protocolKey: null,
  protocolName: 'Assault Bike / Rows — 5 min',
  completed: warmupPattern(sessionIndex, 75),
});
```

**Step 3: Update `seedWorkoutSessions` INSERT**

Remove the warmup boolean columns from the session INSERT. Add protocol row inserts after the session INSERT:

```typescript
for (let i = 0; i < s.protocols.length; i++) {
  const p = s.protocols[i];
  await db.runAsync(
    `INSERT INTO session_protocols (session_id, type, protocol_key, protocol_name, completed, sort_order, is_sample)
     VALUES (?, ?, ?, ?, ?, ?, 1)`,
    [s.id, p.type, p.protocolKey, p.protocolName, p.completed ? 1 : 0, i]
  );
}
```

Note: Add `is_sample INTEGER DEFAULT 0` to the `session_protocols` table in schema.ts if not already there, so sample protocol data can be cleaned up with `clearSampleData`.

**Step 4: Run full test suite**

Run: `npm test`
Expected: All tests pass

**Step 5: Commit**

```bash
git add src/db/seed.ts src/db/schema.ts
git commit -m "feat: update seed data to use session_protocols"
```

---

### Task 14: Update existing tests

**Files:**
- Modify: `__tests__/db/sessions.test.ts`
- Modify: `__tests__/hooks/useWorkoutSession.test.ts`
- Modify: `__tests__/db/metrics-extended.test.ts`

**Step 1: Fix any remaining test failures**

Update any tests that reference:
- `warmup_rope`, `warmup_ankle`, `warmup_hip_ir`, `conditioning_done` on sessions
- `updateWarmup()` function
- `completeSession()` with conditioningDone parameter
- Hardcoded warmup prop names on components

Run the full suite and fix each failure:

Run: `npm test`

**Step 2: Commit**

```bash
git add __tests__/
git commit -m "test: update all tests for session_protocols refactor"
```

---

### Task 15: Final verification

**Step 1: Run full test suite**

Run: `npm test`
Expected: All tests pass

**Step 2: Type check**

Run: `npx tsc --noEmit`
Expected: No errors

**Step 3: Verify no remaining hardcoded warmup references**

Search for any remaining references to the old columns:
```bash
grep -r "warmup_rope\|warmup_ankle\|warmup_hip_ir\|warmupRope\|warmupAnkle\|warmupHipIr" src/ app/ --include="*.ts" --include="*.tsx"
```
Expected: No matches (only test files or comments if any)

**Step 4: Commit any final fixes and create PR**

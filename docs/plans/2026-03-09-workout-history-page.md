# Workout History Page Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add a "View all workouts →" link on the Workout tab that navigates to a full workout history page, grouped by program.

**Architecture:** New `app/history.tsx` route (push, not modal) with a ScrollView listing all completed sessions reverse-chronologically. Sessions grouped by program with header separators. New DB query fetches all completed sessions with program name joined. Existing session card style from workout tab reused.

**Tech Stack:** React Native, expo-router, SQLite (expo-sqlite), design tokens

---

### Task 1: DB Query — fetch all completed sessions with program name

**Files:**
- Modify: `src/db/sessions.ts`
- Modify: `src/db/index.ts`

**Step 1: Add the query to sessions.ts**

Add after `getRecentCompletedSessions`:

```typescript
/** Get all completed sessions with program name, ordered newest first */
export async function getAllCompletedSessions(): Promise<(Session & { program_name: string })[]> {
  const db = await getDatabase();
  return db.getAllAsync<Session & { program_name: string }>(
    `SELECT s.*, p.name as program_name FROM sessions s
     JOIN programs p ON p.id = s.program_id
     WHERE s.completed_at IS NOT NULL
     ORDER BY s.date DESC`
  );
}
```

**Step 2: Export from index.ts**

Add `getAllCompletedSessions` to the sessions export line.

**Step 3: Run tests**

Run: `npm test`
Expected: All pass (no breaking changes, additive only)

**Step 4: Commit**

```bash
git add src/db/sessions.ts src/db/index.ts
git commit -m "feat: add getAllCompletedSessions query with program name"
```

---

### Task 2: History screen — create `app/history.tsx`

**Files:**
- Create: `app/history.tsx`
- Modify: `app/_layout.tsx` (add Stack.Screen for history route)

**Step 1: Add Stack.Screen to _layout.tsx**

Add after the `settings` screen:

```typescript
<Stack.Screen name="history" />
```

**Step 2: Create app/history.tsx**

The screen:
- Header: back button + "Workout History" title (matches session/[id].tsx pattern)
- Loads all sessions via `getAllCompletedSessions()`
- Groups sessions by `program_id` — each group gets a header with `program_name`
- Each session renders as a card matching the workout tab recent card style:
  - Left: day name (formatted from `day_template_id`) + date + block name
  - Right: duration + set count
  - Tappable → `router.push(`/session/${s.id}`)`
- Enrichment: for each session, compute `durationMin` from `started_at`/`completed_at` and `setCount` from `getSetLogsForSession`

**Key implementation details:**
- Use `useFocusEffect` to load data on screen focus
- Group by iterating sessions (already sorted by date DESC) and inserting program headers when `program_id` changes
- Program header style: program name in `FontSize.sm`, `Colors.textMuted`, uppercase, with letter spacing — similar to section labels elsewhere
- Session card styles: reuse the exact same styles from workout.tsx `recentCard*` styles (copy them; extracting a shared component is premature)
- Back button: `router.back()` with Ionicons `chevron-back`

```typescript
// Grouping logic
interface HistoryGroup {
  programId: string;
  programName: string;
  sessions: EnrichedSession[];
}

// Build groups from flat sorted list
const groups: HistoryGroup[] = [];
for (const s of sessions) {
  const last = groups[groups.length - 1];
  if (last && last.programId === s.program_id) {
    last.sessions.push(s);
  } else {
    groups.push({ programId: s.program_id, programName: s.program_name, sessions: [s] });
  }
}
```

**Style tokens to use:**
- Container: `Colors.bg`, `Spacing.screenTop`, `Spacing.screenHorizontal`
- Header: back chevron + title, `FontSize.xl`, `Colors.text`, `fontWeight: '700'`
- Program group header: `FontSize.sectionLabel`, `Colors.textMuted`, uppercase, `letterSpacing: 0.5`
- Session cards: `Colors.card`, `Colors.border`, `BorderRadius.md`, `Spacing.lg`/`Spacing.xl` padding
- Date text: `Colors.textMuted`, `FontSize.sm`
- Stats: `Colors.textDim`, `FontSize.body`

**Step 3: Run tests and verify TypeScript**

Run: `npx tsc --noEmit && npm test`
Expected: All pass

**Step 4: Commit**

```bash
git add app/history.tsx app/_layout.tsx
git commit -m "feat: add workout history page with program-grouped sessions"
```

---

### Task 3: Add "View all workouts →" link to workout tab

**Files:**
- Modify: `app/(tabs)/workout.tsx`

**Step 1: Add the link below recent workouts section**

After the `recentSessions.map(...)` closing `})}`, add:

```tsx
<TouchableOpacity
  style={styles.viewAllButton}
  onPress={() => router.push('/history')}
>
  <Text style={styles.viewAllText}>
    View all workouts {'\u2192'}
  </Text>
</TouchableOpacity>
```

This goes inside the `recentSection` View, after the session cards — in both the no-program state and the with-program select phase.

**Step 2: Add styles**

Match the exercise detail `viewAll*` styles:

```typescript
viewAllButton: {
  paddingVertical: Spacing.md,
  alignItems: 'center',
},
viewAllText: {
  color: Colors.indigo,
  fontSize: FontSize.body,
  fontWeight: '600',
},
```

**Step 3: Run tests and verify TypeScript**

Run: `npx tsc --noEmit && npm test`
Expected: All pass

**Step 4: Commit**

```bash
git add "app/(tabs)/workout.tsx"
git commit -m "feat: add 'View all workouts' link on workout tab"
```

---

### Task 4: Verify on device

**Step 1: Build and deploy**

Run: `npm run device`

**Step 2: Manual verification checklist**

- [ ] Workout tab (with program, select phase) shows "View all workouts →" below recent sessions
- [ ] Workout tab (no program) shows "View all workouts →" below recent sessions
- [ ] Tapping link navigates to history page (slides from right)
- [ ] History page shows all completed workouts grouped by program
- [ ] Program group headers are visible between different programs
- [ ] Tapping a session card navigates to session detail
- [ ] Back button returns to workout tab
- [ ] Empty state: if no sessions exist, page handles gracefully (no crash)

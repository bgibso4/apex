# Programs: the store and the Library · Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** The app keeps its data in a SQL database on the phone, and Home's "Choose a program" opens Programs: the built-in programs as cards, the active one under "Active".

**Architecture:** Two new Mac-buildable modules. `Training` holds what a program is (a built-in definition, a run of it, which week a day falls in). `Store` is the only module that knows GRDB and SQL: it opens the database, migrates it, and reads and writes runs. `ProgramsModel` in `ScreenModels` turns the programs, the current run and today into the cards the screen draws. Tests use the real store in memory, so nothing is mocked.

**Tech Stack:** SwiftUI, Observation, GRDB 7.12.0 (SQLite), Swift Testing (Mac tests), XCTest (one picture, one journey step).

**Spec:** `apex-ios/docs/roadmap.md` segment 1; `design/export/APEX README.md`, "Lists, search, filters" › Programs; `design/export/overview-decisions.md`, Library turns 1 to 4; the reference build `design/export/app/library.dc.html`. The foundation's design is `docs/superpowers/specs/2026-11-27-ios-agentic-foundations-design.html` (repo root).

## Scope: segment 1 is two pull requests

The hand-off note asked for a split if the plan showed more than one pull request of work. It does.

- **This plan (1a):** the store, the `Training` module's first types, Programs (the Library), Home's "Choose a program" opening it.
- **Next plan (1b), not written here:** the program preview (top card, Weeks, Progression, the lift and block sheets), Start, and with them: a card opening its preview, the Library's motion (labels and cards rising in, bars growing, a card pressing in), and the journey that starts a program, kills the app and finds it still active.

In 1a a program card opens nothing, so it is not a button and does not press in. Nothing in the app writes a run yet: `Store.startRun` is called by tests and by the designed state's fixture, and gets its first caller in the app with Start.

## The store: three ways compared, and the choice

Ben's rules (memory "iOS data stack", `AGENTS.md`): the phone's SQL database is the source of truth; migrations are tested on the Mac; tests stay fast; Swift 6. Looked up on 2026-11-27 in Axiom's data skills (27.1.2: `grdb.md`, `swiftdata-migration.md`, `sqlitedata-migration.md`, `database-migration.md`), GRDB's own documentation (Migrations, Concurrency, its `Package.swift`, the GRDB 7 migration guide) and its releases page.

| | GRDB 7 | SwiftData | SQLite behind our own layer |
|---|---|---|---|
| **A SQL database that is the truth** | Yes. We write the tables in SQL; the file is plain SQLite that any tool, and Cloudflare's D1, reads as it is | No. The file is SQLite, but the tables are Core Data's (`ZPROGRAMRUN`, `Z_PK`), made from Swift classes. The schema is never ours to write, a backup to D1 needs a second mapping, and the old app's SQLite file (segment 11) needs separate SQLite code anyway | Yes, the same as GRDB |
| **Migrations tested on the Mac** | `DatabaseMigrator`: named migrations, run once, in order. `migrate(_:upTo:)` exists for tests: build the old schema, add rows, migrate, check them. Runs on macOS in memory | `VersionedSchema` and a migration plan. Every old version of every model class stays in the code. A custom stage sees the old models or the new ones, never both. Axiom's own checklist says a pass on the simulator does not show it is safe and asks for a real device | Testable, but we write the migrator first: the version table, the ordering, the transaction around each step |
| **Fast tests** | An in-memory `DatabaseQueue()` per test: milliseconds, on the Mac | An in-memory container works on the Mac too | Milliseconds |
| **Swift 6** | Built in Swift 6 language mode (tools 6.1). Records are `Sendable` structs; the queue is `Sendable`; sync and `async` access | `@Model` classes and `ModelContext` are not `Sendable`: values cross actors as identifiers and are fetched again | A `sqlite3` handle is an unsafe pointer: sharing it needs a lock or an actor that we write and prove, and `@unchecked Sendable` is banned here |
| **Cost** | One package, MIT, pinned with `exact:`. Latest release 7.12.0 on 2026-11-01. A longer clean build | Nothing to add. Filing-cabinet uses it | No package, but statement binding, row decoding, transactions, the migrator and the locking are ours to write and test: several hundred lines that are not the app |

Also looked at: SQLiteData (Point-Free, built on GRDB). It adds table macros and CloudKit sync, and reaches the database through a global dependency. We need neither, and the hard rules say collaborators are injected.

**Choice: GRDB 7.12.0, used only inside `Store`.** It is the one option where the SQL is ours and the migrator, the locking and the row decoding are already written and tested by someone else. No other module imports it, so replacing it later changes one module.

Decisions that follow from it:

- **Migrations are SQL text**, one per change, named `v1`, `v2`, …. The SQL is what a reviewer, the backup and the old-records import read.
- **A merged migration never changes.** `StoreTests/schema.sql` holds the schema after every migration; a test compares. Each migration after `v1` gets a test that builds the schema before it, adds rows, migrates and checks the rows.
- **Tables are `STRICT`**, and a column whose text has a shape checks it (`CHECK`), so a bad value is refused when it is written.
- **A calendar day is stored as text, `2026-08-03`**, never as an instant: a schedule is in days, and an instant read in another time zone lands on another day.
- **A database from a newer build is refused**, never written to: every worktree's build has the same bundle ID, so an older build can meet a newer file on the phone.
- **Reads and writes are synchronous** for now. They are single-row queries on one connection; a screen's state is complete the moment its model exists, which is what a picture needs. A later segment with long lists can add `async` reads or observation inside `Store` without changing this.
- **One connection (`DatabaseQueue`)**, in Application Support, which the phone's own backup includes.

## Global Constraints

- Every hard rule in `apex-ios/AGENTS.md` holds: tokens only, no shadows, no accessibility work, middots in copy and never em dashes, one primary type per file, `package` access between package modules and `public` only for what the app or tests use, `os.Logger` (subsystem `com.cadre.apex`, category = module), `try?` only with a comment, third-party packages pinned with `exact:`, Swift Testing for Mac tests.
- Only `Screens` imports SwiftUI or UIKit. Only `Store` imports GRDB (its tests too).
- No lint config, hook config, test tolerance or time ceiling changes.
- Only `apex-ios/` and `docs/superpowers/handoff.md` change. Nothing under `apex-rn/` or `workers/`.
- The built-in programs, and all behaviour, are tested on the Mac. Simulator test time is added only for what no Mac test covers, and its cost is reported.
- Nothing for backup or restore (segment 16). Nothing that reads the old app's database (segment 11).
- A value the design system names comes from its token. Where the demo and `APEX README.md` differ, the README wins (card padding 14 × 16, card gap 12, section gap 24, tint 10%).

## Defaults taken (each goes in the report)

1. **The native app has its own schema**, shaped for the redesign (the lead's default, hand-off note).
2. **The built-in programs are Ben's three real ones**, from `apex-rn/src/data/*.json`: card data only for now (name, blocks and weeks, days a week). The mock's six are sample content and live in `TestSupport` for the picture. Deload blocks become a week inside the block before them, as the design says ("a deload is a week inside a block").
3. **Goal, level and the one line are new per-program fields** the old definitions do not have. Written here, for Ben to correct:

   | id | Name | Goal · Level | Line | Blocks (weeks; d = deload) | Days |
   |---|---|---|---|---|---|
   | `functional-athlete` | Functional Athlete | Hybrid · Intermediate | Strength, power and conditioning, six days a week. | Hypertrophy 5 (5th d) · Strength 5 (5th d) · Realization 1 | 6 |
   | `functional-athlete-pillars` | Pillars | Hybrid · Intermediate | Functional Athlete with more for hips, core and back. | the same | 6 |
   | `pillars-hypertrophy` | Pillars Hypertrophy | Hypertrophy · Intermediate | Six weeks of Pillars' hypertrophy block, no deload. | Hypertrophy 6 | 6 |

   The old names carry em dashes ("Functional Athlete — Pillars"), which the copy rule bans; the mock and Home already say "Pillars".
4. **The current run is the newest one.** Ending a run, and what Start does when one is active, arrive with the screens that do them (1b and segment 2), each with its migration.
5. **A run stays under Active until something ends it.** Before its first day or after its last week the card has no "Week N of M" tag and no blue bar; bars before today are done.
6. **A run whose program is no longer built in** shows no Active section; every program is listed. It is logged as an error.
7. **The app stops at launch if the database cannot be opened**, with the reason logged: there is no designed screen for it, and running without the source of truth would lose what Ben logs.
8. **The pushed screen's header is the system's inline title.** The design's "pulling down brings in the large title" is not built: SwiftUI has no way to open a large-title bar collapsed, and a hand-made one belongs to every pushed screen, so it is its own piece of work. In the report under NEEDS BEN.
9. **The list with no active program has no mock** (the demo says so). Built from the rule (no labels, just the cards), checked by Mac tests and one screenshot opened by hand; no picture test, as a designed state needs a mock.
10. **New tokens, from the demo where the README names no value:** colours `bar-done` #A4A5AC, `bar-upcoming` #2C3039, `bar-plain` #3A3F4A; type `program-name` 20/700 (the README's own words) and `metric-label` 11/600.

## Review Focus

1. **A run whose program is gone from the catalog.** Expected: no Active section, nothing crashes. Pinned in Task 4.
2. **Today outside the run's weeks** (before its start, after its last week). Expected: no tag, no blue bar, no "Week 12 of 11". Pinned in Tasks 2 and 4.
3. **A database from a newer build.** Expected: the store refuses to open and writes nothing. Pinned in Task 3.
4. **The day near midnight and in another time zone.** Expected: today is the phone's calendar day, and the week follows it when the app has stayed open overnight. Pinned in Tasks 1 and 4.
5. **A day that is not a day in the database** (`2026-13-45`, an empty string). Expected: the write is refused by the table; a read of one reports an error and never invents a date. Pinned in Tasks 1 and 3.

---

### Task 0: The numbers before

- [x] **Step 1:** On a clean tree run and note wall time and test counts: `make fast` (twice, the second is the warm one), `make build`, `make gate`. They go in the hand-off as "before".

### Task 1: `Day`, a calendar day

**Files:**
- Create: `Packages/ApexKit/Sources/Core/Day.swift`
- Test: `Packages/ApexKit/Tests/CoreTests/DayTests.swift`

**Interfaces:**
- Produces:
  ```swift
  public struct Day: Hashable, Comparable, Sendable {
      public init(_ date: Date, in calendar: Calendar)   // the calendar's day for that instant
      public init?(iso: String)                           // "2026-08-03"; nil unless exactly yyyy-MM-dd and a real day
      public var iso: String
      public func days(since other: Day) -> Int           // negative when self is earlier
  }
  ```

- [x] **Step 1: Write the failing tests** (`DayTests`):
  - `theDayIsTheCalendarsNotGMTs`: 2026-08-21 02:00 GMT is `2026-08-20` in America/Toronto and `2026-08-21` in GMT.
  - `isoRoundTrips`: `Day(iso: "2026-08-03")?.iso == "2026-08-03"`.
  - `whatIsNotADayIsNil`, parameterised: `""`, `"2026-13-45"`, `"2026-02-30"`, `"2026-8-3"`, `"20260803"`, `"2026-08-03T00:00:00Z"`, `" 2026-08-03"`.
  - `daysBetween`: Aug 20 since Aug 3 is 17; Aug 3 since Aug 20 is -17; Mar 1 since Feb 28 2026 is 1; across the autumn clock change (2026-11-02 since 2026-10-31) is 2.
  - `daysAreOrdered`: `2026-08-03 < 2026-08-20`, `2025-12-31 < 2026-01-01`.
- [x] **Step 2:** `make fast`: fails to compile (no `Day`).
- [x] **Step 3: Implement.** Stored year, month, day. Day arithmetic through a Gregorian calendar fixed to GMT, so no clock change can shorten a day.
- [x] **Step 4:** `make fast` passes; `make lint` clean.
- [x] **Step 5: Commit** `feat(ios): Day, a calendar day`.

### Task 2: The `Training` module: a program, a run, the built-in programs

**Files:**
- Create: `Packages/ApexKit/Sources/Training/Program.swift`, `ProgramRun.swift`, `BuiltInPrograms.swift`
- Test: `Packages/ApexKit/Tests/TrainingTests/ProgramRunTests.swift`, `BuiltInProgramsTests.swift`
- Modify: `Packages/ApexKit/Package.swift` (target `Training` depending on `Core`, its product, `TrainingTests`), `project.yml` (the app's `Training` product; `ApexKit/TrainingTests` in the `Fast` scheme)

**Interfaces:**
- Consumes: `Day` (Task 1).
- Produces:
  ```swift
  public struct Program: Identifiable, Equatable, Sendable {
      public struct Week: Equatable, Sendable { public let isDeload: Bool }
      public struct Block: Equatable, Sendable { public let name: String; public let weeks: [Week] }
      public let id: String
      public let name, goal, level, line: String   // goal and level are open lists: text, not an enum
      public let blocks: [Block]
      public let daysAWeek: Int
      public var weekCount: Int { get }
      public init(id:name:goal:level:line:blocks:daysAWeek:)
      public static let builtIn: [Program]
  }
  extension Program.Block { public init(_ name: String, weeks: Int, deloadLast: Bool = false) }
  public struct ProgramRun: Equatable, Sendable {
      public let programID: Program.ID
      public let startedOn: Day
      public init(programID:startedOn:)
      /// 1 for the first seven days, and so on. Nil before the first day and after the last week.
      public func week(on day: Day, of program: Program) -> Int?
  }
  ```

- [x] **Step 1: Write the failing tests.**
  - `ProgramRunTests`, on an 11-week program started 2026-08-03: Aug 3 → 1; Aug 9 → 1; Aug 10 → 2; Aug 20 → 3; the last day (Oct 18) → 11; Oct 19 → nil; Aug 2 → nil.
  - `BuiltInProgramsTests`: ids are unique; the ids are exactly `functional-athlete`, `functional-athlete-pillars`, `pillars-hypertrophy`, in that order; week counts 11, 11, 6; every program has 6 days a week; Pillars' blocks are Hypertrophy 5, Strength 5, Realization 1 with weeks 5 and 10 the only deloads; Pillars Hypertrophy has no deload; no name, goal, level or line contains an em dash or is empty.
- [x] **Step 2:** `make fast` fails (`check-fast-scheme` until the scheme lists the target, then no `Training`).
- [x] **Step 3: Implement** with the values in "Defaults taken", 3.
- [x] **Step 4:** `make fast`, `make lint` pass.
- [x] **Step 5: Commit** `feat(ios): the Training module: programs, a run and its week`.

### Task 3: The `Store` module

**Files:**
- Create: `Packages/ApexKit/Sources/Store/Store.swift`, `StoreError.swift`, `Migrations.swift`, `ProgramRunRow.swift`
- Test: `Packages/ApexKit/Tests/StoreTests/StoreTests.swift`, `MigrationTests.swift`, `schema.sql`
- Modify: `Packages/ApexKit/Package.swift` (GRDB `exact: "7.12.0"`; target `Store` depending on `Core`, `Training`, `GRDB`; `StoreTests` depending on `Store`, `Training`, `Core`, `GRDB`), `project.yml` (the app's `Store` product, `ApexKit/StoreTests` in `Fast`), `Package.resolved` (by the procedure in `AGENTS.md`, "Commands"), `scripts/test-map.txt`

**Interfaces:**
- Consumes: `Day`, `Program.ID`, `ProgramRun`.
- Produces:
  ```swift
  public struct Store: Sendable {
      public enum Location: Sendable { case inMemory, file(URL) }
      /// Opens the database, making its folder if needed, and brings it to the newest schema.
      /// Throws `StoreError.newerSchema` for a database a newer build has migrated, and changes nothing in it.
      public init(_ location: Location) throws
      public func currentRun() throws -> ProgramRun?            // the newest run
      public func startRun(of programID: Program.ID, on day: Day) throws
  }
  public enum StoreError: Error, Equatable { case newerSchema, notADay(String) }
  package enum Migrations { package static let migrator: DatabaseMigrator }
  ```
- `v1`, exactly:
  ```sql
  CREATE TABLE program_run (
      id INTEGER PRIMARY KEY,
      program_id TEXT NOT NULL CHECK (program_id <> ''),
      started_on TEXT NOT NULL CHECK (started_on GLOB '[0-9][0-9][0-9][0-9]-[0-9][0-9]-[0-9][0-9]')
  ) STRICT
  ```

- [x] **Step 1: Write the failing tests.**
  - `StoreTests`: `aNewStoreHasNoRun`; `aStartedRunIsTheCurrentOne` (program `functional-athlete-pillars`, day 2026-08-03, read back equal); `theNewestRunIsTheCurrentOne`; `aRunSurvivesClosingTheFile` (a file in a new temporary folder that does not exist yet: open, start, let the store go, open again, read; remove the folder after); `aDayThatIsNotADayIsReported` (open a file store, close it, write `started_on = '2026-13-45'` with a plain GRDB queue, which passes the `GLOB`, reopen: `currentRun()` throws `StoreError.notADay("2026-13-45")`).
  - `MigrationTests`: `theSchemaIsTheCommittedOne` (after `Migrations.migrator.migrate` on an in-memory queue, every `sql` in `sqlite_master` for objects that are not SQLite's or GRDB's own, ordered by name and joined with `;\n`, equals `schema.sql` beside the test, read by `#filePath`); `theTableRefusesABadDay` (inserting `started_on` of `''` or `'Aug 3'` throws); `theTableRefusesAnEmptyProgram`; `aDatabaseFromANewerBuildIsRefused` (a file migrated by the real migrator plus one more registered migration `v999`: `Store(.file(url))` throws `.newerSchema`, and the file's `grdb_migrations` rows are unchanged).
- [x] **Step 2:** `make fast` fails.
- [x] **Step 3: Implement.** A `DatabaseQueue`. The newer-schema check uses the migrator's own test for it (`hasBeenSuperseded`), before migrating. `ProgramRunRow` is the one place a row becomes a `ProgramRun`.
- [x] **Step 4:** `make fast`, `make lint`, `make build`, `make unused` pass. Note the clean-build and warm `make fast` times with GRDB.
- [x] **Step 5:** `scripts/test-map.txt`: `Packages/ApexKit/Sources/Training/ ALL` and `Packages/ApexKit/Sources/Store/ ALL` under "Shared".
- [x] **Step 6: Commit** `feat(ios): the store: a SQL database on the phone, its first table and migration`.

### Task 4: The screen models, the fixtures, the app's wiring

**Files:**
- Create: `Packages/ApexKit/Sources/ScreenModels/Programs/ProgramsModel.swift`, `ProgramCard.swift`, `ProgramsSection.swift`, `WeekBar.swift`; `Sources/ScreenModels/Stat.swift`; `Sources/ScreenModels/Home/HomeDestination.swift`; `Sources/TestSupport/SamplePrograms.swift`, `FixtureStore.swift`
- Modify: `Sources/ScreenModels/AppModel.swift`, `Home/HomeModel.swift`, `Sources/TestSupport/DesignedState.swift`, `App/ApexApp.swift`, `Package.swift` (`ScreenModels` depends on `Core`, `Training`, `Store`; `TestSupport` adds them too), `scripts/test-map.txt`
- Test: `Tests/ScreenModelsTests/ProgramsModelTests.swift`, `HomeModelTests.swift`, `Tests/TestSupportTests/SampleProgramsTests.swift`

**Interfaces:**
- Consumes: `Program`, `ProgramRun`, `Store`, `Day`.
- Produces:
  ```swift
  public nonisolated struct Stat: Equatable, Sendable { public let value, label: String }
  public nonisolated struct WeekBar: Equatable, Sendable {
      public enum Fill: Sendable { case done, current, upcoming, plain }   // plain: a program that is not active
      public let isDeload: Bool
      public let fill: Fill
  }
  public nonisolated struct ProgramCard: Equatable, Identifiable, Sendable {
      public struct Block: Equatable, Sendable { public let name: String; public let bars: [WeekBar] }
      public let id: Program.ID
      public let eyebrow, name, line: String   // eyebrow: "Strength · Intermediate"
      public let tag: String?                  // "Week 3 of 11"
      public let blocks: [Block]
      public let stats: [Stat]                 // Weeks, Days a week
  }
  public nonisolated struct ProgramsSection: Equatable, Identifiable, Sendable {
      public let label: String?                // "Active", "All programs", or nil
      public let cards: [ProgramCard]
  }
  @Observable public final class ProgramsModel {
      public private(set) var sections: [ProgramsSection]
      public init(programs: [Program], store: Store, today: @escaping () -> Day)   // loads at once
      public func refresh()                    // the screen calls it each time it appears
  }
  public nonisolated enum HomeDestination: Hashable, Sendable { case programs }
  // HomeModel: public var path: [HomeDestination]; public func chooseProgram(); init(lastEnded:calendar:path: = [])
  // AppModel: public let programs: ProgramsModel; init(selectedTab: = .home, home:, programs:)
  // TestSupport: extension Program { public static let samples: [Program] }  (the mock's six)
  //              extension Store { static func fixture(run: ProgramRun? = nil) -> Store }  (in memory; a failure stops with a message)
  ```

- [x] **Step 1: Write the failing tests.**
  - `SampleProgramsTests`: the six names in the mock's order (Pillars, Anchor, Summit, Foundations, Rebuild, Engine); weeks 11, 6, 12, 8, 4, 8; days 5, 4, 4, 3, 3, 4.
  - `ProgramsModelTests`, with `Program.samples`, an in-memory store and a fixed today:
    - `withNoRunThereAreNoLabels`: one section, label nil, six cards in catalog order, every bar `.plain`, no tag.
    - `theActiveProgramSitsAloneUnderActive`: Pillars started 2026-08-03, today 2026-08-20 → sections "Active" (Pillars) and "All programs" (the other five in order).
    - `theActiveCardShowsItsWeek`: tag "Week 3 of 11"; bars in order done, done, current, then upcoming; week 5 and week 9 are deloads; Hypertrophy has 5 bars, Strength 4, Peak 2.
    - `aCardSaysWhatTheProgramIs`: Summit: eyebrow "Strength · Advanced", line "Builds to a heavy single on each main lift.", stats `[Stat("12", "Weeks"), Stat("4", "Days a week")]`.
    - `beforeItsFirstDayARunHasNoWeek`: today 2026-08-02 → under Active, tag nil, every bar `.upcoming`.
    - `afterItsLastWeekARunHasNoWeek`: today 2026-10-19 → under Active, tag nil, every bar `.done`.
    - `aRunOfAProgramThatIsGoneShowsNoActive`: run of `"retired"` → one section, label nil, six cards.
    - `refreshFollowsTheDayAndTheStore`: today moves from Aug 9 to Aug 10 → after `refresh()` the tag reads "Week 2 of 11"; a run started through the store after the model was made appears after `refresh()`.
    - `theOnlyProgramBeingActiveLeavesNoAllPrograms`: a catalog of one, active → one section, "Active".
  - `HomeModelTests`: `choosingAProgramOpensPrograms` (`path == [.programs]`; calling it twice leaves one).
- [x] **Step 2:** `make fast` fails.
- [x] **Step 3: Implement.** `refresh()` reads the store; on an error it logs and keeps what it had. `ApexApp` opens `Store(.file(URL.applicationSupportDirectory.appending(path: "apex.sqlite")))`, and on a failure logs a fault and stops with the same message (as it does for an unknown state). A designed state never opens that file. `DesignedState.homeNoProgram` gets `Program.samples` and an empty fixture store.
- [x] **Step 4:** `make fast`, `make lint`, `make build` pass.
- [x] **Step 5:** `scripts/test-map.txt`: `Packages/ApexKit/Sources/ScreenModels/Programs/ AppJourneyTests ProgramsPictureTests`; `Packages/ApexKit/Sources/ScreenModels/Stat.swift ALL`.
- [x] **Step 6: Commit** `feat(ios): the Programs model, and Home's way to it`.

### Task 5: The screen, its designed state and its picture

**Files:**
- Create: `Sources/Screens/Programs/ProgramsScreen.swift`, `ProgramCardView.swift`; `Sources/Screens/DesignSystem/BlockBars.swift`, `ProportionalRow.swift`, `StatRow.swift`, `Tag.swift`; `SnapshotTests/ProgramsPictureTests.swift`; `design/mocks/programs.active.png` (by `make mocks`); `SnapshotTests/__Snapshots__/ProgramsPictureTests/state.programs-active.png` (recorded)
- Modify: `design/tokens.json` and the generated `Tokens.swift` (`make generate`), `design/states.json`, `Sources/TestSupport/DesignedState.swift`, `Sources/Screens/Home/HomeScreen.swift`, `NoProgramCard.swift`, `scripts/test-map.txt`, `Tests/TestSupportTests/DesignedStateTests.swift`

**Interfaces:**
- Consumes: `ProgramsModel`, `ProgramCard`, `WeekBar`, `Stat`, `HomeModel.path`, `HomeModel.chooseProgram()`.
- Produces: the designed state `programs.active` (`DesignedState.programsActive`): `Program.samples`, Pillars started 2026-08-03, today 2026-08-20, Home's path `[.programs]`.

Measurements, all from `design/export/app/library.dc.html` unless a token is named:
- Screen: inline title "Programs"; content starts `Tokens.Spacing.contentTop` under the bar; side padding `screenPadding`; a label 8 above its card (`sectionLabelGap`), 24 after the card before it (`sectionGap`), inset 2 from the cards' edge; cards 12 apart (`cardGap`).
- Card (the `Card` component): eyebrow row (the `Eyebrow`, and the tag at its right); name 6 under it, `programName`; line 4 under, `helper`, `textSecondary`, line height 1.45; bars 16 under; stats 14 under, their hairline (`border`, 1 pt) edge to edge of the card, the stats 12 under the hairline.
- `Tag`: 20 high, 8 side padding, pill, `accentTint` fill, `accent` text at 11/700 (the eyebrow's font, no uppercase, no tracking).
- `BlockBars`: blocks 10 apart, each as wide as its share of the weeks but never narrower than its label; bars 3 apart, 8 high (a deload 4, centred), radius 2; the block's name 6 under its bars as an `Eyebrow` on one line, truncated. Fills: done `barDone`, current `accent`, upcoming `barUpcoming`, plain `barPlain`.
- `StatRow`: equal columns, a 1 pt `border` line between them; value `recordValue` in `text`, label 2 under it in `metricLabel`, `textMuted`; numerals tabular.

- [x] **Step 1:** Tokens: add the five in "Defaults taken", 10 to `design/tokens.json`; `make generate`. `design/states.json`: `{ "name": "programs.active", "page": "design/export/app/library.dc.html" }`; `make mocks STATE=programs.active`; open the image.
- [x] **Step 2: Write the failing tests.** `DesignedStateTests`: `programsActiveIsTheMocksLibrary` (Home's path is `[.programs]`; the sections are "Active" with Pillars tagged "Week 3 of 11", then "All programs" with five). Add the `DesignedState` case and `SnapshotTests/ProgramsPictureTests.swift` (one test: `SnapshotHost.assertStates(ofScreen: "programs")`), and its `test-map.txt` row: `Packages/ApexKit/Sources/Screens/Programs/ AppJourneyTests ProgramsPictureTests`.
- [x] **Step 3: Build the screen.** `HomeScreen`'s stack takes `$model.path` and a destination for `.programs`; `NoProgramCard` takes the action for "Choose a program". `ProgramsScreen` draws `model.sections` and calls `refresh()` when it appears. `ProportionalRow` is a `Layout`: each child's width is its weight's share of what is left after the gaps, raised to the child's own minimum, the others sharing the rest.
- [x] **Step 4:** `make fast`, `make lint`, `make build`. Then on a freshly booted simulator: `make snapshots-record ONLY=ApexSnapshotTests/ProgramsPictureTests`, `make retest ONLY=ApexSnapshotTests/ProgramsPictureTests`, `make compare STATE=programs.active`. Open `build/compare/programs.active.png` and fix what differs from the mock for a reason other than the defaults taken. `HomePictureTests` passes on its unchanged reference.
- [x] **Step 5:** The list with no active program: `make run`, tap through to Programs, take a screenshot (`xcrun simctl io <simulator> screenshot`), open it.
- [x] **Step 6: Commit** `feat(ios): Programs, the Library: the built-in programs as cards` (the body names the new reference image).

### Task 6: The journey step, and the whole gate

**Files:**
- Modify: `UITests/AppJourneyTests.swift`

- [x] **Step 1:** In the existing journey, after the tabs and before the lab: tap "Choose a program"; the navigation bar "Programs" appears within 5 s and the text "Pillars Hypertrophy" exists; tap the bar's back button; Home's card appears. This is the real app on a real database file: a store that failed to open would have stopped the launch.
- [x] **Step 2:** `make gate` green. Note the test time, its share of the ceiling and the five slowest.
- [x] **Step 3: Commit** `test(ios): the journey opens Programs from Home`.

### Task 7: Docs, evidence, review, merge

- [ ] **Step 1:** `AGENTS.md`: the map (`Training`, `Store`, the new folders), the module table, a section "The store" (the decisions listed under the comparison above, and how to add a migration: a new `vN` in `Migrations.swift`, its SQL, update `schema.sql`, a test that carries rows across), the measured times. `CLAUDE.md`, "Where we are". `docs/roadmap.md`: segment 1 as 1a (ticked) and 1b.
- [ ] **Step 2:** `make ci-checks` green (after a commit, as it starts with the drift check).
- [ ] **Step 3:** One `ios-verifier` agent for the evidence (`make build`, `make fast`, `make gate`); one fresh reviewer agent on the branch against this plan and `AGENTS.md`. Fix what they find.
- [ ] **Step 4:** Push, open the pull request (images opened, anything not verified, the defaults). CI green on `checks`, `plan` and `gate`: merge with a merge commit, delete `feat/ios-programs` and `docs/ios-roadmap` on the remote.
- [ ] **Step 5:** Rewrite `docs/superpowers/handoff.md` (before the merge, so it rides with the code), then report to the lead.

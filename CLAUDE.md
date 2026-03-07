# APEX — iOS Strength Training App

## Project Goals

APEX is a personal iOS strength training companion that tracks periodized programs, logs workouts, monitors lift progression, and supports supplementary training goals (running, and eventually swimming, cycling, mobility). The app tracks where you are and brings you back there.

**Requirements:**
- Follow a structured program with auto-calculated weights from 1RM percentages
- Log sets with one tap (as prescribed) — only interact more when something differs
- Never lose workout state — survive app kills, restore to exact position on relaunch
- Track estimated 1RM trends over time using Epley formula
- Support supplementary goals as swappable modules (running in v1, extensible to others)
- Provide actionable progress metrics: 1RM trends, compliance, volume vs plan

## Top 3 Priorities

Every decision should be evaluated against these, in order:

1. **Usability** — Used mid-workout with sweaty hands and limited attention. Every interaction must be fast, obvious, and forgiving. One-tap for common actions. Large tap targets. No ambiguity.
2. **Aesthetics** — Clean, minimalist, premium. Dark theme, high contrast, deliberate spacing, no visual clutter. Every element earns its place. Thoughtful animations that enhance understanding and feel are encouraged — not every transition needs to be instant.
3. **Performance** — Instant feedback. No jank during scrolling or transitions. SQLite queries must be fast. The app must feel native.

## Design Tenets

- **Mockup-first design.** Every new page or feature starts with an HTML mockup in `docs/mockups/` before any implementation. Mockups are the contract — agree on what it looks like and how it behaves, then build it. Mockup filenames include a date suffix for versioning (e.g., `home-2026-03-07.html`), so the design evolution is tracked over time. Never skip straight to code without a visual reference. **Always pause after creating a mockup and get explicit user approval before proceeding to implementation.** Open the mockup for the user (`open <path>`) and wait for feedback. Do not assume the mockup is approved.
- **Optimize for the common case.** Tap to log as prescribed. Only require more interaction when something differs.
- **State is sacred.** Persist to SQLite, restore on relaunch. In-progress sessions survive app kills.
- **Progressive disclosure.** Clean at first glance, details on demand. Cards collapsed by default. Notes collapsed. RPE optional.
- **No vanity metrics.** Every metric must be actionable or tell a story. 1RM trends > total tonnage. Compliance > raw set counts.
- **Minimalist and premium.** Dark, high contrast, gym-proof. Generous whitespace. Purposeful animations. Nothing extraneous.
- **Tokens, not magic numbers.** All styling flows from semantic design tokens. Components never use raw hex values or hardcoded spacing.

## Engineering Tenets

- **Use Superpowers skills.** Always use the installed Superpowers skills for structured workflows — brainstorming, TDD, debugging, planning, code review, verification, and parallel work. Check for applicable skills before starting any task.
- **Test-driven development (TDD).** Write tests first, then build code to make them pass.
- **Always verify with tests.** Every change must be validated by running the test suite before considering it complete.
- **Design for extensibility.** Use established software design patterns. The supplementary goals system, the program model, and the DB layer should all support future expansion without rewrites.
- **End-to-end testing.** Maintain an E2E test suite that validates critical user flows (start workout, log sets, finish, view progress). Run it frequently.
- **Keep it simple.** Don't over-abstract. Three similar lines > a premature abstraction. Add complexity only when the current task requires it.

## Tech Stack

- **Platform:** iOS (React Native — currently Expo SDK 54, may move to bare React Native)
- **Routing:** expo-router (file-based, `app/` directory)
- **Database:** SQLite (expo-sqlite) — the database must persist across app reinstalls/updates
- **Animations:** react-native-reanimated + react-native-gesture-handler
- **Language:** TypeScript (strict)
- **Testing:** Jest + @testing-library/react-native

## Project Structure

```
app/                    # Screens (file-based routing)
  (tabs)/               # Bottom tab navigator
    index.tsx           # Home dashboard
    workout.tsx         # Workout logging
    progress.tsx        # Progress tracking
    running.tsx         # Running log + trends (swappable 4th tab)
  session/[id].tsx      # Past workout detail (read-only)
  exercise/[id].tsx     # Lift detail view
  library.tsx           # Program library (modal)
  activate.tsx          # Program activation (modal)
  settings.tsx          # Settings
src/
  components/           # Reusable UI components
  db/                   # SQLite database layer (schema, migrations, domain queries)
  hooks/                # Custom React hooks
  theme/                # Design token system (colors, spacing, typography, radii, sizes)
  types/                # TypeScript type definitions
docs/
  plans/                # Design docs and implementation plans
  mockups/              # HTML mockups (visual source of truth)
```

## Navigation

- **Bottom tabs (4):** Home | Workout | Progress | [Supplementary Goal]
- The 4th tab is configurable via Settings — currently Running, but designed to swap for other goal types (swimming, cycling, mobility) as they're built
- Library and Activate are modals (slide up)
- Settings accessed from gear icon on Home
- On launch: check SQLite for in-progress session -> restore to Workout tab if found

## Design Token System

Components must use semantic tokens, never raw values:

- **Colors:** `Colors.bg`, `Colors.card`, `Colors.text`, `Colors.indigo`, `Colors.green`, etc. (`src/theme/colors.ts`)
- **Spacing:** `Spacing.sm`, `Spacing.cardPadding`, `Spacing.screenHorizontal` (`src/theme/spacing.ts`)
- **Typography:** `FontSize.body`, `FontSize.title`, `FontSize.screenTitle`
- **Radii:** `BorderRadius.button`, `BorderRadius.cardInner`, `BorderRadius.pill`
- **Sizes:** `ComponentSize.buttonLarge`, `ComponentSize.dayDotSize`

New tokens go in the theme files. Never hardcode values in components.

## Testing

- **TDD workflow:** Write failing tests -> implement -> verify green -> refactor
- **Unit tests** (`__tests__/db/`, `__tests__/utils/`): Node environment, test DB and business logic
- **Component tests** (`__tests__/components/`, `__tests__/hooks/`): react-native preset
- **E2E tests:** Critical user flows (workout logging, session restore, progress viewing)
- Run: `npm test`
- Always run tests before considering a change complete

## Key References

- Interaction design: `docs/plans/2026-03-04-apex-interactions-design.md`
- HTML mockups in `docs/mockups/` are the visual source of truth
- When in doubt about look or behavior, check the mockups first

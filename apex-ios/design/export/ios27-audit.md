# iOS 27 audit — 2026-11-07

A pass over everything designed so far (Home, Calendar, History, Program summary, app-wide chrome) against Apple's current guidance: the Human Interface Guidelines as of November 2026 (Sheets updated March 24, 2026; Toolbars, Tab bars, Color, Buttons updated for Liquid Glass December 16, 2025; Tab bars terminology June 8, 2026) and WWDC26 (Platforms State of the Union; "Design intuitive search experiences"). Status: items 1–6 applied 2026-11-07 after review in iOS 27 Compare. #4 shipped as sleep bar #70727A only (recovery bar unchanged); #5 shipped as option (c) below, standard inline 17/700, not the large title. Items 7–12 remain build notes / later design.

## What iOS 27 changed

- **Liquid Glass retuned:** better diffusion of busy content behind glass, a darkened edge, brighter specular highlights. Apps on system glass get it automatically, no recompile.
- **Transparency slider:** Settings › Appearance › Liquid Glass, from more clear to more tinted; the new default is more tinted than iOS 26.
- **Scroll edge:** when content scrolls under floating bars, a uniform toolbar appears across the top for legibility (automatic on standard toolbars).
- **Tab bars:** search can sit back inside the tab bar; a new prominent tab role pins one tab to the trailing edge.
- **Toolbars (SwiftUI):** visibility priority, an overflow menu container, a pinned-trailing placement.
- **Resizable iPhone apps:** rebuilt apps resize (iPhone Mirroring, iPad); layouts must adapt to width.
- **Context menus:** glassy material with a darker floating edge.

## Change — recommended

| # | Issue | Where | Guidance | Proposed fix |
|---|---|---|---|---|
| 1 | Muted text fails contrast: #55575F on cards is about 2.5–2.6:1 (needs 4.5:1 for text) | Eyebrows, dates, axis and block labels, "Same", meta counts, every screen | WCAG / HIG accessibility: text 4.5:1 | Lift the muted token to #7C7E86 (4.5–4.7:1 on cards). App-wide token change in the design system |
| 2 | Text below Apple's 11pt minimum: 9px (chart axes, stat labels under the top card, phase legend, block abbreviations) and 10px (eyebrows) | Top cards, charts, phase bar, History headers | HIG Typography: iOS default 17pt, minimum 11pt; support Dynamic Type | Floor all text at 11px; eyebrows 11/700 +1px. Build with text styles so it scales; check rows wrap at larger sizes. Tab bar labels stay system |
| 3 | Sheet close button on the wrong side: our filter sheet puts the glass close top right | History filter sheet (8c) | HIG Sheets (updated Mar 2026): on iOS, Close/Cancel on the leading edge; Done on the trailing edge | Move close to top left. Keep Show N sessions at the foot (or make it a prominent ✓ top right) |
| 4 | Chart bars too faint: sleep bar #5E6069 is 2.5:1 against its track | Program summary recovery chart | Non-text contrast 3:1 | Sleep bar #7C7E86 (3.9:1 on track), recovery bar #C4C5CB, so the two still differ clearly in lightness |

## Consider — judgment calls

| # | Topic | Where | Guidance | Options |
|---|---|---|---|---|
| 5 | Pushed-screen title is a custom 20/800 inline title | Calendar, History, Program summary | System inline title is 17pt semibold; iOS recommends a large title that collapses to inline on scroll | (a) Keep 20/800 (needs a custom title view; doesn't respond to the system the same way). (b) Large title at rest collapsing to 17 inline, the same pattern Home already uses (26 → 17): stays bigger than the month name at rest, and is what iOS does natively. (c) Standard inline 17/700 centered. **Locked: (c).** |
| 6 | Primary buttons in sheets use the card radius (10) inside a 34-radius sheet | Filter sheet | HIG: controls in bars and sheets should be concentric with their container; standard prominent buttons there are capsules | Capsule primary inside sheets; keep 10 for cards and in-card buttons (brand) |
| 7 | Search experience details | History | WWDC26 search: inline search at the top suits scoped search; show recent searches on focus; a no-results state that repeats the query; keep the system field's parts | Add recents and a no-results state when designing search behavior; use the system search field |
| 8 | Mock-only chrome must be system chrome in the build | All | HIG Toolbars: reduce custom toolbar backgrounds; let the scroll edge effect separate bars from content | Build tab bar with TabView, bars with system toolbars and glass, scroll edge from the system; drop the painted fades we use in mocks |
| 9 | Prominent tab role (new in iOS 27) | Tab bar | Pins one tab to the trailing edge as a button-like tab | Optional: a prominent Workout tab as the "go train" entry. Only if it earns it; today's four tabs are fine |
| 10 | Resizable layouts | All charts and bars | iOS 27 resizable iPhone apps | Size bars and clusters relative to width, not fixed pixel maths |
| 11 | Reduce Motion | Calendar month slide, day fade | Accessibility | Month slide becomes a crossfade with Reduce Motion on |
| 12 | Long titles | Program summary title = program name | HIG Toolbars: keep titles under ~15 characters | Truncate long program names in the bar; show the full name in the top card |

## Verified — already matches

- Back button: standard chevron in a glass circle, no "Back" text.
- Bar actions: symbols only, no text, no outlined-circle symbols (the glass circle is the container).
- One primary action per surface; secondary as text under it.
- Tab bar: floating glass capsule, symbol over label, selected tab tinted, four tabs, visible on pushed screens.
- Sheets: grabber, swipe to dismiss, large detent for a full filter (HIG: skip medium when content is more useful at full height).
- Multi-select: selection circles, the system's own mark.
- Monochrome bars and controls; accent only for "now"; no colored toolbar backgrounds.
- Scoped inline search at the top of History fits WWDC26 guidance for a list inside one tab.
- Transparency slider: covered as long as the build uses system glass.

## Sources

- Apple HIG: Sheets — https://developer.apple.com/design/human-interface-guidelines/sheets
- Apple HIG: Toolbars — https://developer.apple.com/design/human-interface-guidelines/toolbars
- Apple HIG: Tab bars — https://developer.apple.com/design/human-interface-guidelines/tab-bars
- Apple HIG: Typography — https://developer.apple.com/design/human-interface-guidelines/typography
- WWDC26 Platforms State of the Union — https://developer.apple.com/videos/play/wwdc2026/102/
- WWDC26 Design intuitive search experiences — https://developer.apple.com/videos/play/wwdc2026/292/
- MacStories iOS 27 review (design) — https://www.macstories.net/stories/ios-and-ipados-27-review/2/

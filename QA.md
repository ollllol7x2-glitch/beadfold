# QA

Verification date: 2026-08-14. Primary native device: iPhone 17 Pro simulator, iOS 26.5. Mobile web was additionally verified at 390×844 and 375×667.

## Automated results

| Check | Result |
|---|---|
| TypeScript `tsc --noEmit` | Pass |
| ESLint | Pass |
| Vitest | Pass: 4 files, 15 tests |
| Expo web SPA export | Pass with `/beadfold` base URL |
| iOS Expo/Hermes export | Pass |
| CocoaPods install | Pass |
| Signed Xcode Debug simulator build | Pass |

Tests cover recipe determinism, history/gear explanation and water/time invariants; honest unknown-roast fallback; timestamp projection; pause/resume; skip; Taste threshold/aggregation; exclusion of unknown roast from Taste Profile; nullable advanced values; and core color contrast.

## CRUD task-based UX verification

The 2026-08-14 pass used fresh browser SQLite data and cleaned all test records afterward.

| Task | Result |
|---|---|
| Quick-add Bean with only name and weight | Pass; no invented roast, storage, state, or weight default |
| Read Bean detail with missing optional metadata | Pass; missing values are named honestly and no empty detail card is shown |
| Generate Guided Recipe from unknown roast | Pass; neutral 92℃ / medium grind fallback with a plain-language explanation |
| Create Cafe Cup | Pass; inline required-field errors, explicit satisfaction, success feedback, and immediate undo |
| Undo Cafe save | Pass; record deleted and Journal refreshed immediately |
| Update then delete Cafe Cup | Pass; complete field prefill, visible confirmation, and post-action feedback |
| Add, rename, make-primary, and remove custom Gear | Pass; removal states that historical Cups are preserved |
| Archive and restore Bean | Pass; the exact pre-archive state is restored, including unspecified state |
| Permanently delete Bean | Pass; destructive copy distinguishes it from reversible archive |

Heuristic gate: 9.2/10 overall. Reading 9.2, writing 9.1, updating 9.2, deleting/recovery 9.1. The score reflects clear task entry points, honest defaults, inline prevention/recovery, complete CRUD control, localized labels, and verified mobile behavior. Physical VoiceOver/TalkBack and hardware camera/notification checks remain release certification items rather than CRUD usability blockers.

## Mobile web evidence

- GitHub Pages production deployment succeeded for commit `476179e`; build and deploy completed through the repository workflow.
- Completed onboarding and verified the Home/Journal/Add/Collection/Profile navigation labels from the production export.
- Added a Bean using only name and remaining weight, opened its generated detail route, and created a Guided Recipe from persisted browser SQLite data.
- Verified the Brew preparation screen does not start time, the three-second countdown precedes extraction, and the active screen fits without scrolling at both 390×844 and 375×667.
- Verified the active screen exposes a dominant remaining timer, current instruction, current/cumulative/next values, pause, next, and stop in the viewport.
- Opened a second tab and verified it shows a plain-language one-tab safety/recovery state rather than a raw SQLite error.
- Created a Bean on the deployed site, refreshed its generated `/bean/:id` URL directly, and verified the same persisted detail screen returned with no console errors through the Pages `404.html` SPA fallback.

## UX/UI redesign verification

- Replaced text glyph navigation with labeled native symbols and a persistent shared five-item navigation shell.
- Removed root, tab, and modal stack transition animations.
- Added three-step experience/goal onboarding and verified every step through the simulator accessibility tree.
- Verified the beginner choice persists and changes Home guidance.
- Rebuilt Home around one photo-led bean action; Guided around a visual recipe map and timeline; Brew around a photographic bloom timer.
- Visually verified Home, Guided, Brew, onboarding, and fixed navigation on iPhone 17 Pro simulator.
- Rewrote technical/AI-like phrases and Korean-localized core recipe, rating, taste, navigation, and settings terms.
- Rebuilt Brew as a non-scrolling, glanceable task screen: explicit preparation state, three-second countdown, 92–112 pt timer, segmented step progress, compact instruction/media strip, and bottom-fixed controls.
- Verified through the simulator that no Brew control is below the viewport, the preparation screen does not consume time, and pause/next/stop are all exposed as separate accessible actions.
- Removed the duplicate pause control and added confirmation when advancing unusually early to reduce accidental skips.

## Live end-to-end evidence

The signed app was installed and operated through the simulator accessibility tree—not by seeding mock screen state.

| Scenario | Result |
|---|---|
| Launch → local onboarding → relaunch redirect | Pass |
| Add Bean → SQLite persistence → Bean Detail | Pass |
| Guided creation and explanation | Pass; 15 g / 250 ml / 93℃ / bounded rule output |
| Brew pause | Pass; remained at 0:38 during a 3-second observation |
| Background/foreground restoration | Pass; restored from timestamps at 0:11 |
| Completion transaction | Pass; Cup created and bean 200→185 g |
| Journal downstream update | Pass |
| Same-bean Compare | Pass with two real Cups and distinct Good/Loved/flavor data |
| Taste threshold | Pass; 3 rated Cups produced 2.67/3 and a localized flavor insight |
| Manual edit → Brew → Cup | Pass; Bloom pour 40→45 ml reconciled target 240→245 ml and executed that snapshot |
| Repeated Guided completions | Pass; weights 185→170→155 g and separate Cups |

## Accessibility checks

- SUIT rendered sharply in the native app.
- Simulator accessibility tree exposed logical Korean labels, heading/button roles, selected/disabled states, form labels/hints, and Brew live values.
- The required path was driven using those accessibility elements, providing a semantic-order check across onboarding, add, detail, Guided, Brew, record, Journal, Compare, and Taste.
- Brew announces step name, duration, pour/wait instruction, pause/resume, skip, and completion through `AccessibilityInfo`.
- Pause and completion haptics honor the saved setting; visible information remains complete when haptics/sound are off.
- Maximum iOS accessibility content size was launched and visually captured. Content remains scrollable and the primary Add action remains reachable; headings wrap substantially at the extreme category, as expected.
- Contrast tests pass for core combinations; selected/error states are not color-only; reusable targets meet at least 44 pt.

## Release-device matrix still required

These are certification checks requiring hardware or an unavailable platform, not missing MVP logic:

- Perform a full physical-device VoiceOver gesture/rotor pass, including an actual timed pour.
- Run Android native compilation and the same flow with TalkBack once an Android SDK/emulator or device is available.
- Validate camera/gallery and local notification presentation on physical iOS and Android devices.
- Re-run current Korean accessibility/legal guidance and store privacy disclosures immediately before public release.

No dark mode is claimed; the supported MVP appearance is Light Mode.

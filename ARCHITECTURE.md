# Architecture

## Shape

```text
Expo Router screens
  ├─ accessible reusable UI + design tokens
  ├─ deterministic recipe and brew domain functions
  ├─ SQLite repository and atomic transactions
  └─ optional service boundaries (notifications, sync)
```

The app is local-first. Screens read and mutate real SQLite rows through `src/database/repository.ts`; no mock store is used. `src/database/schema.ts` applies idempotent schema creation, WAL mode, foreign keys, indexes, curated knowledge seeds, and equipment seeds.

## Navigation and experience shell

The native tab bar is hidden and a shared `AppNavigation` shell is rendered by `Screen`. Its four persistent destinations are **Home, Journal, Collection, Profile**. The centered **추가** control is deliberately a button—not a fifth tab—and opens a contextual action sheet for Add Bean, Start Home Brew, and Record Cafe Cup. Home Brew chooses a Bean in-place and opens Guided Recipe directly.

Informational destinations retain the persistent shell. Creation and editing tasks (Bean, Cafe Cup, Cup feedback, Manual Recipe) intentionally hide it, use a compact task header, keep the completion CTA below the scroll region, and confirm before discarding unsaved work. Active Brew hides global navigation on purpose and confirms whether to pause before leaving.

Root, tab, and modal transitions use `animation: none` to remove the former clicky stack motion. Onboarding stores `experience_level` and `onboarding_goal`; Home uses both to change the first actionable prompt without creating separate feature sets.

## Core decisions

- **Guided recipe:** `generateGuidedRecipe` is a pure, versioned rule engine. Roast, process, roast age, dripper flow, filter resistance, water hardness, grinder style, and the most recent positively rated same-bean recipe make bounded, explainable adjustments. Equal inputs, history, and clock produce equal output.
- **Manual recipe:** variables and individual pour-step time/water values are editable. Totals and cumulative water are reconciled immediately, and validation prevents impossible ranges or mismatched sums.
- **Brew clock:** state stores wall-clock timestamps, not a decrementing counter. Projection derives the current step after foreground restoration. Pause accumulates paused duration; skip persists a new step timestamp.
- **Completion:** a single SQLite transaction marks the session complete, deducts bean weight, updates bean state, and inserts a Cup snapshot. `cups.brew_session_id` is unique, so retries return the existing Cup.
- **Historical truth:** Cups store bean and recipe JSON snapshots. Later bean/recipe edits do not rewrite history.
- **Taste:** simple, inspectable satisfaction scores and counts; an insight appears only after three rated Cups.
- **Privacy analytics:** the required product events are written only to `analytics_events`. Payloads contain IDs, categories, and numeric state—not memo text—and are not transmitted.
- **Cloud boundary:** `SyncAdapter` is a local-only no-op today. Vendor SDKs and credentials are absent from the core.
- **Web routing:** Expo exports one SPA under `/beadfold`; the Pages workflow copies `index.html` to `404.html`, allowing direct refresh of local-data dynamic routes. Expo SQLite on web uses one writer tab, so a second tab receives an explicit recovery message.

## Navigation

The root Stack owns onboarding and detail/modal routes. Tabs own Home, Journal, Collection, and Profile; Global Add is an overlay action rather than a route. Onboarding is persisted once in SQLite; future launches redirect to tabs. Every required route has an explicit empty/error state or actionable fallback.

## Failure behavior

- Camera/gallery denial returns to manual entry without blocking.
- Notification denial disables reminders without affecting brew.
- Invalid recipe/bean input produces Korean inline errors or an app-owned confirmation dialog that behaves consistently on native and web.
- Interrupted active/paused brews surface on Home.
- Missing/deleted entities route to a recovery action.

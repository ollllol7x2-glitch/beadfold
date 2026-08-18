# Tasks

## MVP — completed

- [x] Expo Router mobile shell, onboarding, tabs, and required detail/modal routes
- [x] Local SQLite schema, curated knowledge/equipment seeds, indexes, and settings
- [x] Bean add/search/photo fallback/edit/state/archive and weight lifecycle
- [x] Deterministic, versioned, explainable Guided Recipe
- [x] Manual Recipe create/edit/save/duplicate/archive/execute, including direct pour-step editing
- [x] Timestamp Brew engine with pause/resume/skip/finish and foreground recovery
- [x] Atomic idempotent completion, Cup snapshot, and bean deduction
- [x] Home, Journal filters, Cafe Cup, same-bean Compare, and thresholded Taste Profile
- [x] Gear catalog/custom entry and primary selection behavior
- [x] Optional haptics, local Taste reminder permission/scheduling, sound and Reduce Motion settings
- [x] SUIT, cream/espresso design system, accessible labels/states/errors, and 44 pt targets
- [x] Private local product-event log with no memo payloads
- [x] Unit/invariant tests, lint, typecheck, export, Pods, signed iOS build, and live E2E verification
- [x] Architecture, environment, data, design, QA, and run documentation
- [x] UX/UI redesign: tailored onboarding, persistent navigation, quiet motion policy, photography-led core screens, and Korean-first UX writing
- [x] Brew usability pass: ready state, countdown, no-scroll active layout, dominant timer, error-preventing controls, and hands-busy information hierarchy
- [x] IA correction: Home, Journal, Collection, Profile, and one clear global Add action
- [x] Low-friction Bean intake with two-field quick save, photo/search entry, and optional details
- [x] Cup photo, nullable advanced taste values, Korean flavor display, honest Compare, and recent Taste trend
- [x] Collection sections for Beans/Recipes/Gear, primary Gear, Bean restore, and permanent delete
- [x] Mobile web SPA export, dynamic-route fallback, one-tab SQLite recovery, and GitHub Pages workflow
- [x] CRUD trust pass: honest Bean defaults, full Cafe/Cup/Gear update-delete controls, reversible state-preserving archive, completion feedback, and immediate Cafe-save undo
- [x] IA remediation: four-domain navigation plus a contextual Global Add sheet; no standalone Add destination or Journal → Add detour
- [x] Task-screen contract: consistent close/back headers, fixed completion bars, progressive manual-recipe detail, and unsaved-work confirmation on Bean/Cafe/Cup/Manual editing
- [x] Journey remediation: goal-aware Home next action, pending Cup follow-up, direct bean picker, selection-first Journal comparison, and Cafe removal from Collection

## Release certification — external environment/human checks

- [ ] Physical iOS VoiceOver rotor/gesture and camera/notification pass
- [ ] Android SDK/device build plus TalkBack pass
- [ ] Store screenshots, privacy declarations, signing profiles, and distribution archives

## Optional post-MVP adapters

- [ ] Select and integrate an on-device OCR library; keep confirmation/manual correction mandatory
- [ ] Implement Supabase `SyncAdapter` only after project URL/keys, RLS policies, deletion policy, and account UX are approved
- [ ] Add export/import backup UX and conflict-resolution UI before enabling remote sync

The unchecked items do not block the verified local-first MVP or its mobile-web release. They depend on release hardware/platform setup, external credentials/account policy, or a product decision beyond the authoritative P0 loop.

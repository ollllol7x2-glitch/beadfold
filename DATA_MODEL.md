# Data model

## Main entities

| Table | Purpose | Important invariants |
|---|---|---|
| `beans` | Mutable owned bean lots | remaining weight is never negative; state becomes `finished` at zero |
| `recipes` | Saved Guided/Manual definitions | JSON includes rule version and ordered steps; deletion is soft archive |
| `brew_sessions` | Recoverable execution state | timestamp, step index, pause time, and immutable bean/recipe snapshots |
| `cups` | Historical home/cafe experiences | `brew_session_id` is unique; home Cups hold both snapshots |
| `user_equipment` | Selected or custom gear | primary selection is unique per category by repository update |
| `equipment_catalog` | Curated starter equipment | catalog rows remain distinct from user content |
| `knowledge_items` | Countries, regions, varieties, process, flavor, roast seed data | category/name index and verification metadata |
| `settings` | onboarding, haptic, sound, motion, notification choices | string values with update timestamp |
| `analytics_events` | private local product events | no memo text or network transmission |
| `app_meta` | migration/seed metadata | versioned seed marker |

## Completion transaction

```text
brew_session(active/paused)
  → guard existing Cup by brew_session_id
  → status = completed
  → beans.remaining_weight_g -= recipe.dose_g
  → beans.state = finished when weight reaches zero
  → insert Cup(bean_snapshot, recipe_snapshot)
```

All writes above execute within one SQLite transaction. A repeated completion call reads and returns the existing Cup instead of deducting weight twice.

## Seed scope

The MVP includes all required knowledge categories: 30 countries, representative major regions, 25 varieties, 12 processes, 44 flavor descriptors, five roast levels, and starter grinder/dripper/filter/water records. Search accepts partial names and manual custom entry is always available when a catalog item is absent.

## Future sync contract

Local IDs are stable sync identities. A cloud adapter must upsert by those IDs, use tombstones/archives for deletions, and enforce the same unique brew-session-to-Cup relationship. Sync may fail or be absent without blocking local reads or writes.

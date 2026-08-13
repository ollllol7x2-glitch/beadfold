# Design tokens

The implemented source of truth is `src/design-system/tokens.ts`.

## 2026 redesign direction

- Editorial cream paper surfaces, espresso contrast, and warm taupe structure
- Large original coffee photography for primary bean and brew moments
- Native symbol iconography instead of text glyphs
- One dominant action per first viewport
- Persistent five-destination navigation on non-immersive screens
- No stack transition animation; active Brew is the intentionally immersive exception
- Korean-first copy; implementation and storage terms stay out of the main UI
- Beginner guidance follows the onboarding experience level and goal

Original BEANFOLD-specific visual assets live in `assets/visuals/`.

## Palette

| Token | Value | Use |
|---|---:|---|
| Espresso | `#2D211B` | primary actions, selected state, core type |
| Cream | `#F7F2EA` | app background |
| Warm Beige | `#E4D5C4` | tactile panels and selected-neutral surfaces |
| Soft Gold | `#B58E54` | fold accents and decoration, not small body text |
| Charcoal | `#2A2725` | main copy |
| White | `#FFFDF9` | cards and form surfaces |

Text uses explicit neutral colors rather than reduced opacity. Automated contrast tests cover the principal text/surface pairs and primary button pairing at WCAG AA thresholds.

## Type

SUIT 2.0.5 is bundled locally under the SIL Open Font License. Regular 400 is body, Medium 500 is labels, SemiBold 600 is headings and brew numbers, and Bold 700 is reserved emphasis. Text scaling is enabled on text and inputs.

## Interaction

- Buttons: minimum 52×52 pt
- Chips: minimum 44 pt high
- Inputs: minimum 52 pt high with visible labels and 1.5 pt borders
- Selected state: checkmark/text plus surface change, never color alone
- Errors: explicit `오류` wording, alert role, and border change
- Page content: vertical ScrollView so enlarged text expands rather than clips
- Brew order: current step → remaining time → current/cumulative water → next step

## Motion and sensory cues

Navigation uses a restrained fade. `Reduce Motion` is persisted for future decorative motion; no required information currently depends on animation. Haptics and notification sound are independently optional, and every cue has simultaneous text/VoiceOver output.

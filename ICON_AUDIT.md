# BEANFOLD Icon Audit

## Scope

UI icons are consolidated on `lucide-react-native`. The BEANFOLD brand mark and app launcher assets are intentionally out of scope.

## Findings

| Current implementation | Locations | Replacement | Type | Accessibility / status |
| --- | --- | --- | --- | --- |
| SF Symbols on iOS | All shared `Icon` usages | Lucide rendering through shared `Icon` | Lucide | Replaced |
| Material Community Icons on web | All shared `Icon` usages | Lucide rendering through shared `Icon` | Lucide | Replaced |
| Filled / outline Symbol variants | Navigation, buttons, cards, feedback | Single Lucide outline treatment; selected state uses 2px stroke and Espresso container | Lucide | Replaced |
| Home | Bottom navigation | `House` | Lucide | Tab label: `홈 탭` |
| Journal | Bottom navigation | `NotebookPen` | Lucide | Tab label: `기록 탭` |
| Collection | Bottom navigation | `Archive` | Lucide | Tab label: `보관함 탭` |
| Profile | Bottom navigation and profile entry | `CircleUserRound` | Lucide | Tab label: `프로필 탭` |
| Bean | Add, collection, recipe metrics | `Bean` | Lucide | Text label accompanies meaning |
| Brew / coffee | Home, recipe, brew flows | `Coffee` | Lucide | Button labels describe the action |
| Water / temperature / time | Guided recipe and brew | `Droplets`, `Thermometer`, `Timer` | Lucide | Text labels accompany meaning |
| Camera / search | Add bean and cafe record | `Camera`, `Search` | Lucide | Buttons include labels |
| Feedback / status | Toasts, selections, notices | `CircleCheck`, `X`, `Heart`, `Smile`, `ThumbsDown` | Lucide | Existing text and accessibility labels retained |
| Coffee-specific dripper / pour | Gear and brew contexts | Existing generic Lucide `Coffee`, `Droplets`, `Scale` where applicable | Lucide | No custom icon needed currently |

## Visual rules applied

- 24 × 24 source grid, 20–24dp standard visual size.
- 1.75px default stroke; 2px selected / emphasized stroke.
- Rounded Lucide line caps and joins; Espresso is the default icon colour.
- 44 × 44dp minimum action target is preserved by shared button, header, and navigation containers.
- Selected bottom-navigation state is expressed by Espresso colour, text label, a soft Cream container, and stronger 2px stroke — not by colour alone.

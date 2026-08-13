# BEANFOLD

BEANFOLD is a local-first coffee companion for the loop **Know → Brew → Record → Compare → Discover**. The MVP is an Expo/React Native app backed by SQLite; no account or network is required for its core flows.

## Run

Requirements: Node.js 24+, pnpm 11+, and either Xcode with an iOS Simulator or Android Studio with an emulator.

```bash
pnpm install
pnpm start
```

Press `i` for iOS or `a` for Android. Native development builds can also be created with `pnpm ios` and `pnpm android`.

The mobile web app is published at the repository's GitHub Pages URL. It uses Expo's single-page export plus a `404.html` fallback so locally generated Bean, Cup, Recipe, and Brew URLs can be refreshed directly. To create the same export locally:

```bash
pnpm export:web
```

Web records are stored in that browser. To avoid concurrent SQLite writes, BEANFOLD intentionally allows one active tab per browser profile.

## Verify

```bash
pnpm typecheck
pnpm lint
pnpm test
pnpm export:web
pnpm exec expo export --platform ios
```

Product requirements live in [BEANFOLD_MASTER_SPEC_V1.md](./BEANFOLD_MASTER_SPEC_V1.md). Implementation notes and evidence are in [ARCHITECTURE.md](./ARCHITECTURE.md), [DATA_MODEL.md](./DATA_MODEL.md), [DESIGN_TOKENS.md](./DESIGN_TOKENS.md), [ENVIRONMENT.md](./ENVIRONMENT.md), [QA.md](./QA.md), and [TASKS.md](./TASKS.md).

## Privacy

Beans, recipes, brew sessions, Cups, taste values, and private analytics events stay in the on-device `beanfold.db`. There are no bundled service credentials, ad SDKs, remote analytics, or required cloud calls. The optional sync boundary is defined in `src/services/sync.ts`.

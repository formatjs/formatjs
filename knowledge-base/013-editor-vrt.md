# Headless editor and visual tests

`packages/editor/index.ts` exposes `useMessageEditor` and a render-prop `Editor`.
The core owns selection/search and ICU parse results. Message data is controlled;
consumers apply `onMessageChange` and own persistence, providers, markup, and styles.
`Message` exposes the full AST or parse error through a render function.

```mermaid
flowchart LR
  Catalog[Consumer catalog] --> Core[Headless editor]
  Core --> View[Consumer design system]
  View --> Change[onMessageChange]
  Change --> Catalog
  Core --> Parser[ICU parser]
```

`demo/demo.tsx` is a separate StyleX consumer with localized, labeled native controls.
`design-system/` owns theme tokens and reusable controls. Vite compiles StyleX
through `@stylexjs/unplugin` before the React plugin. Visual tests cover editing,
invalid ICU with keyboard focus, and a narrow RTL layout.
The core imports neither this view nor React Intl. Material UI and React 17 are
removed. `//packages/editor:unit_test` checks controlled updates, navigation,
invalid ICU, empty catalogs, and custom rendering without providers.

`//packages/editor/vrt:visual_test` exercises the example on React 19 with root
npm dependencies and current workspace React Intl/parser sources. There is no
separate npm workspace or lockfile. The root lock pins Playwright to match the
browser image. Bazel workspace npm links supply current package builds; no published formatter
versions are duplicated in the VRT setup.

The browser target is manual, local, and uncached. It requires Docker and uses
`rules_web_e2e` with a pinned Linux amd64 image. The custom `server.ts` adapter
owns startup/cleanup; `shell.tsx` owns the IntlProvider. Inputs, environment, and
browser networking are isolated by the rules runtime. Host plugins/tests remain
trusted code outside full Bazel filesystem sandboxing.

Run `.update` only for intentional visual changes, review the PNGs, then run
comparison. See `packages/editor/vrt/README.md` for exact commands.

VRT TypeScript settings come from `tools/tsconfig.bzl`; Bazel declares the source
inputs. Bazel generates a runtime-only `package.json` containing `{"type":"module"}`
so Playwright loads the `.ts` config as ESM. It declares no dependencies.

`useTranslationEditor` composes `useMessageEditor` for multi-locale workflows.
Draft state and in-flight save guards use `[message ID, locale]` keys. Completion
updates the submitted key and baseline, preserving newer edits and other selections.
Controlled catalog updates refresh clean drafts without overwriting dirty text.
Locale fallback and clamped pagination handle asynchronously changing inputs.
`validation.ts` compares recursive ICU contracts per branch; additional plural
categories inherit `other`, rather than multiplying a global placeholder count.

`core.tsx` owns the original headless API; `index.tsx` exports it alongside the
workflow and validation APIs. `demo/demo.tsx` shares an optional StyleX `EditorView`
with `demo/workflow-demo.tsx`. Workflow state has no dependency on either UI module.
VRT's `?workflow=1` fixture exercises controlled persistence, filters, saved-state
feedback, and desktop/narrow RTL screenshots. Existing demo baselines remain in
place to catch regressions in the shared view.

Gazelle maintains source and dependency lists in the headless, demo, and VRT
Bazel packages. The demo is a separate internal library. VRT maps generated
library and test rules to local `vrt_library` / `vrt_test` wrappers that preserve
raw sources and typecheck them. Vite and Playwright own execution; the harness
also checks the demo library and builds its server adapter.
No editor package disables Gazelle.

`@formatjs/editor` participates in the pnpm workspace, Bazel distribution
registry, and Release Please npm publishing. Its public `index.ts` bundles
headless APIs and declarations; React 19 is a peer dependency. Demo and VRT
packages are development-only and are excluded from the npm artifact.

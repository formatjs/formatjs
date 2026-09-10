# Editor visual tests

The native HTML example exercises the headless editor using the monorepo's React
19, current React Intl sources, and shared root npm lockfile. No separate VRT
package manifest or dependency workspace is needed.

```sh
bazel test //packages/editor:unit_test
bazel build //packages/editor/vrt:typecheck
bazel test //packages/editor/vrt:visual_test --test_output=errors
bazel run //packages/editor/vrt:visual_test.update
```

The manual browser target requires a local Docker daemon. `rules_web_e2e` uses
Testcontainers and a pinned Linux amd64 Playwright image. It stages declared
inputs, disables dotenv loading, uses an allowlisted environment, and restricts
browser traffic to the fixture server. Compare mode never changes baselines.
Review PNG changes after explicitly running the update target.

`server.ts` owns the Vite server adapter. `shell.tsx` supplies consumer-owned
IntlProvider and document settings. `app.tsx` supplies deterministic message
data. The tests cover loaded/editing screenshots plus selection, search,
copy/clear, and recovery from invalid ICU input. Core state and custom renderer
coverage also runs in the normal Bazel unit-test lane without Docker.

The public rules repository is pinned by commit until a BCR release exists.
Failures retain JUnit results and screenshot diffs in undeclared test outputs.

VRT TypeScript settings come from `tools/tsconfig.bzl`; Bazel declares the source
inputs. Bazel generates a runtime-only `package.json` containing `{"type":"module"}`
so Playwright loads the `.ts` config as ESM. It declares no dependencies.

## Browser interaction tests

Write native Playwright `*.spec.ts` files in `packages/editor/vrt/`. The
`e2eConfig` helper supplies `baseURL`, so specs can use `page.goto('/')`,
accessible locators, clicks, and web-first assertions. `*.visual.spec.ts` files
remain in the separate screenshot target. Both targets share the consumer-owned
server, shell, declared inputs, and pinned Testcontainers browser.

```sh
bazel test //packages/editor/vrt:e2e_test --test_output=errors
bazel test //packages/editor/vrt:e2e_test --test_arg=--grep=translation
```

E2E covers editing, search, selection, copy/clear, ICU error recovery, locale
drafts, and saving. It requires Docker and runs manually, locally, and uncached.
CI should explicitly select both `e2e_test` and `visual_test`. Failures retain
JUnit, screenshots, and Playwright traces in undeclared test outputs.

## Component browser tests

`bazel test //packages/editor/vrt:component_test --test_output=errors` runs
Playwright 1.63 native `mount()` specs for the real editor. The typed
`editor.story.tsx` uses the existing provider shell and demo; `gallery.tsx` owns
mount/update/unmount. The tests check provider updates without losing a draft,
clear, ICU validation, and isolation between mounts.

`component_browser_test` shares the custom server, root npm dependencies, strict
typechecks, and pinned Testcontainers browser with E2E and VRT.
`componentBrowserConfig` discovers `*.browser.spec.ts` separately from the E2E
`*.spec.ts` and VRT `*.visual.spec.ts` suites. CI should explicitly run all three
manual browser targets. Screenshot baselines and updates remain in `visual_test`.

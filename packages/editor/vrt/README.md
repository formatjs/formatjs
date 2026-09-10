# Editor browser tests

The editor uses the monorepo's React 19, workspace React Intl/parser packages,
and root npm lockfile. Its Bazel build typechecks and compiles specs, then
builds the gallery with Vite/StyleX before any browser test starts.

```sh
bazel build //packages/editor/vrt:bundle //packages/editor/vrt:typecheck
bazel test //packages/editor/vrt:e2e_test //packages/editor/vrt:component_test //packages/editor/vrt:visual_test --test_output=errors
bazel run //packages/editor/vrt:visual_test.update
```

All three tests require a local Docker daemon. They are manual, local, and
uncached. CI must select them explicitly. The browser runs through Testcontainers
in a pinned Linux amd64 image; failure reports, traces, and image diffs remain
in Bazel's undeclared outputs.

## Built inputs

| Target                         | Inputs and behavior                                                                 |
| ------------------------------ | ----------------------------------------------------------------------------------- |
| `bundle`                       | Builds checked application, providers, visual registry, HTML and CSS into `assets/` |
| `editor_shell`                 | Selects the built `gallery.html` entry point                                        |
| `editor_server`                | Compiled custom server adapter serving the built app for E2E                        |
| `e2e_specs`, `component_specs` | Compiled native Playwright specs and dependencies                                   |
| `playwright`                   | Reusable matching Playwright packages and pinned browser image                      |
| `vrt_matching`                 | Compiled comparison policy with a zero-pixel mismatch budget                        |

`e2e_test` brings its own server; component and VRT targets bring their built
shell. No bundler, raw source list, or npm runner directories appear on test
call sites. `server.ts` composes the rules' `serveDirectory` helper; it does not
start Vite. `shell.tsx` retains the application's IntlProvider and document
settings. The ESM marker belongs to the compiled module graph.

## Specs and visual cases

Write `*.spec.ts` for navigation, editing, search, validation, and saving.
Write `*.browser.spec.tsx` for native `mount()` and component updates. Bazel
compiles both before execution. Filter behavior tests with, for example:

```sh
bazel test //packages/editor/vrt:e2e_test --test_arg=--grep=translation
```

`editor.visual.tsx` declares shared renderable cases, browser-side readiness
hooks, and VRT options. `gallery.tsx` installs the registry and supplies renderer
mount/update/unmount behavior. The runtime generates all six screenshot cases;
there are no separate handwritten screenshot specs. Existing PNG names stay
explicit in the visual declarations.

`matching.ts` controls pixel comparison independently of render settings.
Comparison never changes source baselines. Run `.update` only for intentional
visual changes and review the resulting PNG diff before committing.

The rules dependency is pinned to the public implementation commit providing
the built-input API; this API is newer than the 1.0.0 release.

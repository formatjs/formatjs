# Editor browser tests

The editor uses the monorepo's React 19, workspace React Intl/parser packages,
and root npm lockfile. Its Bazel build typechecks and compiles specs, then
builds the gallery with Vite/StyleX before any browser test starts.

## Host interaction tests

```sh
bazel test //packages/editor/vrt:e2e_test //packages/editor/vrt:component_test --test_output=errors
```

`rules_playwright` downloads Chromium headless shell and FFmpeg through Bazel.
Both targets declare the browser files and their runfiles-relative
`PLAYWRIGHT_BROWSERS_PATH`; no `pnpm exec playwright install` or host browser cache
is required. Linux still needs the browser's OS libraries. Linux x64 is tested;
the download mapping also covers macOS arm64.

## VRT migration status

The pinned `rules_web_e2e` commit replaces Testcontainers with actiond.
`visual_test` now takes a declared Linux amd64 `browser_runtime`; capture and
comparison run as remote build actions. Docker and image preloading are no longer
test prerequisites.

**VRT is blocked; this migration is not ready to merge.** The former Playwright
image is downloaded through `rules_oci`, but `linux_browser_files` fails extraction
with `Runtime contains a directory link cycle: usr/bin/X11`. A relocatable runtime
producer is tracked in [rules_web_e2e#33](https://github.com/perplexityai/rules_web_e2e/issues/33).
The declaration preserves the previous image pin as a reproducible migration
input; it is not a validated runtime.

Execution also needs a patched actiond worker; see
[rules_web_e2e#34](https://github.com/perplexityai/rules_web_e2e/issues/34).
The devbox has no KVM, and no FormatJS actiond endpoint is configured.
Existing screenshot baselines have not been updated.

Once those prerequisites are resolved, use the `vrt` config and explicitly supply
the worker endpoint:

```sh
bazel test --config=vrt --remote_executor=grpc://WORKER:8980 --remote_cache=grpc://WORKER:8980 //packages/editor/vrt:visual_test
bazel run --config=vrt --remote_executor=grpc://WORKER:8980 --remote_cache=grpc://WORKER:8980 //packages/editor/vrt:visual_test.update
```

Local fallback remains disabled. Failed captures must not overwrite baselines.

## Built inputs

| Target                         | Inputs and behavior                                                                 |
| ------------------------------ | ----------------------------------------------------------------------------------- |
| `bundle`                       | Builds checked application, providers, visual registry, HTML and CSS into `assets/` |
| `editor_shell`                 | Selects the built `gallery.html` entry point                                        |
| `editor_server`                | Compiled custom server adapter serving the built app for E2E                        |
| `e2e_specs`, `component_specs` | Compiled native Playwright specs and dependencies                                   |
| `playwright`                   | Reusable matching Playwright client packages                                        |
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

The rules dependency pins upstream commit `748ef4d2155352b4cc295271c4e9f0303d7c50d7`.

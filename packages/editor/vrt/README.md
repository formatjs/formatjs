# Editor browser tests

The editor uses the monorepo's React 19, workspace React Intl/parser packages,
and root npm lockfile. Its Bazel build typechecks and compiles specs, then
builds the gallery with Vite/StyleX before any browser test starts.

## Host interaction tests

```sh
bazel test //packages/editor/vrt:e2e_test //packages/editor/vrt:component_test --test_output=errors
```

Chromium headless shell and FFmpeg are checksum-pinned Bazel downloads in
`rules_browsers` (Chromium) and checksum-pinned FFmpeg archives. Both targets declare the browser directory and pass its
runfiles path through `PLAYWRIGHT_BROWSERS_PATH`; no manual browser installation
or `rules_playwright` dependency is needed. Supported host platforms are Linux
x64 and macOS x64/arm64. Linux needs Chromium's system libraries; the browser CI job
installs those before testing.

## Visual tests on actiond

VRT captures and compares in an isolated Linux amd64 action. `linux_browser_files`
assembles the existing `rules_browsers` Chromium download and pinned Node toolchain
with Ubuntu Noble package archives from a fixed snapshot. `MODULE.bazel.lock` pins
package versions and checksums. DejaVu, an alternative dependency introduced by the
package resolver, is excluded to preserve the established Liberation font policy.
`fonts.conf` uses relative font paths. The runner relocates executable copies;
no system runtime mappings or network downloads occur inside the action.

With a compatible actiond worker:

```sh
bazel test --config=vrt --remote_executor=grpc://WORKER:8980 --remote_cache=grpc://WORKER:8980 //packages/editor/vrt:visual_test
bazel run --config=vrt --remote_executor=grpc://WORKER:8980 --remote_cache=grpc://WORKER:8980 //packages/editor/vrt:visual_test.update
```

The `Editor browser tests` workflow builds actiond at commit `8a42c3d`, with the
memory-advice kernel patch tracked by
[actiond #33](https://github.com/hermeticbuild/actiond/pull/33). It checks KVM and
vhost-vsock access first, starts a 6 GiB VM, runs comparison with `matching.ts`, then captures again
and verifies the complete capture set without changing source baselines. The same path is available locally:

```sh
# Linux x64 with writable /dev/kvm and /dev/vhost-vsock:
bash .github/scripts/actiond-vrt.sh
```

A machine without those devices can use an existing worker endpoint. VRT has no
host fallback. `.update` applies only successful captures; review any intentional
baseline changes. CI uploads browser results and worker logs.

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

The rules dependency pins [package runtime assembly support](https://github.com/perplexityai/rules_web_e2e/pull/35).

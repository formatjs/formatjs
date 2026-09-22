# Editor browser tests

The editor uses the monorepo's React 19, workspace React Intl/parser packages,
and root npm lockfile. Its Bazel build typechecks and compiles specs, then
builds the gallery with Vite/StyleX before any browser test starts.

## Isolated browser tests

E2E, component interactions, and VRT all run in actiond Linux amd64 actions using
`@web_browser//:browser`. The versioned `20260921` preset pins Chromium, Node,
libraries, and fonts together. No host browser cache or apt-installed
libraries are needed. Fixture servers and browsers share action-local loopback
networking; external services must be replaced with declared fixtures.

E2E and component targets are native Bazel tests: failures return nonzero, reports
use standard test outputs, and retries, `--runs_per_test`, and
`--nocache_test_results` launch Chromium again. Bazel’s wrapper uses actiond’s
pinned static Bash plus declared, checksum-pinned utilities. VRT comparison and
capture remain artifact-producing build actions.

Upgrades select a new browser preset release in `MODULE.bazel` and matching
Playwright npm packages. The current preset requires Playwright 1.63.0; the runner
checks the actual browser version. Re-run CI and review intentional screenshot changes.

```sh
# Linux x64 with writable /dev/kvm and /dev/vhost-vsock:
bash .github/scripts/actiond-vrt.sh
```

The upstream supervisor verifies the pinned actiond worker and device access,
starts a private 6 GiB VM, supplies the remote-execution configuration, and stops
the worker when the tests finish. Logs remain under
`${RUNNER_TEMP:-/tmp}/formatjs-actiond/logs/`; CI uploads them with test artifacts.
`visual_test` captures and compares against committed baselines without updating
them. Worker hashes separate cached results across worker/kernel changes.

For individual tests or intentional baseline updates, materialize the launcher
once, then invoke it outside `bazel run`:

```sh
mkdir -p .web-e2e
bazel run --script_path="$PWD/.web-e2e/run" @rules_web_e2e//worker:runner
.web-e2e/run doctor
.web-e2e/run test //packages/editor/vrt:component_test
.web-e2e/run run //packages/editor/vrt:visual_test.update
```

Regenerate the launcher after dependency upgrades. Each invocation owns a fresh
worker and VM state. Local logs remain in `.web-e2e/logs/`. `doctor` checks
prerequisites; a test run validates VM execution. CI provisions KVM/vsock access;
the supervisor does not change host permissions. This preset requires Linux x64;
macOS developers need a Linux runner. There is no host-browser fallback.
`.update` applies only successful captures; review intentional pixel changes.

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
compiles both before execution. Declare subsets as separate Bazel targets or
set target `args` (for example `["--grep=translation"]`). Ordinary tests also
accept `--test_arg=--grep=translation`; Bazel includes selection in the test action.

`editor.visual.tsx` declares shared renderable cases, browser-side readiness
hooks, and VRT options. `gallery.tsx` installs the registry and supplies renderer
mount/update/unmount behavior. The runtime generates all eight screenshot cases;
there are no separate handwritten screenshot specs. Existing PNG names stay
explicit in the visual declarations.

`matching.ts` controls pixel comparison independently of render settings.
Comparison never changes source baselines. Run `.update` only for intentional
visual changes and review the resulting PNG diff before committing.

The browser preset and worker supervisor come from the released `rules_web_e2e`
3.4.0 module in Bazel Central Registry.

Bazel's native test-launcher utilities are built from pinned sources with hermetic
LLVM and musl by rules_web_e2e; they require no Ubuntu test-tools package bundle.

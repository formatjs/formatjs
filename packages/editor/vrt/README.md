# Editor browser tests

The editor uses the monorepo's React 19, workspace React Intl/parser packages,
and root npm lockfile. Its Bazel build typechecks and compiles specs, then
builds the gallery with Vite/StyleX before any browser test starts.

## Isolated browser tests

E2E, component interactions, and VRT all run in actiond Linux amd64 actions using
`:linux_browser`. The runtime combines caller-pinned Chromium/Node with the rules'
checksum-locked libraries and fonts. No host browser cache or apt-installed
libraries are needed. Fixture servers and browsers share action-local loopback
networking; external services must be replaced with declared fixtures.

E2E and component targets are native Bazel tests: failures return nonzero, reports
use standard test outputs, and retries, `--runs_per_test`, and
`--nocache_test_results` launch Chromium again. Bazel’s wrapper uses actiond’s
pinned static Bash plus declared, checksum-pinned utilities. VRT comparison and
capture remain artifact-producing build actions.

Upgrades change the Chromium pin in `MODULE.bazel` and compatible Playwright npm
packages plus `playwright_runtime.version`. The runner checks the actual browser
version. Re-run CI and review intentional screenshot changes.

```sh
# Linux x64 with writable /dev/kvm and /dev/vhost-vsock:
bash .github/scripts/actiond-vrt.sh
```

The script builds actiond at `4b767e8` from a checksum-pinned source archive downloaded by Bazel, starts a 6 GiB VM,
runs all three suites, and validates a fresh capture without applying baselines.
Its worker binary SHA256 is included in remote execution properties so worker or
kernel changes invalidate cached results. Worker builds ignore home/system Bazel
configuration. No local actiond patches are applied.

For an existing worker, obtain its binary SHA256 and run:

```sh
bazel test --config=vrt --remote_executor=grpc://WORKER:8980 --remote_cache=grpc://WORKER:8980 --remote_default_exec_properties=actiond-worker-sha256=WORKER_SHA256 //packages/editor/vrt:e2e_test //packages/editor/vrt:component_test //packages/editor/vrt:visual_test
bazel run --config=vrt --remote_executor=grpc://WORKER:8980 --remote_cache=grpc://WORKER:8980 --remote_default_exec_properties=actiond-worker-sha256=WORKER_SHA256 //packages/editor/vrt:visual_test.update
```

These targets require a Linux worker even from macOS. There is no host fallback.
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

The rules dependency pins [isolated ordinary browser tests](https://github.com/perplexityai/rules_web_e2e/pull/36).

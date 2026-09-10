# Editor visual tests

This Bazel target exercises the real editor in Chromium through `rules_web_e2e`.
It captures the loaded UI and a populated translation field. A local Vite
middleware serves deterministic message fixtures; no external service is needed.

```sh
bazel build //packages/editor/vrt:typecheck
bazel test //packages/editor/vrt:visual_test --test_output=errors
bazel run //packages/editor/vrt:visual_test.update
```

A local Docker daemon must be reachable by Testcontainers. Baselines use the rule’s pinned
Linux image; initial validation is Linux amd64. Review `__screenshots__/*.png`
after an explicit update. Compare mode never modifies source baselines. Test
failures retain JUnit and screenshot diffs in Bazel’s undeclared test outputs.

The editor still uses Material UI 4 and React 17. This directory owns an isolated
npm lockfile to preserve that runtime without changing the monorepo’s React
version. Parser and react-intl dependencies are pinned public releases; these
visual tests exercise editor sources, not unreleased formatter changes.

The repository’s `rules_web_e2e` dependency is a development pin until a BCR
release exists. The pinned repository is public and can be fetched without GitHub credentials.
To iterate locally, override it with:

```sh
bazel test //packages/editor/vrt:visual_test \
  --override_module=rules_web_e2e=/absolute/path/to/rules_web_e2e
```

The VRT target is manual and requires Docker/network access; invoke it explicitly
in a browser-test CI job. It does not run in the default `bazel test //...` lane.

The TypeScript config, browser test, and editor sources are strictly typechecked
as a required input to the visual test. The runtime package supplies generated
TypeScript declarations.

The runtime serves the editor fixture through Vite. Playwright Test navigates
to the dynamically assigned `VRT_APP_URL` and compares locator screenshots with
`toHaveScreenshot`. The runner owns browser contexts, server readiness, traces,
and teardown. No experimental component-testing harness is required.

The runtime uses Testcontainers with pinned Linux amd64 images. It stages only
declared runfiles, disables Vite dotenv loading, and uses the same allowlisted
environment for comparison and updates. Browser traffic is restricted to the
fixture server. A local Docker daemon is required; external API/font requests
should be replaced with declared fixture responses.

`server.ts` implements the typed custom-server interface and is compiled by
`:server_module`. It preserves the Vite isolation settings and serves the
existing fixture middleware. `shell.tsx` owns test document settings and wraps
the editor independently of server startup. The root build retains its patched
TypeScript rules; the editor retains React 17 for Material UI compatibility.

## End-to-end interaction specs

`//packages/editor/vrt:e2e_test` runs `editor.spec.ts` with native Playwright.
`e2e.config.ts` sets the managed server as `baseURL`, so specs can navigate with
`page.goto('/')`, click controls, edit fields, and use retrying assertions.
The tests cover translation editing/clearing and rendering a test-owned API
response through `page.route`. They do not claim unimplemented search filtering,
message selection, or persistence behavior.

```sh
bazel test //packages/editor/vrt:e2e_test --test_output=errors
bazel test //packages/editor/vrt:e2e_test --test_arg=--grep=translation
```

E2E shares the custom server, UI shell, fixture inputs, and required typechecks
with VRT. It requires no PNG baselines and has no update target. Failure screenshots,
traces, and JUnit are retained in Bazel test outputs. Both browser targets are
manual and should be invoked explicitly in a Docker-enabled CI lane.

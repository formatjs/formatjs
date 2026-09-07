# Editor visual regression testing

`//packages/editor/vrt:visual_test` uses the external `rules_web_e2e`
`component_visual_test` macro. Its `.update` target writes reviewed PNG
baselines; comparison only reads declared baseline inputs.

The editor is a legacy Material UI 4 / React 17 application. Keep its isolated
`packages/editor/vrt/pnpm-lock.yaml` and `editor_vrt_npm` module extension separate
from root frontend dependencies. `//packages/editor:vrt_sources` supplies the
actual editor source files through Bazel. The Vite config owns source aliases,
React dependency resolution, and deterministic fixture HTTP responses.

Run the target explicitly with a local Docker daemon. It is tagged manual,
local, and uncached by the upstream macro. See
[the consumer guide](../packages/editor/vrt/README.md) for commands and supported
runtime details. The strict `:typecheck` target checks editor sources, the browser test, and
`playwright.config.ts` and `vite.config.ts`. It is a required VRT input, and can also be built separately.
Formatter-library tests remain separate.

The rules runtime serves the editor fixture through Vite, navigates to the
dynamically assigned `VRT_APP_URL`, and compares locator screenshots with
`toHaveScreenshot`. The runner owns browser contexts, server readiness, traces,
and teardown. No experimental component-testing harness is required.

The runtime uses Testcontainers with a pinned Linux amd64 browser and an isolated
network. It stages declared runfiles and gives compare/update the same allowlisted
environment. Vite dotenv loading is disabled; browser requests can reach only the
fixture endpoint. Keep fonts and API responses in declared fixtures. Host plugins
and tests remain trusted code outside Bazel’s filesystem sandbox.

# Editor visual tests

This Bazel target exercises the real editor in Chromium through `rules_web_e2e`.
It captures the loaded UI and a populated translation field. A local Vite
middleware serves deterministic message fixtures; no external service is needed.

```sh
bazel build //packages/editor/vrt:typecheck
bazel test //packages/editor/vrt:visual_test --test_output=errors
bazel run //packages/editor/vrt:visual_test.update
```

Docker must be running and available on PATH. Baselines use the rule’s pinned
Linux image; initial validation is Linux amd64. Review `__screenshots__/*.png`
after an explicit update. Compare mode never modifies source baselines. Test
failures retain JUnit and screenshot diffs in Bazel’s undeclared test outputs.

The editor still uses Material UI 4 and React 17. This directory owns an isolated
npm lockfile to preserve that runtime without changing the monorepo’s React
version. Parser and react-intl dependencies are pinned public releases; these
visual tests exercise editor sources, not unreleased formatter changes.

The repository’s `rules_web_e2e` dependency is a development pin until a BCR
release exists. The pinned repository currently requires GitHub access; this
integration must remain draft until that dependency is publicly fetchable.
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

Playwright Test serves the editor fixture through Vite, navigates to the
dynamically assigned `VRT_APP_URL`, and compares locator screenshots with
`toHaveScreenshot`. The runner owns browser contexts, server readiness, traces,
and teardown. No experimental component-testing harness is required.

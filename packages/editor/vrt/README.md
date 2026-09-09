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

`server.mts` owns the Vite server adapter. `shell.tsx` supplies consumer-owned
IntlProvider and document settings. `app.tsx` supplies deterministic message
data. The tests cover loaded/editing screenshots plus selection, search,
copy/clear, and recovery from invalid ICU input. Core state and custom renderer
coverage also runs in the normal Bazel unit-test lane without Docker.

The public rules repository is pinned by commit until a BCR release exists.
Failures retain JUnit results and screenshot diffs in undeclared test outputs.

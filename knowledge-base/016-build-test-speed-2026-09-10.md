# Build and test speed after the polyfill stack

## Matched local measurements

Compare main immediately before the final stack (`fb436f09f`) with the directly
pushed stack (`f7e0d1a3a`). Both use Bazel 9.2.0 and Node 24.14.0 on the same
macOS arm64 host. This isolates the final twelve changes, not every change since
the original ECMA-402 audit.

Build NumberFormat, DateTimeFormat, and Collator `:pkg` targets together, with
six jobs, empty disk/remote action caches, and a shared warm repository download
cache. Use a fresh output base for each cold build; no `bazel clean` is needed.
Run two pairs in before/after, then after/before order. Timings include Bazel
startup, analysis, and execution; these are cold output builds, not cold downloads.

| Measurement                                | Before           | After            |
| ------------------------------------------ | ---------------- | ---------------- |
| Cold package build, both trials            | 64.418s, 61.361s | 62.774s, 62.912s |
| Mean cold build                            | 62.890s          | 62.843s          |
| First no-op rebuild, both trials           | 1.476s, 1.493s   | 1.433s, 1.375s   |
| Second no-op rebuild, both trials          | 0.475s, 0.445s   | 0.409s, 0.447s   |
| Comment-only incremental edit, both trials | 1.633s, 1.663s   | 1.743s, 1.672s   |
| Uncached focused test median, four trials  | 2.061s           | 2.053s           |

The incremental edit appends a comment to NumberFormat `core.ts`; restore it
after each variant. This checks source invalidation but does not model a runtime
change that alters generated data or broad dependencies. Its mean difference is
0.060s, too little evidence to claim a meaningful regression from two trials.

Focused tests are `//packages/intl-numberformat:unit_tests`,
`//packages/intl-datetimeformat:intl-datetimeformat_test`, and
`//packages/intl-collator:intl-collator_test`. Warm their build outputs once, then
run four trials per variant in ABBAABBA order with `--nocache_test_results`.
Before timings: 2.094s, 2.059s, 2.062s, 2.060s. After: 2.171s, 2.076s, 2.030s,
2.017s. Every test passes. These measurements do not establish the cost of a
cold `//...` Rust/TypeScript build or the full Test262 suite.

For reproduction, use detached worktrees at the two commits and run:

```sh
bazel --output_base=/absolute/path/to/fresh-output-base build \
  --repository_cache=/absolute/path/to/shared-download-cache \
  --disk_cache= --remote_cache= --remote_executor= --jobs=6 \
  //packages/intl-numberformat:pkg \
  //packages/intl-datetimeformat:pkg \
  //packages/intl-collator:pkg
```

Repeat the same command for no-op and incremental measurements. See
[the runtime benchmark report](015-test262-progress-2026-09-09.md#performance)
for formatting latency and combined-Locale startup results.

## CI cache overhead

[Main run 34421727498](https://github.com/formatjs/formatjs/actions/runs/34421727498)
took 807s for the test job, including 334s in Run Tests and 329s in Post Setup
Bazel. The repository cache alone spent 289s compressing/reserving an archive
before losing a reservation race to another writer. The preceding main job took
395s overall with 261s in Run Tests and 28s in cache cleanup. These CI runs have
different cache and runner conditions; they are not controlled build benchmarks.

The shared setup action now lets only the main test job save the repository
cache. Other jobs restore it without registering a save. Disk-cache keys remain
unchanged, with writes restricted to default-branch pushes. This removes PR
archive work and duplicate repository writers without changing test selection
or BuildBuddy execution. The new repository-cache namespace starts cold until
its first successful main test run. PR CI validates the restore-only path;
the writer path runs after merge on main.

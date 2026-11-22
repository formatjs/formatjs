# Host lunisolar chronology proof

[Proof and TS Number bounds](proof.md). Source snapshot: [hashes](source-hashes.json), [AST](source-ast.json). Original recorded outputs remain unchanged: [finite](finite-result.json), [compact joins](compact-join-result.json).

Use Python3. Scripts work from any working directory when called by path. Scripts import one sibling module, `temporal_lunisolar_partition_proof.py`. Default outputs are sibling `*-rerun.json`; recorded results stay intact. No dependencies/build needed.

```sh
python3 finite.py
python3 compact_join.py --chinese PATH_FROM_CQUERY --dangi PATH_FROM_CQUERY
```

Each generated input flag accepts repeated explicit paths to compare configured copies. Optional `--output FILE` chooses rerun output. No Bazel output paths are guessed by proof scripts.

Owning targets from live `packages/intl-datetimeformat/scripts/calendar-data/BUILD.bazel:31–45`:

- `//packages/intl-datetimeformat/scripts/calendar-data:host_chinese_data` produces `host-chinese.ts`.
- `//packages/intl-datetimeformat/scripts/calendar-data:host_dangi_data` produces `host-dangi.ts`.
- `//packages/intl-datetimeformat/scripts/calendar-data:host_lunisolar` is generator.
- `//packages/intl-datetimeformat/scripts/calendar-data:pkg` owns generated `icu.calendar` package; srcs includes both data targets.

`tools/generated.bzl:7–43` keeps generated file target name unchanged through `ts_run_binary`; `pkg` transpiles/package-assembles these source outputs. Temporal BUILD imports generated package through `//:node_modules/@formatjs_generated/icu.calendar`.

Root can confirm configured consumed artifacts through Bazel:

```sh
bazel cquery --output=files //packages/intl-datetimeformat/scripts/calendar-data:host_chinese_data
bazel cquery --output=files //packages/intl-datetimeformat/scripts/calendar-data:host_dangi_data
```

Use matching configuration/transition for tested host bundle when binding artifacts. Original results record identical hashes for all five existing configuration copies per calendar. This package preparation ran no Bazel query/build.

Current source binding: [review note](current-source-binding.json). Configured data outputs: [Bazel cquery bindings](consumed-artifacts.json). Original finite and compact results remain unchanged.

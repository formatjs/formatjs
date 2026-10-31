# DateTimeFormat ICU snapshots

```sh
bazel test //crates/intl_datetimeformat/tests:icu4j_conformance_snapshot_test
```

Both TS and Rust are compared independently with pinned ICU4J 79.1 strings and
parts, including range sources. This is a normal Bazel test in CI. The TS adapter
uses the Bazel-pinned Node NumberFormat for numeric fields; Rust uses its native
NumberFormat. Neither uses host DateTimeFormat as its oracle.

12,399 cases cover 17 locales, 16 calendars, seven numbering systems, five zones,
DST transitions, Japanese era changes, Date bounds, styles and fractional seconds.
ICU selects its own patterns from skeletons/styles; no FormatJS patterns feed it.

Baseline: 8,777 exact matches per engine, 1,193 single-date text differences,
2,421 range text differences and eight range parts-only differences. Both engines
agree in this corpus, illustrating why TS/Rust parity alone is insufficient.
Differences include generic/GMT zone names, interval grammar/collapse, ISO pattern
preferences and time-only ranges crossing dates. ICU differences are audit leads,
not automatic ECMA-402 failures. This optimization preserves the baseline.

Snapshots record exact differences and hash the complete oracle fixture. Matching
cases are checked too; changes cannot hide behind an allowlist. To update:

```sh
bazel run -c opt //crates/intl_datetimeformat/tests:icu_audit -- --update-snapshot="$PWD/crates/intl_datetimeformat/tests/snapshots/icu4j.jsonl"
```

Review changed cases before committing. `bazel test` cannot update snapshots.

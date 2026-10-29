# Locale matching benchmarks

Compare `formatjs_intl_localematcher`, ICU4C, and ICU4J distance matching with the
same supported locales, requests, default locale (`en`), and expected selections.
ICU4X parent fallback is a separate baseline.

```sh
python3 benchmarks/locale-matching/run.py \
  --icu4c-prefix /opt/homebrew/opt/icu4c@78 \
  --iterations 100000 --repetitions 5
```

Requires macOS or Linux, Python 3, Bazel, and an installed ICU4C development
package. Omit the prefix to use `pkg-config icu-uc`, or set `ICU4C_PREFIX`.
The runner injects a temporary local ICU repository; no machine-specific path is
added to MODULE.bazel. All benchmark programs build through Bazel with `-c opt`.
ICU4J uses the repository's pinned jar. The runner rejects disagreement among distance matchers and records ICU4X fallback differences.

`results.json` retains versions, platform, supported counts, medians, and all
five process samples. Runtime order alternates between repetitions. The workloads
use all 766 CLDR locales and an 11-locale set.

- `construct`: parse/canonicalize supported strings and build a matcher. Each
  sample times 100 constructions after warmup.
- `prepared`: reuse requests. Rust's `DesiredLocale` stores maximized LSRs;
  ICU4C/J receive locale objects and perform their own per-query maximization.
  Regular cases use list APIs, including single-element lists.
- `strings`: parse, canonicalize, and match every iteration.
- `full_unseen`: rotate through 520 private-use languages, exceeding Rust's
  256-entry cache. Uses 5,000 measured iterations and single-locale ICU APIs.
- `cold_process_ms`: start a fresh process, read cases, construct the full
  matcher, and match `en` once. Includes JVM/native process startup.

JVM uses a fixed 256 MiB heap and Serial GC. Construction receives 1,000 warmups;
query warmup equals measured iterations. Volatile sinks/black boxes prevent dead
code elimination. Rust's bounded closest-match cache stays enabled: repeated
queries measure the production API, while `full_unseen` measures cache misses.
These are local microbenchmarks, not a general language/runtime ranking.

## TypeScript startup

`typescript-results.json` compares HEAD's original matcher with the port using
seven alternating fresh processes per case. Timings include supported-list
preparation and matching, excluding module loading and process startup. The
baseline commit and raw samples are recorded. Cold median milliseconds:

| Request | Original | Port |
| ------- | -------: | ---: |
| en      |     1.97 | 0.80 |
| en-US   |     2.98 | 2.54 |
| zh-TW   |     3.06 | 2.50 |
| en-XZ   |    71.45 | 7.69 |

The fuzzy case intentionally changes selection from `en-GB` to `en`, following
ICU's default/likely-region tie breaking. Both runs use the same supported list.

Warm public benchmarks remain available:

```sh
bazel run //packages/intl-localematcher/benchmark:bestfit_benchmark
```

## Recorded native results

Apple M4 Max; ICU4C 78.3; ICU4J 78.1; Java 17.0.17. Medians of five
fresh-process runs, nanoseconds per query:

| Workload                           | Rust | ICU4C | ICU4J |
| ---------------------------------- | ---: | ----: | ----: |
| Full list, prepared exact          |   21 |   133 |    45 |
| Full list, string exact            |  218 |   594 |   290 |
| Full list, prepared repeated fuzzy |   35 | 7,222 | 6,068 |
| Full list, prepared unseen         |  151 | 2,143 | 4,032 |
| Full list, string unseen           |  413 | 4,361 | 9,082 |

Full-list construction: rust 0.431ms, icu4c 0.861ms, icu4j 1.584ms.
Cold process plus one match: rust 7.64ms, icu4c 10.02ms, icu4j 182.83ms.
All distance matcher selections agree.

## ICU4X parent fallback

Pinned ICU4X `icu_locale` 2.3.1 provides `LocaleFallbacker`, without a public
distance matcher. The [public locale API](https://docs.rs/icu_locale/latest/icu_locale/)
also documents canonicalization and likely-subtag expansion. The benchmark adapter
adds supported-locale membership and a default around ICU4X's parent chain.
It uses the same input lists but performs different work.

| Workload        | ICU4X fallback, ns |
| --------------- | -----------------: |
| Prepared exact  |                 33 |
| String exact    |                 90 |
| Prepared fuzzy  |                198 |
| Prepared unseen |                109 |
| String unseen   |                189 |

Five selection differences in the recorded workloads:

- `full_script_fallback`: distance `sr-Cyrl`; ICU4X fallback `sr`.
- `small_language_fallback`: distance `fr`; ICU4X fallback `en`.
- `small_regional_fallback`: distance `en-GB`; ICU4X fallback `en`.
- `small_script_fallback`: distance `sr-Latn`; ICU4X fallback `en`.
- `full_unseen`: distance `en`; ICU4X fallback `und`.

These timings do not establish an equivalent ICU4X distance-matching result.

## Native adapter

`native-adapter-results.json` records three alternating warm samples against
main's native matcher (`f6103eb58`) on an Apple M4 Max. Exact matching cost
increased from 62–712 ns to 88–1,997 ns in these cases. Regional and fuzzy
matches fell from about 164 µs to 0.65 µs. Fuzzy results can differ because
the new matcher follows ICU distances.

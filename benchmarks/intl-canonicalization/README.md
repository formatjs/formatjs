# Hermes locale canonicalization benchmark

[Recorded results](./results.json): Apple M4 Max, macOS arm64, optimized build,
2026-10-25. Rust speedups over the JS polyfill: simple tags **5.59×**, aliases
**8.22×**, extensions **7.42×**, locale lists **7.48×**. All 76 pinned
`Intl.getCanonicalLocales` Test262 scenarios passed separately in Hermes.

```sh
bazel test -c opt //benchmarks/intl-canonicalization:conformance_test
bazel test -c opt //benchmarks/intl-canonicalization:reference_test
bazel run -c opt //benchmarks/intl-canonicalization:benchmark
bazel run -c opt //benchmarks/intl-canonicalization:benchmark -- --oracle
```

`conformance_test` compares the installed Rust JSI API with
`getCanonicalLocales` imported directly from the TypeScript package source.
The reference never falls back to native `Intl.getCanonicalLocales`. Both run
in one Hermes runtime, with fresh inputs for each implementation.

The suite makes 2,220 deterministic assertions. Cases include 49 expected
canonicalizations, 98 casing variants, 1,152 combinations of languages,
scripts, territories, variants, and extensions, plus 120 malformed tags.
Seventy observable cases check coercion hints, holes, inherited properties,
Proxy access order, mutation during iteration, abrupt completion identity,
deduplication, result descriptors, and the installed API shape. Twelve cases
exercise branded `Intl.Locale` instances through the same prelude as Test262;
missing Locale support fails the test. Each observable case checks expected
output, errors, and traces for both implementations, then compares them.

`reference_test` checks those same observable and malformed-tag fixtures
against pinned Node and the TypeScript implementation: 578 assertions, without
building Hermes. Run native Hermes conformance on Linux CI. Differences fail
except these explicitly checked JavaScript baseline gaps:

- JavaScript accepts invalid `root`; Rust rejects it with `RangeError`.
- For 32 `hye-{Latn,Armn}-SU` combinations, JavaScript selects `RU`; Rust selects
  `AM`, matching native Node 24.14.0 / ICU 78.2 and
  [UTS #35 likely-subtag fallback](https://unicode.org/reports/tr35/#LocaleId_Canonicalization).

JSON output records coverage counts and both differences. Timed inputs all
agree. `--oracle` runs the pinned Node reference probe.

Timings include JavaScript list handling, JSI/FFI calls, canonicalization,
allocation, and returned arrays. Four workloads cover simple tags, aliases,
extensions, and lists. Each uses warmup, calibrated iteration counts, nine
alternating measurement rounds, median nanoseconds per API call, and consumed
outputs. JSON lines include raw samples and speedup (`polyfill / Rust`).

The benchmark keeps its existing runtime profile and pre-timing checks; the
Locale prelude and expanded observable fixtures run only in conformance mode.
It measures warmed steady-state calls on the host, not mobile startup, app
size, or total memory. Hermes GC runs naturally during measurements.

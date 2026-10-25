# Hermes locale canonicalization benchmark

[Recorded results](./results.json): Apple M4 Max, macOS arm64, optimized build,
2026-10-25. Rust speedups over the JS polyfill: simple tags **5.59×**, aliases
**8.35×**, extensions **7.62×**, locale lists **7.32×**. All 76 pinned
`Intl.getCanonicalLocales` Test262 scenarios passed separately in Hermes.

```sh
bazel test -c opt //benchmarks/intl-canonicalization:conformance_test
bazel run -c opt //benchmarks/intl-canonicalization:benchmark
bazel run -c opt //benchmarks/intl-canonicalization:benchmark -- --oracle
```

Both implementations run in one Hermes runtime: Rust through the JSI adapter,
and the current FormatJS JavaScript polyfill bundled from source. Every run
checks expected canonical tags, rejection, deduplication, and JavaScript
coercion before timing. A deterministic matrix adds 1,152 combinations of
languages, scripts, territories, variants, and extensions. Differences fail
the run except these explicitly checked JavaScript baseline gaps:

- JavaScript accepts invalid `root`; Rust rejects it with `RangeError`.
- For 32 `hye-{Latn,Armn}-SU` combinations, JavaScript selects `RU`; Rust selects
  `AM`, matching native Node 24.14.0 / ICU 78.2 and
  [UTS #35 likely-subtag fallback](https://unicode.org/reports/tr35/#LocaleId_Canonicalization).

JSON output records both differences. Timed inputs all agree. `--oracle` runs
the pinned Node reference probe.

Timings include JavaScript list handling, JSI/FFI calls, canonicalization,
allocation, and returned arrays. Four workloads cover simple tags, aliases,
extensions, and lists. Each uses warmup, calibrated iteration counts, nine
alternating measurement rounds, median nanoseconds per API call, and consumed
outputs. JSON lines include raw samples and speedup (`polyfill / Rust`).

The suite measures warmed steady-state calls on the host, not mobile startup,
app size, or total memory. Hermes GC runs naturally during measurements.
`Intl.Locale` object checks run only when the host provides that constructor.

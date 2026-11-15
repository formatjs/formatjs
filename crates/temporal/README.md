# formatjs_temporal

Work in progress: dependency-free, `no_std` Rust Temporal core. Not published.

Current API: checked `Instant` construction, exact epoch values and ordering,
proleptic Gregorian conversion, ISO instant parsing with basic/extended forms,
fractional offsets, leap-second normalization and RFC 9557 annotation handling.
No JavaScript coercion or object model lives here; those belong in TS facades.

```rust
use formatjs_temporal::Instant;

let instant: Instant = "1970-01-01T00:00:00.000000001Z".parse().unwrap();
assert_eq!(instant.epoch_nanoseconds(), 1);
```

```sh
bazel test -c opt //crates/temporal:temporal_test
```

Tests share parser vectors with TS and independently compare both Gregorian
conversion directions with ICU4J 79.1 across Temporal's full instant range.

Calendar/timezone operations, Hermes native bindings and a complete WASM facade
remain incomplete. See [implementation tracking](../../knowledge-base/015-temporal.md).

`Instant::round` supports all nine Temporal modes and valid day-dividing
increments. `Display` writes UTC ISO strings; `Instant::format` supports explicit
precision and caller-supplied offsets without allocation. Named zone lookup is
not implemented in Rust yet. An independent ICU decimal oracle supplies 2,349
rounding cases, including negative epochs, ties and range boundaries.

Duration stores Number-representable integer fields and validates mixed signs,
calendar-field bounds and the exact nanosecond limit. It parses ISO fractional
hours/minutes/seconds, formats without allocation, supports signed precision
rounding, immutable sign changes, time addition/subtraction, time comparison and
totals. Instant add/subtract and differences reuse this core.

Calendar-relative Duration operations remain pending. An independent ICU oracle
checks 5,430 signed rounding and exact rational-to-double total cases, including
unsafe-integer results. Totals round once to IEEE binary64; converting the
numerator to f64 before division would introduce double rounding.

## WASM baseline

```sh
bazel build -c opt //crates/temporal:wasm
bazel test -c opt //benchmarks/temporal:wasm_test //benchmarks/temporal:hermes_wasm_probe
bazel run -c opt //benchmarks/temporal:wasm_benchmark
```

`:wasm` scopes the `wasm32-unknown-unknown` transition to this artifact. No new
runtime dependencies, wasm-bindgen or wasm-opt. The stripped cdylib uses size
optimization; its core dependency uses the normal optimized configuration.

`wasm.rs` exposes a synchronous benchmark-only string ABI with separate 256-byte
input/output buffers. It covers Instant parsing/rounding/UTC formatting, Duration
parsing/formatting/totals and signed rounding. It does not provide JavaScript
brands/coercions, unbounded ISO annotations, calendars or named timezone lookup.
WASM execution matches all 5,430 independent ICU Duration cases, plus boundary,
invalid-input and forced `temporal-polyfill` controls. This is not a complete
Temporal WASM polyfill.

Pinned Hermes has no `WebAssembly` global in source or optimized bytecode. Hermes
support therefore needs the TS facade or native Rust bindings. Size, cold-start
and throughput records live in [benchmark notes](../../benchmarks/temporal/README.md#wasm-baseline).

## PlainTime

`PlainTime` adds strict ISO time/date-time parsing, exact within-day nanoseconds,
checked fields, wraparound arithmetic that ignores date duration fields,
comparison, signed differences, all nine rounding modes and allocation-free
precision formatting. Field-relative rounding preserves half-even parity for
increments such as 12 minutes and 8 nanoseconds. Shared TS/Rust parsing vectors
cover annotations, offsets, ambiguity, leap seconds and invalid dates. Both
implementations match all 7,740 independent ICU clock-rounding cases.

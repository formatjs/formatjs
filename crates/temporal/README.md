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

Duration/calendar/timezone operations, Hermes native bindings and WASM remain
incomplete. See [implementation tracking](../../knowledge-base/015-temporal.md).

# formatjs_temporal

An allocation-free `no_std` Temporal core for Rust. It provides typed dates,
times, durations, calendars, time zones, and `Now`.

## Installation

```sh
cargo add formatjs_temporal --features compiled_data
```

The published crate includes the generated data and Cargo build script.

```rust
use formatjs_temporal::{TemporalContext, ZonedParseOptions};

fn main() -> Result<(), formatjs_temporal::Error> {
    let context = TemporalContext::compiled()?;
    let meeting = context.parse_zoned(
        "2020-03-07T12:00-05:00[America/New_York]",
        ZonedParseOptions::default(),
    )?;

    println!("{}", meeting.instant());
    // 2020-03-07T17:00:00Z
    Ok(())
}
```

Create a context once and reuse its validated registries. Parsed values keep
their calendar and time-zone providers.

## Choose your data

| Feature               | Data or integration                                |
| --------------------- | -------------------------------------------------- |
| Default               | Arithmetic calendars, UTC, and fixed offsets       |
| `compiled_calendars`  | Chinese, Dangi, and Umm al-Qura tables             |
| `compiled_time_zones` | IANA transition history and recurring future rules |
| `compiled_data`       | Both sets of tables                                |
| `ffi`                 | Optional JSON bridge for JavaScript backends       |

For caller-owned data, build a `CalendarRegistry` and `TimeZoneRegistry`, then
pass them to `TemporalContext::new`. Table and transition storage must outlive
the values that use it. Supply time-zone records sorted by primary identifier,
without duplicates. Callers own data loading and decoding.

Missing tables return `MissingCalendarData` or `MissingTimeZoneData`.
Unknown zone identifiers return an error. `TimeZoneRegistry::system` is the
host-default lookup and falls back to UTC for missing or unresolvable names.
Rust's `Now` takes a clock and time-zone provider from the embedding application.

## Arithmetic boundaries

Omitting a wall-clock time when converting a date to a zoned date-time selects
the first instant of the civil day. An explicit time uses compatible gap and
fold resolution. The first instant can differ from midnight.

Calendar-unit totals validate both interpolation endpoints, even for exact
results. A zero zoned total can fail near a date limit. A plain zero total
returns zero.

## JavaScript and verification

The [TypeScript polyfill](https://formatjs.github.io/docs/polyfills/temporal/)
and [native Hermes SDK](https://formatjs.github.io/docs/guides/hermes-intl/#temporal)
expose the JavaScript API. The SDK delegates typed operations to Rust while
JavaScript handles coercion, option order, brands, and object allocation.

Run the Rust suite and compiled-data context tests from the repository:

```sh
bazel test -c opt //crates/temporal:temporal_test //crates/temporal:context_test
```

See the [API reference](https://docs.rs/formatjs_temporal) and the
[implementation guide](../../knowledge-base/015-temporal.md) for verification
and data policies.

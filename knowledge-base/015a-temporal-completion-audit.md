# Temporal completion audit

Original scope: Rust and TS Temporal, Hermes, Test262 with justified host/Realm
exclusions, independent ICU controls, comparisons with temporal-polyfill, WASM/TS
size and performance, package migration, stacked PR delivery.

This ledger separates source coverage from completion evidence. The package
remains private until the complete audit passes.

## Requirements

| Requirement             | Current evidence                                                                                               | Remaining verification                                                                            |
| ----------------------- | -------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------- |
| Package ownership       | `packages/temporal` owns runtime, exports and tests; benchmarks import it.                                     | Recheck migration references and published package assembly.                                      |
| Rust semantics          | Eight typed values, calendar/timezone providers, parsing, formatting, exact arithmetic and relative durations. | Finish operation-level mapping, including composed operations and observable JS responsibilities. |
| TS conformance          | Full class globs in `_CLASS_TEST262_SUITES`; default compact-calendar gates and tracked counts.                | Consolidate a current full run, installation/Intl paths and every exclusion.                      |
| Rust-backed conformance | WASM and Hermes SDK use the same normalized Rust contract.                                                     | Consolidate full native suites; a passing class does not prove the whole namespace.               |
| Independent authority   | ICU calendar/offset/transition/rounding fixtures, HKO/KASI lunar controls, documented oracle bounds.           | Finish numeric lunar boundary and host/owned timezone-version integration audit.                  |
| Hermes support          | Source/optimized-bytecode targets, SDK host clocks and timezone support, partial-Intl startup regression.      | Recheck complete SDK installation/distribution and supported conformance scopes.                  |
| Reference benchmarks    | Forced temporal-polyfill full implementation, output equality checks and versioned snapshots.                  | Refresh representative current workloads and distinguish data policies.                           |
| WASM versus TS          | Published consumer/module sizes include JS glue and binary; matched primitive/facade workloads exist.          | Refresh current delivery profiles and required startup/throughput evidence.                       |
| Delivery                | Incremental PRs managed with `gh stack`.                                                                       | Verify final stack state and exact tested commits.                                                |

## Rust source map

| Value          | Main Rust routes                                                                                                                               |
| -------------- | ---------------------------------------------------------------------------------------------------------------------------------------------- |
| Instant        | `lib.rs`, `parse.rs`, `rounding.rs`, `duration.rs`, `format.rs`; Rust ordering compares epoch nanoseconds.                                     |
| Duration       | `duration.rs`, `plain_relative.rs`, `relative_duration.rs`; exact rational totals and calendar/zoned anchors.                                  |
| PlainTime      | `time.rs`; fields, replacements, clock arithmetic/differences, rounding and formatting.                                                        |
| PlainDate      | `date.rs`, `calendar_provider.rs`, `plain_relative.rs`; calendar fields, merging, arithmetic, differences and date/time composition.           |
| PlainDateTime  | `date.rs`, `plain_relative.rs`; clock/date composition, calendar arithmetic, rounding and differences.                                         |
| PlainYearMonth | `short_dates.rs`; reference dates, field regulation, arithmetic, differences and conversion to date.                                           |
| PlainMonthDay  | `short_dates.rs`; reference-year selection, leap-month handling and conversion to date.                                                        |
| ZonedDateTime  | `zoned.rs`, `zoned_difference.rs`, `zoned_string.rs`; local/instant resolution, replacements, boundaries, arithmetic, differences and strings. |
| Now            | `now.rs`; injected clock plus explicit timezone provider. System discovery belongs to the embedding.                                           |

Paths above are relative to `crates/temporal`. Public fields, Rust traits and
method composition count when they implement the required semantics; method-name
counts alone do not establish coverage.

`NativeTemporal` currently declares 62 normalized operations. The Rust FFI
manifest contains the same 62 names, with no missing or extra entries. This
checks contract parity; it does not prove each facade reaches the right operation.
JS retains coercion, option/property order, brands, slots and object allocation.
Locale rendering also involves the Intl implementation and host data.

## Latest audit findings

- Rust zoned replacements now have public `with_time_zone` and `with_time`
  methods. Independent ICU controls verify zone replacement, compatible clock
  resolution and omitted-time day boundaries. This does not close the whole
  native coverage audit.
- Importing with an Intl namespace lacking DateTimeFormat crashed while capturing
  `formatToParts`. Guarding the constructor restores bare Hermes SDK startup;
  regression cases cover partial, empty and absent Intl through installation.
- `completeTemporalBackend: false` remains unchanged. Audit semantic coverage
  and bindings before changing that claim.
- Host Intl is allowed. A host-only timezone migration is optional; exact owned
  transition data remains a valid implementation choice.

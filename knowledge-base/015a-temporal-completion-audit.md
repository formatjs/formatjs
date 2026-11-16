# Temporal completion audit

Original scope: Rust and TS Temporal, Hermes, Test262 with justified host/Realm
exclusions, independent ICU controls, comparisons with temporal-polyfill, WASM/TS
size and performance, package migration, stacked PR delivery.

This ledger separates source coverage from completion evidence. The package
remains private until the complete audit passes.

## Requirements

| Requirement             | Current evidence                                                                                                  | Remaining verification                                                                            |
| ----------------------- | ----------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------- |
| Package ownership       | `packages/temporal` owns runtime, exports and tests; benchmarks import it.                                        | Recheck migration references and published package assembly.                                      |
| Rust semantics          | Eight typed values, calendar/timezone providers, parsing, formatting, exact arithmetic and relative durations.    | Finish operation-level mapping, including composed operations and observable JS responsibilities. |
| TS conformance          | Fresh class and full Intl gates: 13,324 unique scenarios pass per provider union; two documented data exclusions. | Resolve host/owned timezone data mismatch; keep provider scopes explicit.                         |
| Rust-backed conformance | SDK source/bytecode and native-data WASM full gates pass; all 62 Rust operations return successfully.             | Close typed PlainDate omitted-time zoned conversion gap.                                          |
| Independent authority   | ICU calendar/offset/transition/rounding fixtures, HKO/KASI lunar controls, documented oracle bounds.              | Resolve confirmed host/owned timezone-version mismatch.                                           |
| Hermes support          | Source/optimized-bytecode targets, SDK host clocks and timezone support, partial-Intl startup regression.         | Recheck complete SDK installation/distribution and supported conformance scopes.                  |
| Reference benchmarks    | Forced temporal-polyfill full implementation, output equality checks and versioned snapshots.                     | Current Node snapshots refreshed; finish current Hermes measurements.                             |
| WASM versus TS          | Published consumer/module sizes include JS glue and binary; matched primitive/facade workloads exist.             | Current Node sizes/throughput refreshed; cold TS load and Hermes timing remain.                   |
| Delivery                | Incremental PRs managed with `gh stack`.                                                                          | Verify final stack state and exact tested commits.                                                |

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

Typed API review confirms clock/date projection through `PlainDateTime::date`
and `time`, and zoned projection through `ZonedDateTime::local`. Short-date
construction can reuse calendar fields and `from_calendar_fields` without
reimplementing reference-date selection. Relative Duration operations are public
on plain and zoned anchors.

One concrete surface gap remains: a caller starting with `PlainDate` cannot
directly request its earliest zoned instant with omitted time. The existing
`day_boundary(day)` algorithm is crate-private; public `start_of_day` requires an
existing zoned value. Compatible midnight resolution is a different operation.
Expose the date conversion through this existing algorithm, with skipped-day and
midnight-gap controls, rather than duplicating it in callers.

`NativeTemporal` currently declares 62 normalized operations. The Rust FFI
manifest contains the same 62 names, with no missing or extra entries. This
checks contract parity; it does not prove each facade reaches the right operation.
JS retains coercion, option/property order, brands, slots and object allocation.
Locale rendering also involves the Intl implementation and host data.

## Full namespace run

All reports below were refreshed after the numeric lunar boundary fix. The final
53-target run passed: 44 namespace, six full Intl compatibility and three boundary
targets. Hermes independently passed the shared boundary corpus in source and HBC.

The current audit passed all 44 targets: 11 suites for each of default TS, WASM,
Hermes SDK source and Hermes SDK optimized bytecode. Each profile completed
12,228 executions with no failures or tracked failures (48,912 aggregate).
These are suite executions, not unique Test262 scenarios: calendar selections
overlap the class suites.

Suites cover complete Instant, PlainDate, PlainDateTime, PlainTime,
PlainYearMonth, PlainMonthDay, Duration and ZonedDateTime globs, plus calendars,
Now and installation. They do not cover the whole `intl402/Temporal` tree.

Node's prelude installs the namespace in child realms. Hermes' eshost runtime
does not implement `createRealm` or `evalScript`; the pinned Temporal, Date
`toTemporalInstant` and `intl402/Temporal` files contain no `createRealm` calls.
No Realm exclusion is needed for those selections. The result validator rejects
duplicate file/scenario pairs, missing results, crashes and baseline mismatches.

Full Intl diagnostics retain all 4,080 executions. Compatibility gates select
4,076 and document the two excluded files in
`packages/temporal/tests/intl-compat-test262-count.json`. These are data-version
conflicts: IANA 2026d separated POSIX-rule zones from city links; CLDR49 specifies
numeric zero for explicit offset zones. Raw diagnostics remain available for
checking those assertions and detecting any additional failures.
Five raw profiles completed all 4,080: Node owned Intl, Hermes owned Intl
source/bytecode and Hermes SDK Intl source/bytecode. Every profile passed 4,076;
only those two files failed, each in default and strict scenarios.

Fresh compatibility report unions cover 6,662 files and 13,324 unique scenarios
per TS/WASM/SDK profile, all passing. Comparing with the pinned source tree leaves
exactly the two documented Intl exclusions, no extra files. Node class suites use
host Intl; their full Intl gates install FormatJS Intl. Their unions therefore
combine formatter providers. SDK class and Intl gates both use native SDK Intl.
Native-data WASM excludes duplicate TS calendar/timezone tables.

A separate complete host-Intl diagnostic ran all 4,080 Intl scenarios: 4,078 pass,
two fail on the stale CST6CDT link assertion. Together with the host-backed class
suites it covers all 6,664 files and 13,328 scenarios, with no missing/extra files.
This host renders explicit zero offsets according to the older pinned assertion;
the CLDR49 exclusion is specific to the owned/native formatter profiles.

The 62-operation source audit found a non-test facade caller and Rust handler
for every declared operation. Four parsing/regulation handlers precede the main
dispatch match. This is source reachability evidence, not complete semantic
coverage; independent oracle assertions and backend Test262 runs remain required.

Runtime observation now verifies all 62 operations return successfully through
both published WASM profiles. The public ICU corpus and Duration checks reach 58. Four lower-level adapters are bypassed by higher-level Rust routes:
`addISODays`, `calendarAdd`, `calendarMonthSerial`, `calendarUntil`. Independent
ICU day/calendar fixtures verify those adapters separately, across all 16
calendars where applicable. Artifacts distinguish public and primitive coverage.

## Latest audit findings

- Numeric Chinese/Dangi formatting threw `TypeError: Internal error. Icu error.`
  at valid Date values near the upper limit. The existing safe-year fallback now
  retains the original timezone's local day and restores lunar fields. A safe
  pattern probe preserves related-year requests omitted from host resolved options.
  TS and both WASM entries pass 24 boundary/calendar/timezone combinations each,
  through Number/Date/Instant, ZonedDateTime locale methods, clocks and ranges.
  These are field consistency checks outside independent astronomical bounds;
  Hermes source/HBC pass the same 24 combinations, alongside 936 independent
  ICU-era checks per mode.
- Structural import audit found 231 production imports and no dynamic imports.
  None import benchmark code or another Temporal implementation. Package exports,
  WASM asset ownership and optional Hermes SDK installation remain owned by the
  package and native targets; final assembled-consumer checks are still required.
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

## Current measurements and remaining mismatch

`lunar-boundary-facade-results.json` records 26 Node workloads against forced
`temporal-polyfill/full/implementation` 1.0.7, including Chinese/Dangi/Umm al-Qura
month addition. TS wins 16 measured medians; reference wins ten. Output checks pass.
`lunar-boundary-wasm-results.json` records 43 ISO workloads against the basic
reference: TS wins 21, reference 22; neither WASM profile beats TS on any median.
These are single-machine sequential samples, not a universal performance claim.

`lunar-boundary-backend-size-results.json` measures separately compressed runtime
graphs: TS 70,443 bytes gzip; standalone 338,952; native-data WASM 481,746;
hybrid WASM 514,425. The binary contributes 443,178. Full reference consumer bundle
is 23,226. Payload policies differ: default TS includes owned timezone data while
the reference uses host Intl. Native-data WASM consumer bundle plus binary is
481,452; the matched TS consumer is 68,138. Graph and bundled sizes are alternatives.

Actual host-Intl probes under Node 24/26 expose a data-version mismatch:
`2026-11-16T12:00Z[America/Havana]` has owned hour 08 but locale formatting returns
07 using the older host rules. At 04:30Z the local date also differs. Full pinned
Test262 does not cover this current rule change. This remains a correctness task;
passing the corpus does not close the host/owned integration audit.

# Temporal implementation

FormatJS ships a TypeScript polyfill, a typed Rust crate, and native Hermes
bindings. The JavaScript API follows ECMA-262 Temporal and uses Intl for
locale formatting.

## Where the code lives

| Area                                                                  | Owner                                                       |
| --------------------------------------------------------------------- | ----------------------------------------------------------- |
| JavaScript API, coercion, option order, brands, and object allocation | [packages/temporal](../packages/temporal)                   |
| Typed dates, exact arithmetic, calendars, and time-zone queries       | [crates/temporal](../crates/temporal)                       |
| Native installation and host clock integration                        | [native/hermes](../native/hermes)                           |
| Shared conformance fixtures                                           | [conformance-tests/temporal](../conformance-tests/temporal) |
| Benchmarks and measurements                                           | [benchmarks/temporal](../benchmarks/temporal)               |

Use the [package README](../packages/temporal/README.md) for JavaScript
installation and the [Rust crate README](../crates/temporal/README.md) for typed
usage and compiled data. The native Hermes SDK keeps JavaScript argument handling
in the facade and delegates typed operations to Rust.

## Default installed Intl timezone provider

The default TypeScript entry captures installed `Intl.DateTimeFormat` for
named-zone lookups. Install any Intl polyfills and their data before importing
Temporal. UTC and numeric offsets work without Intl.

Host Intl exposes offsets. Temporal samples them at intervals of up to seven
days and searches changed intervals for the transition. Two host-only
transitions within one interval can escape detection if the offsets at both
ends match. Standalone and native builds with compiled data use bundled IANA
records and future rules for exact transition queries.

`Temporal.Now` reads the host's default zone through Intl when available. Hosts
without DateTimeFormat use the current offset from `Date`. A failed lookup or
unusable identifier falls back to UTC. If a configured clock throws, Now uses
the runtime wall clock. Explicit invalid time-zone arguments still throw.
See [host time-zone code](../packages/temporal/host-timezone.ts) and
[Now](../packages/temporal/now.ts).

## Calendars

Temporal supports 16 calendar identifiers. Chinese and Dangi use compact ICU4X
data for 1900–2102 and an arithmetic approximation outside that range. Umm
al-Qura uses host Intl data for AH 1300–1600 in the default TypeScript entry,
with civil arithmetic outside that range. Standalone and compiled Rust use
bundled tables. ICU checks and independent calendar authority fixtures cover
specific ranges. Boundary tests check arithmetic and internal consistency where
historical or future astronomical data is unavailable.
See [calendar tables](../packages/temporal/calendar-table.ts) and the
[independent authority fixtures](../conformance-tests/calendar-authorities).

## Verify changes

Code comments link to the ECMA-262 clauses they implement. The
[Bazel targets](../packages/temporal/BUILD.bazel) define the supported Test262
profiles and reference their count and exclusion manifests. The
[Intl manifest](../packages/temporal/tests/intl-compat-test262-count.json)
records IANA and CLDR data-version differences. Raw diagnostics retain those
cases.

Run the shared regression fixtures in TypeScript and Rust:

```sh
bazel test -c opt //packages/temporal:polyfill_regressions_test //crates/temporal:temporal_test
```

Use `//native/hermes:temporal_test` for the installed SDK. Run the affected
Test262 and ICU targets when changing public behavior or data.

## Measure performance

Use the [benchmark README](../benchmarks/temporal/README.md) for matched
workloads, startup measurements, and payload sizes. The native Rust comparison
measures the Rust engine directly and excludes binding costs.

```sh
bazel run -c opt //benchmarks/temporal:native_ts_benchmark
```

The commit-pinned [implementation history](https://github.com/formatjs/formatjs/blob/70ecc76dd00743b52d2e1046b788301eb26089a4/knowledge-base/015-temporal.md)
and [completion snapshot](https://github.com/formatjs/formatjs/blob/70ecc76dd00743b52d2e1046b788301eb26089a4/knowledge-base/015a-temporal-completion-audit.md)
preserve older measurements and delivery notes.

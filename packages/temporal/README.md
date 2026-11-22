# @formatjs/temporal

Temporal implementations in TypeScript and native Rust, with Hermes bindings. Importing the namespace changes no globals; runtime
arithmetic never delegates to native Temporal or another Temporal polyfill.

```ts
import {Temporal} from '@formatjs/temporal'

const value = Temporal.ZonedDateTime.from(
  '2020-03-07T12:00-05:00[America/New_York]'
)
value.add({days: 1}).toString()
// 2020-03-08T12:00:00-04:00[America/New_York]
value.add({hours: 24}).toString()
// 2020-03-08T13:00:00-04:00[America/New_York]
```

Exports `Temporal`, its eight constructors, `Now` and `toTemporalInstant`.
Calendar arithmetic supports 16 calendar IDs. Chinese/Dangi use compact ICU4X
historical data and an arithmetic approximation outside 1900–2102. Umm al-Qura
uses captured host Intl data for AH 1300–1600, then the civil fallback. Named
timezones use captured installed `Intl.DateTimeFormat`, including its timezone
data version. UTC and numeric offsets work without Intl. Timezone aliases retain
their spelling separately from primary identity. Update host or installed
polyfill data when timezone laws change. When the installed FormatJS formatter supplies
its private candidate lookup, named-zone resolution enumerates candidates
from the installed transitions and validates them at the Instant limits. The
same provider resolves interior gaps from the nearest reachable local times.
Reloading the installed FormatJS timezone data refreshes cached offsets and
transitions on the next lookup.

## Installation

```ts
import '@formatjs/temporal/polyfill.js'
```

This preserves an existing Temporal implementation and supplies
`Date.prototype.toTemporalInstant`. Use `polyfill-force.js` to install this
namespace unconditionally. Install needed Intl polyfills and their locale,
calendar and timezone data before Temporal.

Installation registers owned brands with FormatJS DateTimeFormat and native
Hermes Intl bridges. When only legacy DateTimeFormat exists, its constructor and
four formatting methods are adapted. Native prototype identity, subclassing,
legacy constructor chaining, captured option values and ordinary Date/Number
formatting remain supported. Importing the namespace alone does not install this
adapter.
Construct formatters after installation; pre-existing instances retain native behavior.

For calendar and named-timezone operations without host Intl data, use the
full-table namespace:

```ts
import {Temporal} from '@formatjs/temporal/standalone.js'
```

`standalone.js` includes compact owned IANA timezone histories with exact finite
transitions and recurring future rules, without a 2100 cutoff. Default ships
identifiers and transition-search intervals, not offset histories. Entries expose separate namespaces;
installation entries install the default namespace. Chinese/Dangi arithmetic is
adapted from ICU4X under Unicode-3.0; see LICENSE.md.

Default accepts native Intl or installed FormatJS polyfills; no formatter package
is imported, so no circular runtime dependency. Install Intl before importing
Temporal, which captures its intrinsics. ICU oracles verify offsets, gap/fold
resolution and transitions on Hermes. Node also compares host-data results with
`temporal-polyfill`. Native Intl exposes offset queries. Forward searches
probe from 1800 or the input, whichever is later, through three years beyond
the latest of the input, current date and shipped last explicit transition.
Previous searches probe nearby future years before resuming at the padded
finite-history bound.
Generated intervals account for closely spaced IANA transitions and recurring
rules, capped at seven days because host tzdata may differ. Two host transitions
within one probe interval can still be missed; Intl provides no exhaustive search.
Use standalone when owned timezone history/rules must determine results.

## Locale formatting

All eight classes expose `toLocaleString(locales?, options?)`. Date/time classes
use captured DateTimeFormat operations; Duration uses DurationFormat. Without the
corresponding Intl formatter, locale methods return their ISO representation.
Temporal patch releases include updates to the shared DateTimeFormat and
DurationFormat helpers.

The owned DateTimeFormat path accepts exact nanoseconds, including plain dates
outside Date's TimeClip range. Load the needed FormatJS Intl polyfills and data
before installing Temporal. An isolated namespace can register explicitly with
`DateTimeFormat.__addTemporalNamespace(Temporal)`.

Legacy DateTimeFormat projects each Temporal kind onto the permitted fields.
Plain values ignore the formatter's timezone; YearMonth/MonthDay styles omit
reference fields. Ranges require matching Temporal types. Native style components
are inferred through captured `formatToParts` operations before host matching.
Chinese/Dangi date fields use the same calendar arithmetic as Temporal, including
numeric Date inputs when host ICU data differs. Captured host formatters supply
localized labels. Validated numeric Year ranges keep their numeric month and
day widths, verified weekday labels and Buddhist month text with matching
ordinals. Other corrected ranges use complete endpoint patterns.
All supported non-Gregorian plain values also format beyond Date TimeClip.
Safe Gregorian-cycle surrogates preserve weekday/clock; Temporal restores calendar
fields and eras. Host Intl supplies month and era labels, with compact CLDR
Before Hijrah labels for older hosts. Japanese era names and first-year forms
remain localized. Numeric Date inputs retain TimeClip.
Numeric Date and Instant formatting, plus ZonedDateTime locale methods, restore
non-Gregorian calendar fields and eras using the target timezone's local ISO date.
Captured host formatters retain weekday, clock and timezone labels. Gregorian era
probes handle BCE dates even when the host falls back to a non-English locale.
Chinese/Dangi numeric inputs also recover when host ICU fails at valid Date
bounds. Safe-year labels retain the original local date, clock and timezone;
ranges restore both endpoints. Boundary checks verify field consistency, not
independent astronomical accuracy outside the documented oracle ranges.

Rust exposes typed values and normalized operations for native bindings. Hermes JS
retains ECMAScript coercion, brands, slots and object allocation; Rust validates
and computes complete results. See the
[completion audit](../../knowledge-base/015a-temporal-completion-audit.md) for
independent controls and conformance scope.

Full Intl compatibility gates cover 4,078 executions with Node host Intl and
4,076 with native SDK Intl. Pinned IANA alias and CLDR zero-offset assumptions
account for the documented exclusions; manifests retain reasons and sources.
Manual unfiltered diagnostics keep all 4,080 executions.

Legacy host formatting supports extended plain Gregorian dates, times and
year-months through both single-value and range APIs. It uses captured
NumberFormat for localized year digits. Ordinary Date/Number inputs retain
their clipping rules.

DurationFormat supports late Temporal installation, branded durations and ISO
duration strings. Installation registers captured getters and parsers with
FormatJS/native Hermes formatters and adapts legacy host formatters. Isolated
namespaces can use `DurationFormat.__addTemporalNamespace(Temporal)` explicitly.

## Delivery

Use the default or standalone TypeScript namespace in JavaScript hosts, the
[`formatjs_temporal` crate](../../crates/temporal/README.md) in native Rust, or the
native Hermes SDK. Temporal WASM entry points and assets have been removed.

## Hermes

Import and installation accept absent or partial Intl namespaces, including
an Intl object without DateTimeFormat. ISO math and Date conversion remain usable.
Locale formatting still needs the corresponding formatter.

The TS implementation runs on Hermes source and optimized bytecode. Pinned Hermes
has no WebAssembly runtime. Use the [native SDK](../../native/hermes/package/README.md)
for Rust-backed Temporal and Intl, or the TS path with needed Intl polyfills.
The [standalone C++ example](../../examples/hermes-intl/README.md) consumes the SDK
without a Rust toolchain.

`Now` captures host clock/zone operations. Native Hermes supplies a system clock
and IANA zone through the SDK. Bare TS without Intl uses Date's current system
offset; it does not infer an IANA location from that offset.

The [Rust crate](../../crates/temporal/README.md) supplies eight value types,
`Now`, calendar providers, caller-owned IANA registries and optional compiled data.
Typed Rust partial updates cover all seven types with `with()` methods;
calendar updates preserve month codes and era relationships. Zoned updates prefer
the source offset by default and support explicit gap/fold and offset policies.
Rust `PlainDate::to_zoned_date_time(zone, None)` selects the first instant of the
civil day; supplying `Some(time)` uses compatible resolution.
JS adapters delegate normalized operations through the matching Rust backend. Rust builds, generated
data and release artifacts use Bazel.

## Validation

```sh
bazel test -c opt //packages/temporal:package_test
bazel test -c opt //packages/temporal:compact_calendar_datetimeformat_test262
bazel test -c opt //crates/temporal:temporal_test //crates/temporal:ffi_test
```

Full class gates cover 9,090 executions per SDK source/HBC profile.
Calendar, Now, installation and Intl selections run separately. The
`intl402/Temporal` corpus has 4,080 executions; it does not include the separate
65 DateTimeFormat files with the Temporal feature.

Count-checked formatter gates require all 130 executions and zero failures on
owned TS/Node, Hermes TS source/HBC and native SDK source/HBC. Their locale
prelude includes Arabic data for non-Latin numeral bounds. Native-host and adapted
non-Temporal DateTimeFormat diagnostics compare all 362 executions.

Independent ICU oracles verify calendar fields and arithmetic, timezone identity,
offsets, transitions, parsing, rounding and locale output. Authority datasets also
check table calendars. Unfiltered diagnostics retain implementation and pinned
IANA/CLDR differences. See the [implementation record](../../knowledge-base/015-temporal.md)
for commands, corpus counts, data policies and remaining work.

Compact-calendar validation includes every year and month in the existing full
ICU4X packs: 1,204,680 years and 14,899,816 months. This verifies the arithmetic
port across internal rounding bounds; it is not an independent calendar oracle.
Separate ICU/HKO/KASI fixtures cover 30,620 rows, including Hermes source/bytecode.
The pinned full Temporal-feature corpus passes with only the documented
IANA/CLDR data exclusions; coverage details follow below.

## Performance

Compare native Rust and the published TypeScript namespace with matched inputs:

```sh
bazel run -c opt //benchmarks/temporal:native_ts_benchmark
```

Current native Rust medians win all 25 cases. The separate 48-case JS baseline
wins 21 against `temporal-polyfill`, 35 against `@js-temporal/polyfill`; remaining
losses keep the performance goal open. These are measured scopes, not universal
performance claims.

The benchmark validates outputs before timing, retains raw samples and includes
`temporal_rs` as a separate native comparison. Native Rust timings exclude binding
costs; Hermes performance must be measured through its native bindings.
See [benchmarks](../../benchmarks/temporal/README.md) for results and limitations.

Pinned Test262 coverage includes Temporal-feature files in DateTimeFormat,
DurationFormat and staging. Supported profiles are TS on Node, plus TS and native
SDK on Hermes source/bytecode. Only documented IANA/CLDR data-version cases are
excluded. Historical WASM results remain in the benchmark records.

For standalone and Rust namespaces, legacy host formatting compares host and
owned offsets. Stale or missing host rules use owned local fields with a localized
numeric offset label. Default TS follows installed Intl timezone data.
With FormatJS DateTimeFormat installed, it reads offsets and transitions
directly from that formatter's packed data.
Reversed Date and Temporal formatter ranges retain their input endpoint order.

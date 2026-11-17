# @formatjs/temporal

Temporal implementation in TypeScript with a Rust core. Importing the namespace changes no globals; runtime
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
polyfill data when timezone laws change.

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
`temporal-polyfill`. Intl exposes no transition enumeration: default searches
offset changes from 1800 through three years beyond the later of now and input.
Previous-transition searches probe nearby future years before historical data.
Generated intervals account for closely spaced IANA transitions and recurring
rules, capped at seven days because host tzdata may differ. Two host transitions
within one probe interval can still be missed; Intl provides no exhaustive search.
Use standalone when owned timezone history/rules must determine results.

## Locale formatting

All eight classes expose `toLocaleString(locales?, options?)`. Date/time classes
use captured DateTimeFormat operations; Duration uses DurationFormat. Without the
corresponding Intl formatter, locale methods return their ISO representation.

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
localized labels. Corrected ranges use full endpoint patterns when native field
collapse no longer applies.
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

Rust exposes typed values and 69 normalized operations; WASM uses ABI 15. JS retains
ECMAScript coercion, brands, slots and object allocation. WASM transfers binary
records through reusable module-owned buffers. Rust returns calendar, clock and
zone properties with date-like results; getters reuse those immutable results.
Date arithmetic and partial updates execute whole Rust operations. Instant
formatting combines rounding, offset lookup and formatting in one call. Backend metadata keeps
`completeTemporalBackend: false` because this ABI is not an ECMAScript object
runtime. The [completion audit](../../knowledge-base/015a-temporal-completion-audit.md)
records Rust routes, independent controls and exact conformance scope.

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

## WASM with native data

```ts
import {
  configureTemporalWasm,
  installTemporalWasm,
} from '@formatjs/temporal/wasm-native.js'

const {instance} = await WebAssembly.instantiateStreaming(
  fetch('/temporal-backend.wasm')
)
const Temporal = configureTemporalWasm(instance)
// Optional global installation:
installTemporalWasm(instance, true)
```

This entry owns its namespace/backend state and omits duplicate TS calendar and
IANA tables. Invalid modules reject before installation. Native errors propagate
without a TS data retry. Keep this namespace separate from the default TS entry.
The existing `index.js` plus `wasm.js` pair shares brands and retains TS data;
`configureWasmBackend(instance)` switches that pair to Rust operations.

WASM is optional. TS remains the default. See [benchmarks](../../benchmarks/temporal/README.md)
for versioned performance, consumer payload and package graph measurements.
Runtime payload and whole npm archive size are different scopes.

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
bazel test -c opt //packages/temporal:wasm_package_test //packages/temporal:wasm_native_package_test
bazel test -c opt //packages/temporal:compact_calendar_datetimeformat_test262
bazel test -c opt //crates/temporal:temporal_test //crates/temporal:ffi_test
```

Full class gates cover 9,090 executions per SDK source/HBC and WASM profile.
Calendar, Now, installation and Intl selections run separately. The
`intl402/Temporal` corpus has 4,080 executions; it does not include the separate
65 DateTimeFormat files with the Temporal feature.

Count-checked formatter gates require all 130 executions and zero failures on
owned TS/Node, WASM, Hermes TS source/HBC and native SDK source/HBC. Their locale
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

Matched Node namespace consumers measure 39,690 bytes gzip for default TS,
23,083 for forced full `temporal-polyfill` and 44,522 for `@js-temporal/polyfill`.
Native-data WASM totals 500,581 bytes, including 467,656 binary bytes.
It owns calendar and IANA data; JS references use host Intl data.
Nine-process ISO/timezone startup medians: TS 19.39 ms, native-data WASM
16.85 ms, full reference 19.32 ms, official reference 26.67 ms.
Current WASM medians win 24/48 workloads against TS, 25/48 against the basic
reference and 36/48 against the official reference. Rounding wins this snapshot
but loses longer controls; remaining slower workloads keep the goal open.
See [current benchmarks](../../benchmarks/temporal/README.md#compact-instant-transport)
for samples, bundle scopes and the official reference's ICU 78.2 Chinese
calendar incompatibility.

Final coverage includes every Temporal-feature file in pinned Test262, including
DateTimeFormat, DurationFormat and staging. Six coherent profiles cover default
TS and native-data WASM on Node, plus TS/native SDK on Hermes source/HBC.
Each Node profile passes 13,474 unique scenarios; each Hermes profile passes
13,472. Only documented IANA/CLDR data-version cases are excluded. The coherent
matrix has 98,716 overlapping suite executions; report unions verify exact
coverage separately. No Realm exclusion applies to this pin; unsupported Hermes
Realm hooks and oracle authority limits remain documented.
For standalone and Rust namespaces, legacy host formatting compares host and
owned offsets. Stale or missing host rules use owned local fields with a localized
numeric offset label. Default TS follows installed Intl timezone data. Matching
host output stays native.
Reversed Date and Temporal formatter ranges remain valid; endpoint source fields
retain their input order.

WASM ABI 15 specializes hot parsing, arithmetic, field updates and formatting.
Keep the JS adapter and binary paired. Observable coercion/error order stays in
the bindings; Rust validates and computes complete results. Finite month/day overflow
fields above the safe-integer range still constrain correctly; `reject`, non-finite
values and missing-field error types remain covered across TS, WASM and Hermes.
See the [CPU profile follow-up](../../benchmarks/temporal/README.md#cpu-profile-follow-up-2026-11-17)
for measured wins, remaining slow workloads, startup and size.

ABI 13 adds direct PlainDateTime parsing, addition/subtraction, rounding and
formatting. Complete ISO DateTime results carry signed nanoseconds, calendar
properties and all six clock fields in one record. Non-ISO calendars and deferred
getter errors keep the general representation. SDK JSON result shapes stay stable.

ABI 14 adds typed clock results, time differences and duration formatting. Native
clock slots keep exact Number nanoseconds and six Rust-computed fields in one
record; other Temporal types receive BigInt lazily. All clock values are below
2**47 nanoseconds, so transport remains exact. Pure TS keeps its existing slots.
Existing SDK JSON responses stay stable; optional clock snapshots preserve older
SDK behavior, including midnight rounding carry.

ABI 15 returns Instant integers in 9 bytes when signed 64-bit values fit, otherwise
17 bytes for the full signed 128-bit value. Checked scalar rounding can return a
BigInt directly. Its reserved sentinel requests the full-width buffer path for
errors, wide results and the sentinel value itself. Engines without scalar i64
interop use buffers throughout. Both routes call the public Rust rounding method.
Native Instant factories wrap validated Rust results directly; numeric user
constructors retain range checks. JS option/coercion order stays unchanged.

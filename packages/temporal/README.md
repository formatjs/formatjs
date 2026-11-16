# @formatjs/temporal

Temporal implementation in TypeScript with a Rust core. Private until the
completion audit passes. Importing the namespace changes no globals; runtime
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
uses captured host Intl data for AH 1300–1600, then the civil fallback. IANA timezone data includes
historical transitions and recurring future rules; future lookup has no 2100
cutoff. Timezone aliases retain their spelling separately from primary identity.
Timezone law changes require a data update.

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

Both entries include compact owned IANA timezone histories with exact finite
transitions and future rules. They expose separate namespaces;
installation entries install the default namespace. Chinese/Dangi arithmetic is
adapted from ICU4X under Unicode-3.0; see LICENSE.md.

Host Intl is an allowed data dependency. An internal timezone prototype now
validates offsets and gap/fold resolution against ICU on Hermes and against
`temporal-polyfill` on Node 24/26. It does not yet replace owned timezone data:
`Intl.DateTimeFormat` exposes offsets, but no transition enumeration API.

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

Remaining gaps stay visible:

- Host/owned timezone-version formatting remains under audit.
- Rust capability/API coverage needs its completion audit. Backend controls still
  report `completeTemporalBackend: false`; ECMAScript coercion, brands and object
  allocation stay in JS.

Implementation gaps are not allowed conformance exclusions.

Full Intl compatibility gates cover 4,076 executions across TS, WASM and Hermes.
Two pinned test files assume older IANA alias and CLDR zero-offset data;
`tests/intl-compat-test262-count.json` records their reasons and sources.
Manual `*_intl_*test262_full` diagnostics retain all 4,080 executions.

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
JS adapters delegate normalized operations through ABI 9. Rust builds, generated
data and release artifacts use Bazel.

## Validation

```sh
bazel test -c opt //packages/temporal:package_test
bazel test -c opt //packages/temporal:wasm_package_test //packages/temporal:wasm_native_package_test
bazel test -c opt //packages/temporal:locale_datetimeformat_test262
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
Full Temporal/Intl compliance remains incomplete.

Current separately compressed module graphs measure 70,443 bytes gzip for default
and 338,952 for standalone. Both include compact IANA histories. Native-data WASM
glue plus binary measures 481,666 bytes gzip. On 43 measured ISO workload medians,
both WASM profiles trail TS. Full host-Intl reference bundle measures 23,226 bytes;
data policies differ. Host Intl is an allowed runtime dependency.
See benchmarks/temporal for versioned methods, scopes and results.

Fresh full namespace and Intl compatibility gates pass 73,368 overlapping suite
executions across TS, WASM and Hermes source/HBC profiles. Unique unions contain
13,324 scenarios per profile and two documented IANA/CLDR data exclusions. Node
class and full Intl gates use different formatter providers. A separate full
host-Intl diagnostic passes 4,078/4,080, failing only the stale timezone-link test.
Current host timezone data can differ from owned rules; reconciling locale output
with owned ZonedDateTime fields remains open.

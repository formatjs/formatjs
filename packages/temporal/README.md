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
Calendar arithmetic supports 16 calendar IDs. IANA timezone data includes
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

Remaining gaps stay visible:

- Legacy Date TimeClip still limits extended plain values. Older host calendar
  data can disagree with Temporal's calendar packs.
- Direct DurationFormat brand capture after late Temporal installation needs
  the separate Temporal-feature conformance audit.
- Rust capability/API coverage needs its completion audit. Backend controls still
  report `completeTemporalBackend: false`; ECMAScript coercion, brands and object
  allocation stay in JS.

Implementation gaps are not allowed conformance exclusions.

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
JS adapters delegate normalized operations through ABI 9. Rust builds, generated
data and release artifacts use Bazel.

## Validation

```sh
bazel test -c opt //packages/temporal:package_test
bazel test -c opt //packages/temporal:wasm_package_test //packages/temporal:wasm_native_package_test
bazel test -c opt //packages/temporal:locale_datetimeformat_test262
bazel test -c opt //crates/temporal:temporal_test //crates/temporal:c_abi_test
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

An experimental Bazel host-calendar profile replaces Chinese/Dangi/Umm al-Qura
tables with host Intl data. Calendar arithmetic stays in TS; IANA data is still
bundled. Its namespace measures about 90 KB gzip versus 361 KB with owned data.
It is not a published entry: extended calendar bounds and complete host-backed
conformance remain open. Host Intl data is allowed for the eventual TS default.

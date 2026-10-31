# @formatjs/intl-datetimeformat

**ECMA-402 Section 11** — `Intl.DateTimeFormat`

## Purpose

Full polyfill for `Intl.DateTimeFormat` with timezone, calendar, and skeleton support. The most complex polyfill in the repo (950+ line BUILD.bazel).

## Dependencies

- `@formatjs/ecma402-abstract`, `@formatjs/intl-localematcher`, `@formatjs/bigdecimal`

## CLDR Data Pipeline

### Sources

| Source               | Data Used                                                    |
| -------------------- | ------------------------------------------------------------ |
| `cldr-dates-full`    | Calendar formats (gregorian.json per locale), timezone names |
| `cldr-numbers-full`  | Number formatting for date components                        |
| `cldr-core`          | Hour cycle preferences and metazone mappings                 |
| `cldr-bcp47`         | Locale validation                                            |
| IANA tzdata (v2026f) | Timezone transitions, links/aliases                          |

### Date/Time Extraction (`scripts/extract-dates.ts`)

Processes 657 locales in parallel:

1. **Format patterns**: Loads gregorian calendar patterns (full/long/medium/short) for dates and times
2. **Skeleton parsing**: Converts CLDR skeletons to structured format options via `parseDateTimeSkeleton()`
3. **Hour cycle resolution**: Determines h12/h23/h11/h24 preferences per locale using region maximization
4. **Timezone names**: Maps IANA zones → metazones → localized names (long/short, standard/daylight)
5. **Interval formats**: Synthesizes combined date+time interval formats from separate patterns
6. **Numbering systems**: Keep the locale default first and expose all CLDR numeric systems. Internal NumberFormat supplies digits; two-digit fields truncate Unicode code points, preserving supplementary digits.
7. **Calendar support**: Gregorian patterns shared with ISO 8601; calendar-specific CLDR names, styles, and intervals support Buddhist, Coptic, Ethiopian, Amete Alem, ROC, Indian, tabular Islamic, Persian, Japanese, and Hebrew calendars

### Timezone Pipeline

IANA tzdb 2026f keeps `America/Havana` (and `Cuba`) on UTC-04 through
November 7, 2027, and corrects Brazil's 1965 and 1966 transitions. The version
and both archive checksums are pinned in `MODULE.bazel`.

This is unique to DateTimeFormat — no other polyfill processes timezone data.

```
Pinned IANA tzdata/tzcode archives from MODULE.bazel
    ↓
Bazel builds zic/zdump from source for macOS and Linux execution platforms
with rules_cc and pinned hermetic LLVM
    ↓
generate_tz_data: pinned Node runs zic, then zdump -c 2100 -v for 427 zones
    ↓
zdump files (raw transition dumps)
    ↓
process-zdump.ts: parse transitions, pack with base-36 encoding
    ↓
@formatjs_generated/tz/all-tz.js (~1.4MB packed)
@formatjs_generated/tz/links.js (timezone aliases)
```

**427 primary IANA zones plus 26 fixed Etc/GMT zones** in the full pack, with
transitions from historical LMT through year 2100. The current golden output
contains 247 zones selected by the shared golden-zone set.

**Packing format:**

- Zone data: `"Zone_Name|timestamp_b36,abbr_idx,offset_idx,dst|..."`
- Abbreviations: `"EST|EDT|GMT|..."` (indexed)
- Offsets: Base-36 encoded seconds from UTC (indexed)

**Two distribution sizes:**

- `add-all-tz.js` — Full 427 zones
- `add-golden-tz.js` — 247 generated zones (smaller bundle)

### Timezone Links (`scripts/link.ts`)

Parses IANA `backward` file to generate alias mappings:

```typescript
// @formatjs_generated/tz/links.js
export default {
  "Africa/Accra": "Africa/Abidjan",
  "US/Eastern": "America/New_York",
  ...
}
```

### Build Pipeline

```
Stage 1: cldr-raw (extract-dates.ts)
  Output: cldr-raw/{locale}.json (657 files)

Stage 2: locale-data (cldr.ts)
  Output: locale-data/{locale}.js + d.ts (1,314 files)

Stage 3: Timezone processing (parallel)
  generate_tz_data → zdump files (427 primary zones)
  process-zdump.ts → @formatjs_generated/tz/all-tz.js
  link.ts → @formatjs_generated/tz/links.js
  add-all-tz.js (polyfill bundle)
  add-golden-tz.js (subset bundle)

Stage 4: supported-locales.generated.ts
```

### Locale Data Structure

```json
{
  "locale": "en",
  "data": {
    "am": "AM", "pm": "PM",
    "weekday": {"long": ["Sunday", ...], "short": ["Sun", ...], "narrow": ["S", ...]},
    "era": {...}, "month": {...},
    "timeZoneName": {
      "America/New_York": {"long": ["Eastern Standard Time", "Eastern Daylight Time"], "short": ["EST", "EDT"]}
    },
    "gmtFormat": "GMT{0}",
    "hourFormat": "+HH:mm;-HH:mm",
    "dateFormat": {"full": "EEEE, MMMM d, y", ...},
    "timeFormat": {"full": "h:mm:ss a zzzz", ...},
    "formats": {"gregory": {skeleton: pattern}},
    "intervalFormats": {skeleton: interval_patterns},
    "hourCycle": "h12",
    "nu": ["latn"],
    "ca": ["gregory"],
    "hc": ["h12", "h23"]
  }
}
```

### Runtime Loading

- `DateTimeFormat.__addLocaleData()` registers locale data (parses skeletons on load)
- `DateTimeFormat.__addTZData()` registers timezone data (unpacks base-36 encoding)
- Timezone offset lookup uses binary search through transition array
- Buffered via `globalThis.__FORMATJS_DATETIMEFORMAT_DATA__`
- Date prototype ponyfills pass options through `ToDateTimeOptions` with the
  ECMA-402 `required` and `defaults` values for each method. In particular,
  `toLocaleString({timeZone})` defaults to both date and time fields.

## Key Design Decisions

- **Hermetic tz compilation**: Bazel fetches checksum-pinned IANA `tzdata`/`tzcode` archives, generates the tzcode headers without a host shell, builds `zic`/`zdump` for macOS and Linux execution platforms with pinned hermetic LLVM, and runs them through pinned Node actions
- **Base-36 packing**: Reduces timezone data size significantly vs raw JSON
- **Golden timezone subset**: Allows apps to ship 251 zones instead of 427 for smaller bundles
- **Hour cycle fallback**: When interval formats don't exist for a locale's hour cycle, synthesizes from alternate cycle
- **Metazone resolution**: Maps IANA zones to CLDR metazones for localized timezone names (EDT vs GMT offset)

## Offset time zones

The `timeZone` option accepts offsets in `±HH`, `±HHMM`, and `±HH:MM` form.
Offsets containing seconds or fractional components throw `RangeError`, including
an explicit zero-second component.

Dates outside the exact ±8,640,000,000,000,000 millisecond TimeClip bounds
throw `RangeError`, including values one millisecond beyond either endpoint.
Year calculations use Gregorian arithmetic so valid endpoints also format
when their local timezone offsets cross the native Date range.

DateTimeFormat methods require an initialized receiver before coercing date
arguments. Inheriting its prototype does not create a DateTimeFormat instance.

Resolved options follow specification property order: `hour12` follows
`hourCycle`, and style properties follow component properties.

Gregorian astronomical year zero formats as year 1 BC. Year 1 begins the AD era.

Zero UTC offsets normalize to `+00:00`. Named timezone matching ignores ASCII
letter case only; non-ASCII lookalikes are rejected.

Constructor options are read once in specification order. Default date fields
are applied to internal records without writing to caller options.

Every locale supports explicit `h11`, `h12`, `h23`, and `h24` hour cycles through
options and Unicode extensions. Locale preferences still select the default.

The `hour12` option selects the locale’s separate 12-hour or 24-hour preference.
For example, English uses `h12` or `h23`; Japanese uses `h11` or `h23`.

DateTimeFormat reuses pattern fields parsed during locale registration, preserving
legacy RegExp statics during constructor format matching.

Hour-cycle preferences affect matching only when an hour is requested.
Minute/second-only formats keep their requested fields.

With all calendar modules and locale patterns loaded, negotiation advertises `gregory`, `iso8601`, `buddhist`, `coptic`,
`ethiopic`, `ethioaa`, `roc`, `indian`, `islamic-civil`, `islamic-tbla`, `islamic-umalqura`, `persian`,
`japanese`, `hebrew`, `chinese`, and `dangi`. Gregorian and ISO share patterns;
other calendars use CLDR calendar packages. Arithmetic conversion uses the public
`temporal-polyfill/fns` APIs.
Umm al-Qura uses `@formatjs_generated/icu.calendar` month lengths generated from
pinned ICU4X, with its documented civil-calendar fallback outside the official
AH 1300–1600 table. Runtime conversion does not call native Intl.
Chinese and Dangi use separate ICU4X month tables covering the full Date range,
including timezone shifts. Each table encodes month lengths and leap-month
positions, with a year-start checkpoint every 64 years. Outside ICU's official
1900–2100 data, conversion follows its proleptic calendar calculation. CLDR
provides cyclic year names, related-year patterns, and leap-month markers.
The CLDR generator writes one locale at a time so expanded calendar patterns do
not accumulate across all locales in memory.
Published locale scripts and the Test262 prelude decode compact JSON strings
instead of compiling large object literals. Locale scripts include the payload
once and preserve both direct registration and pre-install queueing.
Calendar patterns parse on first use, including the ISO alias of Gregorian
formats, so registering unused locale calendars avoids their parsing cost.
Runtime pattern parsing scans LDML tokens and quotes without changing RegExp
statics. Internal parser records and array entries bypass inherited setters.
Calendar-specific locale records share timezone and numbering metadata at runtime.
Non-Gregorian patterns and styles are parsed once on first use. Hebrew month names
use CLDR month codes, including distinct names for Adar I and leap-year Adar II.
Date styles receive matching CLDR interval patterns, including wider month names.

Range formatting compares endpoints at the displayed precision and keeps shared
locale fallback patterns unchanged across formatter instances.

Flexible day periods use CLDR format names and supplemental day-period rules,
resolved through locale parents. `B` widths map to narrow/short/long names;
noon matches exactly, variable periods support midnight wrapping, and missing
rules or names fall back to AM/PM. Midnight itself is not selected because the
API provides no context to distinguish the start from the end of a day.

CLDR alternate-key suffixes are metadata, not skeleton fields. The extractor
uses default entries and excludes `-alt-*` keys before parsing skeletons.

`formatRangeToParts` marks unique fields and separators as `shared`. Repeated
fields belong to their endpoint; punctuation between repeated fields stays with
that endpoint. Shared month names retain the complete date pattern for
grammatical context.

An explicit `hourCycle: "h24"` formats midnight as `24` for both single dates
and ranges. Use `h23` for midnight `00`; `hour12: false` selects `h23`.

## Benchmarks

Run `bazel run //packages/intl-datetimeformat:benchmark` from the repository.
The benchmark uses fixed UTC inputs and native controls for `format`,
`formatRange`, and `formatRangeToParts`, including same-date, cross-date, and
collapsed ranges. Each timed task batches 16 calls; construction and locale-data
registration are excluded.

## Temporal input handling

`TemporalDateTime.ts` captures the available Temporal intrinsic methods when the
module loads. Brand-checking calls recognize foreign-realm values without reading
instance properties. Intrinsic ISO serialization preserves the reference date of
`PlainYearMonth` and `PlainMonthDay`; arithmetic conversion avoids Date's TimeClip.
Load any Temporal polyfill before importing DateTimeFormat.

`InitializeDateTimeFormat` retains the already-read component options and caches
formats by Temporal type. Plain values format in `+00:00` without changing the
formatter's resolved timezone. Instants use its configured timezone.
`HandleDateTimeValue` produces the proposal's value-format record: selected format,
exact epoch nanoseconds, and `isPlain`. Only its numeric branch applies TimeClip.
Partitioning and pattern formatting consume that record without a Temporal bypass
flag. `ToLocalTime` floors to milliseconds after adding the timezone offset.
Range conversion processes both arguments before checking their Temporal types.
Calendar conversion uses the same implementation for Temporal and Date inputs.

Run `//packages/intl-datetimeformat:temporal_test` for dedicated regressions on the
pinned Test262 Node runtime, plus the ordinary package test for Node 24 behavior.
`//packages/intl-datetimeformat:temporal_polyfill_test` checks the npm
`temporal-polyfill/full/global` integration on Node 24. Run each test's
`_typecheck_typecheck_test` target to execute its compiler validation action.
Legacy and grandfathered behavior is outside the conformance improvement target;
those upstream tests remain executed and visible in raw baseline totals.

The date generator synthesizes missing time interval patterns before combining
with the date pattern. This keeps same-day datetime ranges from repeating the
date when CLDR has no interval for the requested time precision. Existing hour
cycle interval patterns retain precedence over the synthesized fallback.

## Optional calendar loading

Core includes Gregorian/ISO only. Optional providers live in
`intl-datetimeformat/calendars/implementations/` and ship as
`@formatjs/intl-datetimeformat-calendar-<calendar>`, with per-locale data.
Shared types and conversion helpers stay in `ecma402-abstract`. Core must not
import optional providers or ICU calendar tables.

`__addCalendarData` registers arithmetic; `__addCalendarLocaleData` registers
localized patterns. Both support loading before the polyfill through queues.
A calendar is available only after both are loaded. Provider callbacks receive
timezone-adjusted milliseconds; registration preserves existing locale formats.

`cldr.ts` prepares base JSON; `cldr-calendar.ts` prepares one calendar's JSON.
Both use `emit-locale-data.ts`, a minimist CLI with a TypeScript AST printer.
`calendar_package.bzl` generates package contents. Each package checks in only
its BUILD version declaration and synced manifest. Base releases bump all
calendar packages through their release dependency.

Tests cover custom providers, loading order, registration, and core bundle
isolation. Package budgets are 250 MB/1700 files/25 MB compressed for base,
and 200 MB/1600 files/15 MB compressed per calendar.

### Adding a calendar

1. Add its CLDR mapping to `calendar_registry.bzl` (`CALENDAR_FILES`).
2. Add `calendars/implementations/<calendar>.ts`, its
   `calendar-data/<calendar>.ts` wrapper, and its `calendars/all.ts` entry.
   Keep shared helpers outside the implementation and wrapper directories.
3. Add a `calendar_package()` BUILD stub, synced manifest, and Release Please
   config/manifest entries. Update the lockfile and run
   `bash scripts/generate_dist_packages.sh` and `bazel run //:gazelle`.
4. Run `//tools:calendar_registry_test` and the `locale_data_test` and
   `calendar_bundle_test` targets under `//packages/intl-datetimeformat/scripts`.

Bazel checks both directories against `CALENDARS`, rejecting missing or extra
modules. CI checks release wiring and automatically tests every registered
package's contents and size. Generators and runtime tests use the same registry
through `@formatjs_generated/datetimeformat.calendars`.

## Rust port (in progress)

`crates/intl_datetimeformat` currently provides numeric TimeClip and Gregorian
civil arithmetic from epoch nanoseconds. Fields retain astronomical years and
nanosecond precision; `era_year` supplies AD/BC display years. Euclidean division
preserves negative fractional instants. Local arithmetic permits timezone offsets
to cross the exact Date bounds after the input instant has passed TimeClip.

Rust units and differential tests cover 8,193 instants against TS DateOperations,
including year zero, leap centuries, full Date bounds and negative nanoseconds.
Host coercion, Hermes integration and SDK packaging remain unfinished.

The Rust timezone registry consumes the same base-36 packs as JS. `:timezone_data`
exposes full/golden JSON generated by `process-zdump --json`; transitions remain
on demand. Aliases compile separately. Loads replace the complete map atomically;
existing records use its current transitions. Local conversion preserves exact
historical seconds and DST flags, with binary search and nanosecond boundaries.
Fixed offsets and ASCII-only matching follow the TS validation contract.

Differential coverage compares 428,850 samples across all 453 full/247 golden
zones, every transition, aliases and Date endpoints. Raw JSON must equal the
shipped JS payload. Generator flags are explicitly boolean so the first zdump
file stays positional. End markers outside Date's range are excluded before
packing; IANA `Zone` lines and comments cannot become bogus link aliases.
Canonicalization also recognizes known alias targets before transitions load.

Rust LDML parsing and Basic/BestFit/Style matching now retain separate skeleton
and raw-pattern fields, property-presence metadata, stable ties and interval
sources. `locale_patterns::CalendarPatterns` prepares formats/styles per calendar
without importing locale data or optional arithmetic. Its interval fallback
selection normalizes raw time skeletons and matches date fields with numeric-month
compatibility. Raw pattern maps retain registration order.

`//:rust_datetime_pattern_test` compares the Rust implementation with TS abstract
operations and actual locale registration: 71,421 CLDR patterns, eight language
families, all 15 calendars, and 15,120 matcher option combinations. Synthetic
cases cover token widths, apostrophes, Unicode whitespace, cyclic-year intervals,
hour preferences, month guards, numeric padding and all style combinations. Its
compiler check is `//:rust_datetime_pattern_test_typecheck_typecheck_test`.

The Rust `calendar` module separates Gregorian/ISO conversion from optional
providers. Providers receive already-adjusted local milliseconds and return
zero-based month indices plus optional leap/related/cyclic-year metadata.
Unloaded calendars reject; registration replaces the selected callback. No
optional arithmetic or ICU tables are linked by the core registry.

Rust `data::LocaleData` owns typed CLDR metadata and calendar names. Gregorian
styles prepare at load; format lists and optional calendar styles prepare lazily.
ISO shares Gregorian formats while names/styles honor explicit calendar overrides. Calendar names inherit omitted optional fields
from the base locale, matching TS record composition. Availability keeps CLDR
preference order and requires both formats and registered arithmetic.
Hermes/SDK remain unfinished.

`registry::Registry` now owns raw/processed locale records and optional calendar
patches. Patches may precede base data/providers; reloads retain them and keep
locale calendar preferences intact. Published alias/fallback records sharing a
replaced record update together, while explicit locale data wins over inferred
aliases. Invalid eager styles leave published state unchanged. Default-content
aliases compile from the same generated CLDR map as `registerLocaleData`; locale
payloads remain on demand.

Locale resolution reuses the Rust Locale matcher/canonicalizer and retains TS's
last-request extension behavior for repeated best-fit base tags. It negotiates
`ca`, `nu`, and nullable `hc`, canonicalizes option aliases, and suppresses `hc`
when `hour12` is supplied. This is the early locale phase, not final hour-cycle
or pattern selection. Registry differential tests cover explicit/alias precedence,
scriptless fallbacks, provider/patch ordering, base/patch replacements, custom
calendars, failed loads and 12,600 option/request combinations.

Core calendar locale patches retain separate names/styles even though ISO format
lists delegate to Gregorian. Base Gregorian styles validate eagerly; override
records validate on access. Focused differential regressions cover these cases,
including invalid override styles and base reloads with retained patches.

`selection::Snapshot` captures current locale/calendar records after component
getters and before late matcher/style getters. Selection prepares defaults,
hour-cycle preferences, day periods and fractional-second augmentation.
`Configuration` caches six Temporal type profiles, including their field/style
restrictions. Differential tests compare 4,368 configurations and all profiles.

`render::RenderData` captures current names and provider handles, allowing callers
to release registry borrows before user callbacks. Rendering keeps exact
nanoseconds, current timezone transitions, standalone grammatical context and
native NumberFormat digits. Plain Temporal arithmetic uses zero offset while
timezone-name lookup retains the configured identifier. Tests compare 53,760
numeric rendering cases plus exact Temporal instants and locale/timezone reloads.
Hermes source/bytecode integration now covers host coercion and actual Temporal brands.

The native `:locale_data` generator emits 657 separate Gregorian/ISO base packs
with a `number` sidecar selected from native NumberFormat packs. Calendar patches
and transitions remain separate, preserving on-demand loading. Numeric helpers
cache formatters by locale/system/integer width and truncate two-digit fields by
Unicode code point. All generated base packs are validated by the native loader.

Native `:calendar_<calendar>_locale_data` targets expose TS-generated optional
JSON patches without duplicating their generator. `:calendar_locale_data`
collects all 14 calendars; the base library/data targets do not depend on it.
Loader coverage validates every locale/calendar patch, lazy formats/styles and
availability before/after arithmetic registration.

CLDR hour-cycle tokens can include flexible day-period suffixes (`hB`, `hb`);
the extractor selects the cycle from their first symbol. Timezone name widths
without a standard name are omitted, allowing GMT fallback instead of emitting
null array entries. Pack/rendering regressions include `agq`, `ms`, `zh-Hant` and
`pt-CV`.

Range partitioning uses `render::RangeSnapshot` captured before endpoint calendar
callbacks. Each endpoint converts through its current provider; rendering data
is captured after both conversions. `LocalTime` preserves the civil/calendar
fields and offsets for reuse without extra callbacks. Comparison stops at the
last displayed field, handles day-period/fractional precision, and chooses CLDR
intervals or an unchanged shared fallback. All subpatterns receive the complete
range context for grammatical names. Differential tests compare 76,800 numeric
ranges and 288 exact Temporal ranges across locale, digit, hour-cycle and timezone
families, including collapsed, reversed and full-Date-bound endpoints.

`instance::Runtime` now binds an owned `DateTimeFormat` to shared locale/provider
state and live timezone transitions. `begin` captures an Arc of the original
timezone map before host coercion; `Construction` exposes early resolution,
explicit/default timezone selection, component snapshot capture and finalization.
Explicit names use the initial map, including custom loaded names; defaults stay
live. Transition replacement remains visible to existing formatters.

The formatter exposes resolved options, single/range strings and parts for
numeric Dates and normalized Temporal records. It enforces calendar compatibility,
rejects ZonedDateTime and checks range types before TimeClip/profile selection.
Resolved options retain table order and suppress component properties for styles.
Runtime registry borrows never span provider callbacks, allowing replacement
providers and locale patches during conversion. Range endpoints acquire their
providers independently; rendering reads names after both callbacks. The Hermes facade supplies coercion, intrinsic brands and Date.now defaults.

`crates/intl_datetimeformat_calendars` supplies all fourteen optional arithmetic
providers without a reverse dependency from the base formatter. Eleven use the
pinned TS calendar formulas; Umm al-Qura, Chinese and Dangi consume selected JSON
tables generated from the same ICU4X pipeline as TS. Provider registration and
calendar-locale patches remain independent and on demand. Tables validate all
indices, year lengths, checkpoints and final bounds before registration.

Arithmetic retains Euclidean division for negative years, Japanese era boundaries,
Hebrew Adar name indices, Islamic before-era years and the TS Persian 33-year
cycle. Lunar records preserve related/cyclic years and leap-month metadata.
Umm al-Qura keeps the civil fallback outside its loaded table. Differential tests
cover all providers across Date bounds, full-range samples, table checkpoints and
modern month boundaries, plus rendering/ranges across eight language families.

Optional locale records merge over Gregorian metadata at registration. The CLDR
extractor now emits standalone month names even when they equal that calendar's
format names, preventing accidental inheritance of Gregorian names. A Russian
Hebrew month-only regression covers Adar II and requires string-valued parts.

The native C ABI now retains separate registry, staged construction and formatter
handles. Begin captures timezone availability before host coercion; resolution,
zone selection, component capture and finalization follow the TS getter phases.
Registry data loads, current defaults and optional arithmetic registration remain
independent. Typed resolved-option serialization preserves property order.

Formatting queries retain the model before invoking foreign calendar callbacks,
so callbacks may replace data/providers or destroy the public handle. Replaced
provider contexts release outside RefCell borrows. Callback and release functions
must not unwind; bridges retain foreign exceptions and rethrow after status 5.
Contexts with a release function transfer even when registration rejects input.
The optional-provider crate exposes calendar loading without introducing a base
crate dependency. Both sets of symbols export through `intl_hermes`.

Intrinsic ISO plain values convert in Rust, retaining nanoseconds and noon for
date-only references. Real Temporal YearMonth records can reference month-edge
dates beyond numeric TimeClip. Civil conversion permits that padding; numeric
Date inputs still reject beyond the exact TimeClip endpoints. Red/green parity
uses actual pinned Temporal records at both range edges. Rust ABI tests and a C++
client validate state order, ownership, callback failures and archive/header ABI.

Range calls retain one transition map across endpoint callbacks. Replacing timezone
data during conversion affects later calls; both endpoints keep the current call's
map. Calendar providers still resolve independently for each endpoint.

The Hermes bridge retains thread-bound Rust handles in an installation-owned
arena. HostObject finalizers enqueue IDs through a separate mutex-protected queue;
they never lock or own the Rust arena. Native entries drain that queue, and the
installation guard destroys remaining records before runtime teardown. Only the
guard and active native calls own the arena; host functions capture weak references.
This prevents a GC thread from releasing the last Rc-backed Rust runtime owner.

Foreign calendar contexts hold weak JSI functions; private JS slot maps retain
registered wrappers, including while a bound format survives. Each native entry
has a separate pending-exception frame, preserving nested callback exception
identity. Functions catch before crossing Rust and rethrow after status 5 returns.
The callback wrapper copies enumerable fields before selecting typed calendar
fields, preserving spread getter effects without invoking a result's toJSON.

A C++ Hermes integration test validates real formatting, nested callback failure
recovery, rejected inputs, released installation errors and worker-thread finalizer
execution. Installed API differential tests run source and bytecode factories with
TS reference formatters, eight locale families and actual Temporal polyfill brands.
The SDK now packages public headers, adapters, selected JSON resources and a typed
smoke example. Independent consumer and platform validation cover its install path.

The default Hermes compiler shares loop bindings unless ES6 block scoping is
explicitly enabled. Calendar callback factories therefore use a separate function
scope per registration. A default-runtime regression registers two calendars in
one call and requires distinct results. The TS reference suite opts into ES6 block
scoping because its lazy calendar getters and Temporal fns require those language
semantics; native factory bytecode still uses the shipping default compiler flags.

The native timezone-link and locale-alias generators use execution-platform
runfiles during cross-builds, matching NumberFormat metadata generation. Resolving
through the target execroot selected Darwin npm packages while executing on Linux
and failed loading Rolldown bindings. Linux-to-Darwin archive validation covers
both formatter crates after switching those generators to runfiles entrypoints.

Native SDK packaging keeps 657 base packs, fourteen arithmetic/table packs,
9,198 calendar locale patches and two timezone packs in separate directories.
Each calendar has a distinct patch prefix so identical locale basenames cannot
collide during tar assembly. Public filegroups and individual exported labels
support selective application packaging. The standalone consumer retains the
installation guard, then tests source and bytecode startup from extracted SDK
files, late locale registration, DST data loading and Hebrew month/year parts.

The full native differential corpus runs its Rust drivers with an explicit opt
transition even when the test harness uses fastbuild. Calendar locale validation
loads every patch and forces its patterns; debug arithmetic/JSON costs exceeded
the inner test deadline in CI. Collator integration likewise uses the shared
optimized Hermes runtime, matching NumberFormat and RelativeTimeFormat suites.
Assertions, corpus sizes and inner deadlines remain unchanged.

### Native compiled provider

The Hermes SDK now embeds build-selected locale records in Rust rather than
shipping locale JSON for application registration. Rust validates the existing
CLDR data and compiles plural rules at build time; calendar locale patches merge
into DateTimeFormat records. Per-registry lazy caches isolate mutable overrides.
The explicit-registration targets retain custom-provider and TS conformance use.
See [native data setup](../native/hermes/README.md#compiled-locale-data).

### Formatting caches and independent ICU snapshots

TS retains parsed single-date patterns and numeric formatters in WeakMaps keyed
by internal profiles. Rust retains numeric formatters per instance and fractional
precision, avoiding repeated locks/key allocations. Neither caches locale names,
calendar callbacks, nor local-time conversions; replacement data stays live.

`//crates/intl_datetimeformat/tests:icu4j_conformance_snapshot_test` independently
compares TS and Rust strings and parts against pinned ICU4J 79.1. Its 12,399 cases
cover 17 locales, 16 calendars, seven digit systems, five zones, DST transitions,
styles, fractional seconds, and ranges. Existing differences are exact snapshots,
not ignored cases. The fixture hash and case count prevent silently dropping
coverage. ICU output is an oracle baseline, not proof of ECMA-402 compliance.

Update explicitly, review every changed difference:

```sh
bazel run -c opt //crates/intl_datetimeformat/tests:icu_audit -- --update-snapshot="$PWD/crates/intl_datetimeformat/tests/snapshots/icu4j.jsonl"
```

Tests cannot update snapshots. Matched benchmarks use seven warmed rounds and
report median microseconds per operation:

```sh
bazel run -c opt //packages/intl-datetimeformat/benchmark:audit -- --iterations=12000
bazel run -c opt //packages/intl-datetimeformat/benchmark:audit -- --polyfill-numbers --iterations=12000
bazel run -c opt //crates/intl_datetimeformat:audit -- --benchmark --iterations=12000
```

Integer rendering avoids Decimal for safe epoch-millisecond/offset addition and
fractional-second truncation. Negative nanoseconds floor before Number conversion;
fractional offsets retain Decimal addition before flooring. Numeric date fields
also benefit from NumberFormat's exact-integer fixed-rounding path. See
[arithmetic guards and measurements](audits/2026-10-31-datetimeformat-integer-rendering.md).

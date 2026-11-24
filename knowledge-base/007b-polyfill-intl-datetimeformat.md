# @formatjs/intl-datetimeformat

**ECMA-402 Section 11** — `Intl.DateTimeFormat`

## Purpose

Private formatter WeakMap methods are captured when modules load, including
pattern, skeleton, calendar-preference and interval caches.

Nonpositive calendar display years follow ECMA-402 §11.5.4 step 15.f.iv in TS/Rust:
`1 - year` applies before numeric or two-digit rendering, for every calendar.

Precision tests cover fractional offsets near both Date limits and catch
nanoseconds rounded through Number before Decimal construction.

The central date-pattern loop uses private indexed traversal and own List writes.
Fractional seconds use captured floor; two-digit fields use private Unicode
truncation without mutable array methods. TS and Rust preserve
unknown pattern fields with matching exact-epoch fallback text.

Shared Pattern String parsing follows ECMA-402 §9.2.15 through captured String
operations and own private-list writes.

FormatDateTimeToParts delegates result construction to shared CreatePartsArray.
The builder traverses private records by index and defines own array properties;
result projection cannot invoke mutable iterators, push or numeric setters.

Private formatToParts result allocation follows ECMA-262 ArrayCreate through a
captured realm constructor, preserving sparse-array semantics and avoiding
Array.from hooks. Date-range SameValue comparisons use pure equality, including
NaN and signed-zero rules.

Constructor instance checks use the captured realm intrinsic rather than mutable
Object.prototype.isPrototypeOf. Calls on legacy receivers store a separate formatter.
Only `format` and `resolvedOptions` use it.

Installed Date locale methods read the receiver’s Date value before locales or
options, then use the defaults in ECMA-402 §20.4.1–3. Invalid dates return early.
Errors from locales and options propagate. The JS and Hermes formatters use the host Intl
time zone when they can resolve it with loaded data, with `UTC` as fallback.

Historical timezone names retain direct CLDR standard/daylight overrides, including
London's British Summer Time before 1970. Only metazone-derived names use the
1970 cutoff. Localized GMT fallback preserves offset seconds in TS and Rust.
The shared 64-row ICU oracle covers London, New York, Paris and Kathmandu across
1900, 1960 and 2000 through ordinary numeric Date inputs.

Full polyfill for `Intl.DateTimeFormat` with timezone, calendar, and skeleton support. The most complex polyfill in the repo (950+ line BUILD.bazel).

## Dependencies

- `@formatjs/ecma402-abstract`, `@formatjs/intl-localematcher`

Numeric timestamps stay primitive through TimeClip. The direct bigdecimal
dependency is removed from BUILD metadata, generated manifest and lockfile;
shared arithmetic dependencies remain transitive. The Temporal host adapter
can use the owned formatter’s private candidate lookup. It enumerates decoded
offsets in the candidate interval and validates exact instants without numeric
TimeClip. For interior gaps it projects decoded transition boundaries into
local time and re-queries the shifted instant candidates. A timezone data
reload advances the cache generation for the Temporal host adapter. The
owned formatter also exposes exact offset and transition queries from those
rows and footer rules.
Standalone DateTimeFormat
composite typechecks and package_json_sync_test are required integration gates.

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
7. **Calendar support**: Gregorian and ISO 8601 have separate patterns. `iso-patterns.ts` reads pinned CLDR XML, resolves locale inheritance, and retains ISO patterns in base locale packs. Calendar-specific CLDR packages supply the optional calendars.

### Timezone Pipeline

IANA tzdb 2026f keeps `America/Havana` (and `Cuba`) on UTC-04 through
November 7, 2027, and corrects Brazil's 1965 and 1966 transitions. The version
and both archive checksums are pinned in `MODULE.bazel`.

This is unique to DateTimeFormat — no other polyfill processes timezone data.

```
Pinned IANA tzdata/tzcode archives from MODULE.bazel
    ↓
Bazel builds zic from source for macOS and Linux execution platforms
with rules_cc and pinned hermetic LLVM
    ↓
generate_tz_data: pinned Python runs zic for 427 zones
    ↓
Pinned CPython zoneinfo decodes TZif transitions and POSIX future rules
    ↓
process-zdump.ts: pack structured records with base-36 encoding
    ↓
@formatjs_generated/tz/all-tz.js
@formatjs_generated/tz/links.js (timezone aliases)
```

**427 primary IANA zones plus 26 fixed Etc/GMT zones** in the full pack, with
historical LMT transitions plus recurring rules for later years. The current golden output
contains 247 zones selected by the shared golden-zone set.

**Packing format:**

- Zone data: `"Zone_Name|timestamp_b36,abbr_idx,offset_idx,dst|..."`
- Abbreviations: `"EST|EDT|GMT|..."` (indexed)
- Offsets: Base-36 encoded seconds from UTC (indexed)
- Future rules: optional per-zone structured offsets and transition rules. Explicit
  transitions apply through the final transition; subsequent dates use footer rules.

`tzdata/generator.py` uses `zoneinfo._common.load_data` and
`zoneinfo._zoneinfo._parse_tz_str` from hermetic Python 3.12.7. These are private
CPython interfaces; revalidate return shapes when upgrading Python. Runtime code
parses no POSIX strings. TS and Rust evaluate month/week/weekday, Julian and
ordinal-day rules, including signed transition times and southern-hemisphere DST.
Packs without future rules retain legacy final-offset behavior. Future legal
changes require a pinned tzdata update.

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
  generate_tz_data → TZif JSON records (427 primary zones)
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

- Locale packs and calendar patches are prepared before publication. Rejected
  updates leave the last valid data available for later loads.
- `DateTimeFormat.__addTZData()` registers timezone data (unpacks base-36 encoding)
- Fixed IANA `Etc/GMT` offsets work without a transition pack.
- Timezone offset lookup uses binary search through transition array
- Buffered via `globalThis.__FORMATJS_DATETIMEFORMAT_DATA__`
- Date prototype ponyfills pass options through `ToDateTimeOptions` with the
  ECMA-402 `required` and `defaults` values for each method. In particular,
  `toLocaleString({timeZone})` defaults to both date and time fields.

## Key Design Decisions

- **Hermetic tz compilation**: Bazel fetches checksum-pinned IANA `tzdata`/`tzcode` archives, generates the tzcode headers without a host shell, builds `zic` for macOS and Linux execution platforms with pinned hermetic LLVM, and decodes its TZif output through pinned Python actions
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

Zero UTC offsets normalize to `+00:00`. Explicit and host-supplied zone names
match using ASCII case folding.

Stage 4 Temporal timezone handling preserves the case-regularized identifier in
`timeZone`, including aliases such as `Asia/Calcutta`, `US/Eastern`, and `Etc/GMT`.
The separate `dataTimeZone` slot selects transition data and localized names
for single dates, Temporal profiles, and ranges. Default timezone overrides also
preserve identifiers. `shouldPolyfill` checks alias and UTC-name preservation.
This follows the [Temporal integration text](https://tc39.es/proposal-temporal/#sec-intl.datetimeformat),
which uses `[[Identifier]]` where the standalone ECMA-402 draft still uses
`[[PrimaryIdentifier]]`.

The system default uses the primary identifier, even when its transitions come
from another zone. Hermes checks host Intl, then the process timezone, then UTC.

The alias generator reads both IANA `backward` and `etcetera`; the latter supplies
`GMT`. Rust retains the same identifier/lookup-target distinction. Primary timezone
enumeration in SupportedValuesOf remains separate from constructor alias support.

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
`japanese`, `hebrew`, `chinese`, and `dangi`. Gregorian and ISO share arithmetic;
ISO patterns come from CLDR XML, and other calendars use CLDR calendar packages. Arithmetic conversion uses owned numeric helpers in
`ecma402-abstract/Calendar/Arithmetic.ts`, shared with Temporal. Formatter runtime
packages do not import `temporal-polyfill` or the Temporal facade.
Umm al-Qura uses `@formatjs_generated/icu.calendar` month lengths generated from
pinned ICU4X, with its documented civil-calendar fallback outside the official
AH 1300–1600 table. Runtime conversion does not call native Intl.
Chinese and Dangi use separate ICU4X month tables covering the full Date range,
including timezone shifts. Each table encodes month lengths and leap-month
positions, with year-start and elapsed-month checkpoints every 64 years. Temporal inverse
lookup and month arithmetic reuse those checkpoints; formatter conversion keeps
its existing calendar contract. Outside ICU's official
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
AM/PM and flexible day periods participate only when their tokens appear in the
selected pattern. Hidden day-period boundaries must not force a fallback that
repeats the date. Larger calendar fields still participate, even when omitted.
Intervals missing displayed date fields use the locale fallback rather than
silently dropping those fields, including malformed combined-style intervals.
Range rendering reads field widths from the selected interval record, as required
by ECMA-402's `PartitionDateTimeRangePattern` and `FormatDateTimePattern`.
CLDR matching adapts textual date widths to the matched format;
interval time widths remain independent. Thus a 12-hour range can use unpadded
hours even when single-date formatting and `resolvedOptions()` use `2-digit`.
Compatible interval lookup requires the same fields and hour-cycle family;
flexible `B` periods stay distinct from implicit AM/PM.
Combined date/time styles wrap time intervals with the selected date pattern and
locale connector, retaining a shared date and its grammatical context.

Flexible day periods use CLDR format names and supplemental day-period rules,
resolved through locale parents. `B` widths map to narrow/short/long names;
noon matches exactly, variable periods support midnight wrapping, and missing
rules or names fall back to AM/PM. Midnight itself is not selected because the
API provides no context to distinguish the start from the end of a day.

CLDR alternate-key suffixes are metadata, not skeleton fields. The extractor
uses default entries and excludes `-alt-*` keys before parsing skeletons.

Interval patterns assign sources to repeated fields and surrounding literals.
When no interval pattern is available, the fallback preserves the sources of
the locale's endpoint placeholders and the text between them. Shared month
names retain the complete date pattern for grammatical context.

An explicit `hourCycle: "h24"` formats midnight as `24` for both single dates
and ranges. Use `h23` for midnight `00`; `hour12: false` selects `h23`.

## Future timezone validation

`bazel test -c opt //packages/intl-datetimeformat:timezone_icu_test` compares
TS and Rust total offsets with ICU4J-generated seasonal and transition-boundary
samples beyond 2100. ICU fixtures use their own compiled timezone rules; they do
not derive expectations from FormatJS data. The oracle and IANA pins can differ,
so investigate newly introduced rule differences before updating expectations.

The private [Temporal package](../packages/temporal/README.md)
adds ICU-derived gap/fold checks and records timezone bundle-size comparisons.
It reuses shared ISO/timezone primitives, not a complete Temporal implementation.
Its internal ISO/Hebrew arithmetic adds reverse field conversion and
date addition without the TS formatter calendars’ existing Temporal dependency.
ICU conversion fixtures use a bounded range; full-range boundary checks use the
forced JS Temporal implementation. See the benchmark README for oracle limits.
Shared `UnpackTimeZoneData` lives in `ecma402-abstract/DateTimeFormat`;
DateTimeFormat preserves its `unpack` export as a compatibility alias.
The subsequent Instant facade has a strict 346-execution Instant Test262 slice and a
separate failing full-corpus diagnostic. Native Temporal is replaced in every
test realm; the slice does not establish full Temporal compliance.

## Benchmarks

Run `bazel run //packages/intl-datetimeformat:benchmark` from the repository.
The benchmark uses fixed UTC inputs and native controls for `format`,
`formatRange`, and `formatRangeToParts`, including same-date, cross-date, and
collapsed ranges. Each timed task batches 16 calls; construction and locale-data
registration are excluded.

## Temporal input handling

`TemporalDateTime.ts` captures available global Temporal intrinsics at module load;
`__addTemporalNamespace` registers later or isolated namespaces. Brand-checking calls
avoid instance properties. Intrinsic ISO serialization preserves YearMonth/MonthDay
reference dates; arithmetic conversion avoids Date's TimeClip. Fixed-field ISO
parsing and numeric offset scanning preserve legacy RegExp statics during
Temporal formatting, including parts and ranges. The FormatJS Temporal
installer registers its namespace automatically.

`InitializeDateTimeFormat` retains the already-read component options and caches
formats by Temporal type. Plain values format in `+00:00` without changing the
formatter's resolved timezone. Instants use its configured timezone.
Numeric formattable values remain primitive Numbers through TimeClip. Public
conversion uses unary plus once; private Decimal objects no longer undergo a
second observable ToPrimitive. TimeClip follows published ECMA-262 §21.4.1.31
with captured finite/absolute/truncation operations and positive-zero
normalization. Omitted format/formatToParts timestamps call captured Date.now.

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
Local-time projection adds fractional offsets in integer nanoseconds before
rounding down to milliseconds.

Differential coverage compares all 453 full/247 golden zones, every explicit
transition, aliases, Date endpoints and year-2500 samples. Raw JSON must equal the
shipped JS payload. Generator flags are explicitly boolean so the first TZif JSON
file stays positional. TZif timestamps outside the supported range are excluded before
packing; IANA `Zone` lines and comments cannot become bogus link aliases.
Alias lookup uses target transitions or the alias's own rows from the loaded
pack. UTC aliases work without a pack.
New formatters skip a default override while its zone is absent from the
current pack.

Rust LDML parsing and Basic/BestFit/Style matching now retain separate skeleton
and raw-pattern fields, property-presence metadata, stable ties and interval
sources. `locale_patterns::CalendarPatterns` prepares formats/styles per calendar
without importing locale data or optional arithmetic. Its interval fallback
selection normalizes raw time skeletons and matches date fields with numeric-month
compatibility. Raw pattern maps retain registration order.

For date fields with a zone name, the locale connector supplies a candidate
without clock fields. Both matchers score it after the supplied patterns.

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
compares TS and Rust strings and parts against pinned ICU4J 79.1. Its 12,808 cases
cover 17 locales, 16 calendars, seven digit systems, five zones, DST transitions,
styles, fractional seconds, and ranges. Existing differences are exact snapshots,
not ignored cases. The fixture hash and case count prevent silently dropping
coverage. ICU output is an oracle baseline, not proof of ECMA-402 compliance.

The matrix includes 145 day-period boundary ranges across six locales, with
12/24-hour clocks, explicit flexible periods, and the Amsterdam case from #7868.
`//conformance-tests/icu4c:intl_datetimeformat_range_conformance_test` checks
those strings independently with ICU4C 79. Both oracles agree on this subset.
Pass the full ICU4J fixture path to that target with `bazel run` to print ICU4C
range strings and parts for a broader audit. ICU4J and ICU4C differ on some combined
date/time/seconds ranges, so the full corpus cannot require their equality.
The November 2026 audit found 247 string disagreements over 5,678 ranges.
The audit retains both raw oracles. ECMA-402 collapse uses the exact single-date
formatter; numeric Japanese years use the resolved NumberFormat instead of ICU's
`jpanyear` override. Corrected expectations retain the original text and parts.
Shared timezone fields use the start endpoint, as PartitionDateTimeRangePattern
requires. Flexible day-period differences are compared before hour differences;
ICU 79 compares AM/PM instead, so it can share a changing flexible period.

Generated interval maps use `date` for one shared fallback for G/y/M/d and
`fallback` for the remaining differences. TS and Rust expand these internal
keys into ordinary range records; explicit CLDR fields take precedence. Records
inherit fallback endpoint order; `latestFirst:` and `earliestFirst:` override it. This
avoids repeating identical synthesized strings in every field.
Combined interval templates store date/time patterns, connectors and time ranges
as date/time lists instead of repeating every combination and endpoint. TS
expands these during registration; Rust expands them lazily per calendar. Both
preserve candidate ordering when restoring pattern records before matching. Package tests check
installed bytes and tarballs, including materialized Bazel runfile symlinks.

Range records retain their own widths and grammatical context. Lookup follows
the fields in the selected CLDR pattern, including implicit eras and numeric
months. Fallback records retain raw CLDR widths independently of single-date
option adjustments. Single-date composition uses CLDR `atTime` connectors;
interval composition uses standard connectors. Time-only ranges add dates when
endpoints span days. Generic timezone names use metazone names, primary/single-zone
territories, exemplar cities, then localized offsets. BCP47 aliases connect CLDR
names to canonical timezone identifiers. CLDR `_preferred` chooses the default
hour cycle independently of `_allowed`.

CLDR preprocessing repairs AM/PM-difference records that omit both changing
labels. ICU 79's Russian `hm/a` entry omits AM/PM; FormatJS retains both labels
as an explicit data policy. These differences remain visible in snapshots.
The current 12,808-case audit has no unclassified differences. TS and Rust match
all single-date cases and agree on every string and part. Of 293 differences
from ICU4J, 215 match ICU4C strings and parts exactly; 32 use the shared start
timezone, 38 retain changing flexible periods, four honor the requested hour cycle, and four
retain changing Russian AM/PM labels. Independent ICU field formatters verify
the endpoint labels and any repaired hour padding; remaining nonliteral fields must match. Unclassified
changes fail the audit, including snapshot-update runs. Raw output from both
oracles remains in the snapshot.

The matrix also covers month/year boundaries. Every case requires TS/Rust equality
and parts that concatenate to the formatted string.
The Test262 baseline gate remains separate from ICU parity. Passing it means no
change to the 488-case baseline, which currently tracks 10 failures; it does not
claim complete ECMA-402 conformance.

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
also benefit from NumberFormat's exact-integer fixed-rounding path.

## Primary timezone identities

`//packages/intl-datetimeformat:tz_primary` generates
`@formatjs_generated/tz/primary.js` from pinned IANA regional files, etcetera,
backward, zone.tab and CLDR BCP47 timezone aliases. Zone records and zone.tab IDs
remain primary; CLDR chooses remaining aliases. UTC/GMT aliases normalize to UTC.
Generation fails for unmapped aliases rather than guessing a raw Link target.

This identity file is separate from transitions and per-locale CLDR data.
Temporal consumes it for equality, calendar differences and Now system IDs;
DateTimeFormat locale payloads do not gain this table. ICU4J's independent IANA
identity oracle verifies all 597 available names in TS and Rust.

Native arithmetic providers now delegate to the shared no_std numeric calendar
kernel in `crates/intl_datetimeformat_calendars/core.rs`. The provider adapter
preserves formatter era keys, Hebrew name indices and field contracts. Provider
and compiled-data features keep formatter/serde/table dependencies optional;
Temporal consumes only `:calendar_core` / Cargo `default-features = false`.
The numeric API adds inverse conversion, month codes, eras and checked add/until
for 13 calendars. Table providers and locale patch data remain separate.
Independent forward ICU controls validate negative/proleptic years; boundary
searches avoid ICU's negative Coptic/Ethiopic length and reverse Indian-setting
bugs. Persian's 33-year approximation remains the existing provider policy.

## Owned Temporal locale bridge

`__addTemporalNamespace(namespace)` snapshots intrinsic getters/serializers into
DateTimeFormat's private reader list. Registration is explicit and idempotent;
namespace installation also registers automatically. Instance properties and
Symbol.toStringTag do not confer a brand. Passing readers through the constructor
keeps independently bundled packages interoperable without a shared global registry.

`__formatTemporal(record, locales, options)` is the internal locale-method seam.
It initializes a formatter with type-specific required/default fields and the
ZonedDateTime timezone override. It formats exact nanoseconds directly; plain
values avoid Date TimeClip. Zoned callers cannot supply a timeZone option.
The formatter checks calendar compatibility and converts zoned records into
Instant formatting records after initialization.

Offset names retain historical seconds, including negative sub-minute offsets.
Pre-1970 metazone names fall back to numeric offsets, matching ICU's name-data
coverage; UTC names remain invariant. CLDR49 no longer has gmtZeroFormat and
renders explicit numeric zero. Pinned Test262's older English assertion is
retained as an unfiltered data-version diagnostic.

`temporal_owned_test` checks independent namespace brands, constructor/instance
poisoning, full plain ranges and 768 ICU4J style/skeleton/offset cases. Its English,
German, French and Japanese locale data is test-only. The Temporal conformance
prelude loads de/en/ja, the languages declared by pinned intl402/Temporal metadata,
instead of every Intl test locale. Published locale data gains no fields.

### Native Temporal locale records

Hermes exposes the private `__formatTemporal` bridge used by `@formatjs/temporal`.
It passes kind, calendar and decimal epoch nanoseconds into Rust's structured epoch
input, preserving extra plain-date bounds and short-date style filtering. Numeric
Date inputs retain TimeClip. A private construction context supplies ZonedDateTime's
timezone and default short zone name without reading extra public options or moving
the locale-data snapshot past late style getters. Public DateTimeFormat continues
to reject ZonedDateTime. SDK regressions compare 768 independent ICU4J cases in
source and optimized Hermes bytecode; full Intl diagnostics remain unfiltered.

### Temporal formatter conformance scope

The Temporal package separately runs every DateTimeFormat test with the Temporal
feature (65 files, 130 executions) using owned TS, WASM and native Hermes SDK
namespaces. This covers formatting, parts, ranges, styles, calendar compatibility
and extra plain dates beyond Date TimeClip. The test-only `-temporal` locale
prelude includes ar/ar-EG for the non-Latin numeral boundary case. Runtime locale
loading remains unchanged. See [Temporal implementation](015-temporal.md).

Temporal's default namespace now uses compact Chinese/Dangi calendar engines.
DateTimeFormat's public builds explicitly select the standalone calendar path,
so their calendar calculations do not call host Intl recursively. The shared
`icu.calendar` generated package adds bounded historical modules for Temporal;
per-locale DateTimeFormat data is unchanged.

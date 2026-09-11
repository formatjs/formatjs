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
| IANA tzdata (v2026c) | Timezone transitions, links/aliases                          |

### Date/Time Extraction (`scripts/extract-dates.ts`)

Processes ~680 locales in parallel:

1. **Format patterns**: Loads gregorian calendar patterns (full/long/medium/short) for dates and times
2. **Skeleton parsing**: Converts CLDR skeletons to structured format options via `parseDateTimeSkeleton()`
3. **Hour cycle resolution**: Determines h12/h23/h11/h24 preferences per locale using region maximization
4. **Timezone names**: Maps IANA zones → metazones → localized names (long/short, standard/daylight)
5. **Interval formats**: Synthesizes combined date+time interval formats from separate patterns
6. **Numbering systems**: Keep the locale default first and expose all CLDR numeric systems. Internal NumberFormat supplies digits; two-digit fields truncate Unicode code points, preserving supplementary digits.
7. **Calendar support**: Gregorian patterns shared with ISO 8601; calendar-specific CLDR names, styles, and intervals support Buddhist, Coptic, Ethiopian, Amete Alem, ROC, Indian, tabular Islamic, Persian, Japanese, and Hebrew calendars

### Timezone Pipeline

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

**427 IANA zones** organized by continent, with transitions from historical LMT through year 2100.

**Packing format:**

- Zone data: `"Zone_Name|timestamp_b36,abbr_idx,offset_idx,dst|..."`
- Abbreviations: `"EST|EDT|GMT|..."` (indexed)
- Offsets: Base-36 encoded seconds from UTC (indexed)

**Two distribution sizes:**

- `add-all-tz.js` — Full 427 zones
- `add-golden-tz.js` — 251 exemplar zones (smaller bundle)

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
  Output: cldr-raw/{locale}.json (~680 files)

Stage 2: locale-data (cldr.ts)
  Output: locale-data/{locale}.js + d.ts (~1360 files)

Stage 3: Timezone processing (parallel)
  generate_tz_data → zdump files (418 zones)
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

Calendar negotiation advertises `gregory`, `iso8601`, `buddhist`, `coptic`,
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

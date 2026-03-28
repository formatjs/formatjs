# @formatjs/intl-datetimeformat

**ECMA-402 Section 12** — `Intl.DateTimeFormat`

## Purpose

Full polyfill for `Intl.DateTimeFormat` with timezone, calendar, and skeleton support. The most complex polyfill in the repo (950+ line BUILD.bazel).

## Dependencies

- `@formatjs/ecma402-abstract`, `@formatjs/intl-localematcher`, `@formatjs/bigdecimal`

## CLDR Data Pipeline

### Sources

| Source               | Data Used                                                       |
| -------------------- | --------------------------------------------------------------- |
| `cldr-dates-full`    | Calendar formats (gregorian.json per locale), timezone names    |
| `cldr-numbers-full`  | Number formatting for date components                           |
| `cldr-core`          | Hour cycle preferences, calendar preferences, metazone mappings |
| `cldr-bcp47`         | Locale validation                                               |
| IANA tzdata (v2026a) | Timezone transitions, links/aliases                             |

### Date/Time Extraction (`scripts/extract-dates.ts`)

Processes ~680 locales in parallel:

1. **Format patterns**: Loads gregorian calendar patterns (full/long/medium/short) for dates and times
2. **Skeleton parsing**: Converts CLDR skeletons to structured format options via `parseDateTimeSkeleton()`
3. **Hour cycle resolution**: Determines h12/h23/h11/h24 preferences per locale using region maximization
4. **Timezone names**: Maps IANA zones → metazones → localized names (long/short, standard/daylight)
5. **Interval formats**: Synthesizes combined date+time interval formats from separate patterns
6. **Calendar preferences**: Per-region calendar system preferences

### Timezone Pipeline

This is unique to DateTimeFormat — no other polyfill processes timezone data.

```
IANA tzdata v2026a (tz_data.tar.gz)
    ↓
Docker build: compile zic, run zdump -c 2100 -v for 418 zones
    ↓
zdump files (raw transition dumps)
    ↓
process-zdump.ts: parse transitions, pack with base-36 encoding
    ↓
src/data/all-tz.generated.ts (~1.4MB packed)
src/data/links.generated.ts (timezone aliases)
```

**418 IANA zones** organized by continent, with transitions from historical LMT through year 2100.

**Packing format:**

- Zone data: `"Zone_Name|timestamp_b36,abbr_idx,offset_idx,dst|..."`
- Abbreviations: `"EST|EDT|GMT|..."` (indexed)
- Offsets: Base-36 encoded seconds from UTC (indexed)

**Two distribution sizes:**

- `add-all-tz.js` — Full 418 zones
- `add-golden-tz.js` — 121 exemplar zones (smaller bundle)

### Timezone Links (`scripts/link.ts`)

Parses IANA `backward` file to generate alias mappings:

```typescript
// src/data/links.generated.ts
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
  tz_data_extract → zdump files (418 zones)
  process-zdump.ts → src/data/all-tz.generated.ts
  link.ts → src/data/links.generated.ts
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

## Key Design Decisions

- **Docker-based tz compilation**: Uses Docker to build zic from IANA source, ensuring reproducible timezone data
- **Base-36 packing**: Reduces timezone data size significantly vs raw JSON
- **Golden timezone subset**: Allows apps to ship 121 zones instead of 418 for smaller bundles
- **Hour cycle fallback**: When interval formats don't exist for a locale's hour cycle, synthesizes from alternate cycle
- **Metazone resolution**: Maps IANA zones to CLDR metazones for localized timezone names (EDT vs GMT offset)

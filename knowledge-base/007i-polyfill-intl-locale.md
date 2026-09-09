# @formatjs/intl-locale

**ECMA-402 Section 14** — `Intl.Locale`

## Purpose

Polyfill for `Intl.Locale` — provides locale information and manipulation, including calendar, hour cycle, numbering system, and week data preferences.

## Dependencies

- `@formatjs/ecma402-abstract`, `@formatjs/intl-getcanonicallocales`, `@formatjs/intl-supportedvaluesof`

## CLDR Data Pipeline

This package has the most diverse CLDR source requirements — 6 separate extraction scripts for different data domains.

### Sources

| CLDR Package            | Data Used                                                                                                       |
| ----------------------- | --------------------------------------------------------------------------------------------------------------- |
| `cldr-core`             | calendarPreferenceData.json, territoryInfo.json, weekData.json, timeData.json, aliases.json, likelySubtags.json |
| `cldr-localenames-full` | Character order data (collation)                                                                                |
| `cldr-numbers-full`     | Default numbering systems per locale                                                                            |
| `cldr-bcp47`            | timezone.json (territory → timezone mapping)                                                                    |

### Extraction Scripts (`scripts/`)

| Script                 | CLDR Source                        | Generated Output                                                                    |
| ---------------------- | ---------------------------------- | ----------------------------------------------------------------------------------- |
| `calendars.ts`         | calendarPreferenceData.json        | `calendars.generated.ts` — Region → preferred calendar list                         |
| `week-data.ts`         | territoryInfo.json + weekData.json | `week-data.generated.ts` — Territory → {firstDay, weekendStart/End, minimalDays}    |
| `hour-cycles.ts`       | timeData.json                      | `hour-cycles.generated.ts` — Territory → hour cycle preference (h11/h12/h23/h24)    |
| `timezones.ts`         | cldr-bcp47 timezone.json           | `timezones.generated.ts` — Territory → timezone list (deduplicated)                 |
| `character-orders.ts`  | cldr-localenames-full (glob)       | `character-orders.generated.ts` — Locale → character order                          |
| `numbering-systems.ts` | cldr-numbers-full (all locales)    | `numbering-systems.generated.ts` — Locale → default + alternative numbering systems |

### Build Pipeline

6 independent `generate_src_file` targets, each producing one `.generated.ts`:

```
calendars.ts          → calendars.generated.ts
week-data.ts          → week-data.generated.ts
hour-cycles.ts        → hour-cycles.generated.ts
timezones.ts          → timezones.generated.ts
character-orders.ts   → character-orders.generated.ts
numbering-systems.ts  → numbering-systems.generated.ts
```

### Runtime Loading

- **No dynamic locale loading** — all preference data compiled into the bundle
- Static lookups via helper functions: `getCalendarPreferenceDataForRegion()`, `getWeekDataForRegion()`, `getHourCyclesPreferenceDataForLocaleOrRegion()`, `getTimeZonePreferenceForRegion()`
- Region is resolved from the locale tag (e.g., `en-US` → `US`)

## Weekday and numeric options

`firstDayOfWeek` accepts Unicode type identifiers such as `mon`. Numeric strings
`0` and `7` both become `sun`; `1` through `6` become `mon` through `sat`.
The empty Unicode numeric keyword in `en-u-kn` sets `numeric` to `true`.

## Week info compatibility

`getWeekInfo()` follows the current ECMA-402 draft: `{firstDay, weekend}` with
ISO weekday numbers (Monday = 1, Sunday = 7) and a fresh weekend array per call.
**Breaking change:** the earlier proposal's `minimalDays` property is removed.
Consumers that calculate local week numbers must obtain that value separately.
Week data honors available `rg` region overrides, `sd` subdivision preferences
when no region is explicit, and recognized `fw` first-day overrides.

### Receiver validation

Locale getters and methods require a genuine initialized Locale instance.
Objects inheriting from `Locale.prototype` and proxies around Locale instances
throw `TypeError`. Failed calls do not give the receiver a Locale brand.

Object locale tags use standard string coercion, including `Symbol.toPrimitive`
with the string hint and the ordinary `valueOf` fallback. Callable objects are
accepted; primitive values other than strings are rejected.

The `variants` constructor option replaces existing variant subtags while
preserving extensions. Empty, malformed, and duplicate variants throw `RangeError`.

Locale tags are canonicalized before constructor overrides are applied, so
alias resolution uses the original language and script context.

`minimize()` tests reductions of the maximized locale, preserving variants and
extensions. For example, `und-Thai` minimizes to `th` and `zh-Hant` to `zh-TW`.

Calendar and hour-cycle preferences honor available `rg` override data, then the
explicit region, `sd` subdivision, likely region, and world fallback. An override
without data falls back to the ordinary preferred region.

Locale option getters expose canonical Unicode values, consistent with the
serialized tag. For example, calendar option `islamicc` resolves to `islamic-civil`.

`maximize()` preserves supplied components and leaves unmatched tags unchanged.
It only searches likely-subtag candidates for the requested language.

`getCollations()` filters global candidates through the requested locale. An
explicit `co` extension returns that value; an unmatched locale returns
`emoji` and `eor`.

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

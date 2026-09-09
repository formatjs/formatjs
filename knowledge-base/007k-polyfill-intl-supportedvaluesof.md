# @formatjs/intl-supportedvaluesof

**ECMA-402 Section 8.3.2** — `Intl.supportedValuesOf`

## Purpose

Polyfill for `Intl.supportedValuesOf()` — returns arrays of supported values for calendar, collation, currency, numberingSystem, timeZone, and unit.

## Dependencies

- `@formatjs/ecma402-abstract`, `@formatjs/fast-memoize`

## CLDR Data Pipeline

### Sources

| CLDR Package                 | Data Used                                                        |
| ---------------------------- | ---------------------------------------------------------------- |
| `cldr-bcp47`                 | calendar.json (calendar types), collation.json (collation types) |
| `cldr-numbers-full`          | currencies.json (currency codes)                                 |
| `@formatjs/ecma402-abstract` | SIMPLE_UNITS constant (spec-defined unit list)                   |
| Pre-computed timezone list   | IANA timezone identifiers                                        |

### Extraction Scripts (`scripts/`)

5 independent scripts, each generating one value list:

| Script          | Output                                                                              |
| --------------- | ----------------------------------------------------------------------------------- |
| `calendars.ts`  | `calendars.generated.ts` — Calendar type strings from cldr-bcp47                    |
| `collations.ts` | `collations.generated.ts` — Collation type strings (filters keys starting with `_`) |
| `currencies.ts` | `currencies.generated.ts` — ISO 4217 currency codes from cldr-numbers-full          |
| `timezones.ts`  | `timezones.generated.ts` — IANA timezone identifiers (passed via `--zone` args)     |
| `units.ts`      | `units.generated.ts` — SIMPLE_UNITS from ecma402-abstract (spec-defined list)       |

Numbering systems data is symlinked from intl-numberformat.

### Build Pipeline

5 independent `generate_src_file` targets:

```
calendars.ts     → calendars.generated.ts
collations.ts    → collations.generated.ts
currencies.ts    → currencies.generated.ts
timezones.ts     → timezones.generated.ts
units.ts         → units.generated.ts
numbering-systems → symlinked from intl-numberformat
```

### Generated Data Format

```typescript
// calendars.generated.ts
export const calendars = ['buddhist', 'chinese', 'coptic', 'dangi', ...] as const

// currencies.generated.ts
export const currencies = ['AED', 'AFN', 'ALL', ...] as const

// units.generated.ts
export const units = ['acre', 'bit', 'byte', 'celsius', ...] as const
```

### Runtime Loading

- **No dynamic locale loading** — all value lists compiled into the bundle
- `supportedValuesOf(key)` looks up the correct generated constant and returns a sorted copy
- Each value type is a `const` array for type safety

## Key coercion

`Intl.supportedValuesOf` converts its key to a string before validating the
category. String wrapper objects are accepted; Symbols throw `TypeError`.

`Intl.supportedValuesOf` is callable but cannot be used as a constructor.

Time-zone candidates include the pinned IANA `etcetera` Zone records and `UTC`,
in addition to continental transition zones. Runtime filtering retains primary
identifiers and omits aliases such as `Etc/UTC`.

Collation enumeration probes CLDR-derived candidate locales for each type,
including locale-specific collations such as German `phonebk` and Spanish `trad`.
Only collations accepted by the installed Collator are returned.

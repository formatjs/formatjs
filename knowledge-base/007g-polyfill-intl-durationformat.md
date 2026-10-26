# @formatjs/intl-durationformat

**ECMA-402 Section 13** — `Intl.DurationFormat`

## Purpose

Polyfill for `Intl.DurationFormat` — formats durations (hours, minutes, seconds) with locale-aware separators.

## Dependencies

- `@formatjs/ecma402-abstract`, `@formatjs/intl-localematcher`

## CLDR Data Pipeline

### Sources

| CLDR Package        | Data Used                                                    |
| ------------------- | ------------------------------------------------------------ |
| `cldr-numbers-full` | numbers.json — `symbols-numberSystem-{system}.timeSeparator` |

### Extraction Script (`scripts/time-separators.ts`)

Extracts time separator characters per locale and numbering system:

- Default separator is `:` (colon)
- Script only includes locales/systems where the separator differs from default
- Resolves default numbering system per locale
- Runtime locale data keeps the locale default numbering system first, and adds
  `latn` when needed for explicit `numberingSystem` overrides.

### Build Pipeline

Unlike most polyfills, DurationFormat uses **static compilation** (no per-locale files):

```
Single stage: generate_src_file "time-separators"
  Input: cldr-numbers-full
  Output: src/time-separators.generated.ts (single file, ~3900 lines)

Also: generate_src_file "numbering-systems"
  Output: src/numbering-systems.generated.ts
```

### Generated Data Structure

```typescript
export const TIME_SEPARATORS = {
  default: ':',
  localeData: {
    "ar": {"nu": ["arab", "latn"], "separator": {"arab": "٫"}},
    ...
  }
} as const
```

### Runtime Loading

- **No dynamic locale loading** — data compiled into the main bundle
- Static import: `import {TIME_SEPARATORS} from './time-separators.generated.js'`
- Lookup at runtime: `TIME_SEPARATORS.localeData[locale]?.separator[nu] ?? TIME_SEPARATORS.default`
- `TIME_SEPARATORS.localeData[locale].nu` is the default/alternate set needed
  by the generator. `core.ts` ensures `latn` is present before calling
  `ResolveLocale`.

## Numbering system validation

A well-formed but unsupported `numberingSystem` option falls back to the locale's
supported numbering system. Only malformed Unicode type identifiers throw `RangeError`.

## Duration record validation

Each duration field is read once in the ECMA-402 order. Fields must convert to
finite integers of a common sign. Invalid numeric fields throw `RangeError`;
an empty record throws `TypeError`. Absolute years, months, and weeks must be
less than `2 ** 32`; absolute normalized seconds must be less than `2 ** 53`.
Subsecond contributions participate in the bound comparison exactly.

Numbering-system resolution includes systems supported by the active
`Intl.NumberFormat` dependency, keeping the locale default first. Support is
checked lazily and refreshed when that constructor is replaced. Time-separator
data includes every numbering-system symbol record supplied by CLDR.

### Temporal integration

When a Temporal implementation is available before this package is loaded,
`format` and `formatToParts` accept ISO duration strings through `Temporal.Duration.from`.
Temporal durations are read with captured intrinsic getters, so later changes to
`Temporal.Duration.prototype` do not affect formatting. Ordinary duration-like
objects keep the ECMA-402 property-read order.

Without Temporal, duration-like objects remain supported; duration strings throw
`RangeError`. This integration follows the Temporal proposal's Intl changes.

## Native port

`crates/intl_durationformat` implements exact duration records and formatting-option
resolution. Number inputs retain their mathematical integers instead of passing
through shortest decimal text. Common-sign and normalized-second bounds include
subsecond contributions exactly; checked arithmetic rejects oversized records.

A phased unit resolver validates each style before its display getter, then
applies cross-unit constraints and clock padding. Fractional subsecond styles stay
internal and serialize as numeric in resolved options. TS differential coverage
compares style/display combinations, propagation, rejection, field order and
integer bounds, including IEEE values beyond the safe-integer range.

Rendering and native installation remain in progress. Duration locale metadata
must retain its static compilation model. NumberFormat/ListFormat dependencies
must preserve selected locale loading; the native port will consume their native
records without routing duration arithmetic through JS formatters or bundling
all number/list locale payloads into DurationFormat metadata.

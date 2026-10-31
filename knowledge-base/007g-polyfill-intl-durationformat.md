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

The native renderer consumes caller-selected NumberFormat/ListFormat packs and
negotiates each dependency independently. It folds subseconds with integer
arithmetic, applies native NumberFormat truncation/sign rules and flattens native
ListFormat parts while preserving unit annotations. Cached profiles retain their
data after pack replacement; uncached profiles use current records. Empty output
still requires ListFormat data. Eight-locale TS comparisons and native lifecycle
tests cover rendering and dependency behavior.

Native locale metadata compiles the existing time-separator/numbering-system
exports through Bazel. Static availability retains TS locale ordering and stays
independent of dependency packs. Lookup/best-fit and nu extension/option negotiation
run before style resolution. Native NumberFormat probes augment CLDR defaults;
empty probes retry after loading and successful capability sets remain cached.
Phased construction retains this resolution snapshot while the host reads options.
Resolved options are compared with TS across all 657 locales; eight-locale
rendering tests also exercise the complete native constructor and separator lookup.

The owned C ABI retains synchronized native dependency contexts across registry,
construction and formatter handles. Construction enforces style/display phases and
canonical unit indices before late fractional-digit validation. Typed doubles and
a defined-field mask preserve Number integers without a decimal round trip.
Owned JSON results keep resolved-property and part-property order. Lifetime tests
cover registry/construction destruction and final-owner release on a worker thread.
The shared `intl_hermes` archive assembles these symbols.

The Hermes facade uses the same factory for source and precompiled installation.
JS handles brands, coercion and ordered getters; typed double arrays cross JSI.
Phased native construction preserves option validation boundaries and resolution
snapshots. Temporal from/getters are captured before application changes. Native
NumberFormat/ListFormat data hooks keep dependencies selected and independent of
public JS formatter constructors. Ten-locale source/bytecode parity and shipping
runtime smoke cover these paths, including non-colon separators.

The SDK packages headers, adapters, factory `41-IntlDurationFormat.js` and a typed
consumer smoke. It reuses existing selected number/list SDK resources and runs
both source and precompiled installers. Installation is documented in the native
SDK README and React Native/Hermes guide. Number/list payloads stay
separate and load on demand; rendering uses no JS formatter callbacks.

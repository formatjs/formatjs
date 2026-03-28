# @formatjs/ecma402-abstract

## Purpose

Collection of ECMA-402 abstract operations shared by all Intl polyfills. This is the most depended-on package in the monorepo (20+ internal dependents).

## ECMA-402 Conformance

Implements abstract operations from across the ECMA-402 specification:

- **Section 9** — Locale operations: `CanonicalizeLocaleList`, `ResolveLocale`, `LookupSupportedLocales`, `BestFitSupportedLocales`
- **Section 11 (NumberFormat)** — `InitializeNumberFormat`, `PartitionNumberPattern`, `ToRawFixed`, `ToRawPrecision`, `FormatNumericToString`
- **Section 12 (DateTimeFormat)** — Date/time abstract operations
- **General** — `GetOption`, `GetNumberOption`, `DefaultNumberOption`, `CoerceOptionsToObject`

## Design Decisions

- **Central shared library** — Avoids duplicating spec logic across 9+ polyfill packages
- **BigDecimal integration** — Uses `@formatjs/bigdecimal` for arbitrary precision (required by NumberFormat spec for correct rounding)
- **Locale matcher delegation** — Defers to `@formatjs/intl-localematcher` for BestFit algorithm
- **Generated data** — `digit-mapping.generated.ts` maps 35+ numbering systems to Unicode codepoints; `regex.generated.ts` provides Unicode 17.0.0 category patterns

## Dependencies

`@formatjs/bigdecimal`, `@formatjs/fast-memoize`, `@formatjs/intl-localematcher`

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

## Numeric Coercion

`ToNumber` applies ECMAScript Number conversion before wrapping the result in
Decimal. DateTimeFormat values, duration fields, RelativeTimeFormat values, and
numeric options reject BigInt, including objects that coerce to BigInt.
`ToIntlMathematicalValue` and formatted plural operands retain exact decimal
values; do not route them through Number conversion.

## Unicode Locale Types

`IsUnicodeLocaleIdentifierType` shares the Unicode `type` grammar check used by
locale options. It validates syntax only; `ResolveLocale` handles support and
fallback. Keep this helper in the shared layer rather than depending on
`Intl.Locale` from other polyfills.

# @formatjs/bigdecimal

BigInt-backed decimal arithmetic library designed as a lightweight replacement for `decimal.js` in ECMA-402 polyfills.

## Representation

Values are represented as `mantissa × 10^exponent` where:

- `mantissa` is a `bigint` (signed, normalized — no trailing zeros)
- `exponent` is a `number` (integer scaling factor)
- Special flags handle NaN, ±Infinity, and -0

## API

Implements the 27 methods used by `@formatjs/ecma402-abstract`:

- **Arithmetic**: `times`, `div`, `plus`, `minus`, `mod`, `abs`, `negated`, `pow`, `floor`, `ceil`, `log`
- **Comparison**: `eq`, `lessThan`, `greaterThan`, `lessThanOrEqualTo`, `greaterThanOrEqualTo`
- **Queries**: `isZero`, `isNaN`, `isFinite`, `isNegative`, `isPositive`, `isInteger`
- **Conversion**: `toNumber`, `toString`
- **Static**: `BigDecimal.pow`, `BigDecimal.set`

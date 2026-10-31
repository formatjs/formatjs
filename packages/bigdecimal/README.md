# @formatjs/bigdecimal

BigInt-backed decimal arithmetic library designed as a lightweight replacement for `decimal.js` in ECMA-402 polyfills.

## Representation

Values are represented as `mantissa × 10^exponent` where:

- `mantissa` is a `bigint` (signed, normalized — no trailing zeros)
- `exponent` is a `number` (integer scaling factor)
- Special flags handle NaN, ±Infinity, and -0

Normalization removes long runs of decimal zeros in eight-digit chunks, then handles the remaining digits. Arithmetic values and division precision stay unchanged.

## API

Implements the 27 methods used by `@formatjs/ecma402-abstract`:

- **Arithmetic**: `times`, `div`, `plus`, `minus`, `mod`, `abs`, `negated`, `pow`, `floor`, `ceil`, `log`
- **Comparison**: `eq`, `lessThan`, `greaterThan`, `lessThanOrEqualTo`, `greaterThanOrEqualTo`
- **Queries**: `isZero`, `isNaN`, `isFinite`, `isNegative`, `isPositive`, `isInteger`
- **Conversion**: `toNumber`, `toString`
- **Static**: `BigDecimal.pow`, `BigDecimal.set`

Internal arithmetic lazily retains powers of ten through `10^64` (at most 65
BigInts). Larger powers remain uncached. Safe integer Number inputs skip string
parsing; fractional/unsafe values retain their decimal-string representation.

`toNumber()` converts unscaled integer coefficients directly from BigInt, with
binary64 rounding. Fractional/scaled values retain decimal-text conversion;
NaN, infinities and signed zero keep their explicit handling.

Division by signed powers of ten shifts the exponent when scale arithmetic is
safe. Other divisors and unsafe exponents retain the 40-digit scaled division
path. Signed zero and nonfinite values keep their existing handling.

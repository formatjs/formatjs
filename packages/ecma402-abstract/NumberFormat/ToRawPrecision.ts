import type {Decimal} from '@formatjs/bigdecimal'
import {mathMax} from '#packages/ecma262-abstract/intrinsics.js'
import {ZERO} from '#packages/ecma402-abstract/constants.js'
import {
  type RawNumberFormatResult,
  type UnsignedRoundingModeType,
} from '#packages/ecma402-abstract/types/number.js'
import {invariant, repeat} from '#packages/ecma402-abstract/utils.js'
import {ApplyUnsignedRoundingMode} from '#packages/ecma402-abstract/NumberFormat/ApplyUnsignedRoundingMode.js'
import {
  decimalMagnitude,
  getPowerOf10,
} from '#packages/ecma402-abstract/NumberFormat/decimal-cache.js'

const apply = Reflect.apply
const {includes, slice} = String.prototype

/**
 * https://tc39.es/ecma402/#sec-torawprecision
 * https://tc39.es/proposal-intl-keep-trailing-zeros/
 * @param x a finite non-negative mathematical value
 * @param minPrecision an integer between 1 and 21
 * @param maxPrecision an integer between 1 and 21
 */
export function ToRawPrecision(
  x: Decimal,
  minPrecision: number,
  maxPrecision: number,
  unsignedRoundingMode: UnsignedRoundingModeType,
  digitCount = 0,
  fractionDigitCount = 0
): RawNumberFormatResult {
  // 1. Let p be maxPrecision.
  const p = maxPrecision
  let m: string
  let e: number
  let xFinal: Decimal

  // 2. If x = 0, then
  if (x.isZero()) {
    // a. Let m be the String value consisting of p occurrences of the character "0".
    m = repeat('0', p)
    // b. Let e be 0.
    e = 0
    // c. Let xFinal be 0.
    xFinal = ZERO
  } else {
    // ECMA-402 §16.5.7 steps 3.a–c find the adjacent values at this precision.
    // The mantissa's digit count gives the exponent exactly. Division by a
    // power of ten shifts BigDecimal's scale without rounding.
    // https://tc39.es/ecma402/#sec-torawprecision
    e = decimalMagnitude(x)
    const step = getPowerOf10(e - p + 1)
    const scaled = x.div(step)
    const n1 = scaled.floor()
    const n2 = scaled.ceil()
    const r1 = n1.times(step)
    const r2 = n2.times(step)
    xFinal = ApplyUnsignedRoundingMode(x, r1, r2, unsignedRoundingMode)
    m = (xFinal.eq(r1) ? n1 : n2).toString()
    // Steps 3.e–f. An upper neighbor of 10^p has one extra digit.
    if (m.length > p) {
      e++
      m = apply(slice, m, [0, p])
    }
  }

  let int

  // 4. If e ≥ p - 1, then
  if (e >= p - 1) {
    // a. Let m be the string-concatenation of m and e - p + 1 occurrences of the character "0".
    m = m + repeat('0', e - p + 1)
    // b. Let int be e + 1.
    int = e + 1
  } else if (e >= 0) {
    // 5. Else if e ≥ 0, then
    // a. Let m be the string-concatenation of the first e + 1 characters of m, ".", and the remaining p - (e + 1) characters of m.
    m = apply(slice, m, [0, e + 1]) + '.' + apply(slice, m, [e + 1])
    // b. Let int be e + 1.
    int = e + 1
  } else {
    // 6. Else,
    // a. Assert: e < 0.
    invariant(e < 0, 'e should be less than 0')
    // b. Let m be the string-concatenation of "0.", -e - 1 occurrences of the character "0", and m.
    m = '0.' + repeat('0', -e - 1) + m
    // c. Let int be 1.
    int = 1
  }

  // https://tc39.es/proposal-intl-keep-trailing-zeros/#sec-torawprecision
  const resolvedMinPrecision = mathMax(
    minPrecision,
    xFinal.isZero() ? fractionDigitCount + 1 : digitCount
  )
  if (apply(includes, m, ['.']) && maxPrecision > resolvedMinPrecision) {
    let cut = maxPrecision - resolvedMinPrecision
    // b. Repeat, while cut > 0 and the last character of m is "0",
    while (cut > 0 && m[m.length - 1] === '0') {
      // i. Remove the last character from m.
      m = apply(slice, m, [0, m.length - 1])
      // ii. Decrease cut by 1.
      cut--
    }
    // c. If the last character of m is ".", then
    if (m[m.length - 1] === '.') {
      // i. Remove the last character from m.
      m = apply(slice, m, [0, m.length - 1])
    }
  }

  // ECMA-402 §16.5.7, step 8: rounding magnitude includes the precision offset.
  // https://tc39.es/ecma402/#sec-torawprecision
  return {
    formattedString: m,
    roundedNumber: xFinal,
    integerDigitsCount: int,
    roundingMagnitude: e - p + 1,
  }
}

import {invariant, ToNumber, ZERO} from '@formatjs/ecma402-abstract'
import type Decimal from 'decimal.js'

/**
 * CLDR Spec: Operands as defined in https://unicode.org/reports/tr35/tr35-numbers.html#Operands
 * ECMA-402 Spec: GetOperands abstract operation (https://tc39.es/ecma402/#sec-getoperands)
 *
 * Maps CLDR operand symbols to JavaScript property names:
 * - n → Number (absolute value)
 * - i → IntegerDigits
 * - v → NumberOfFractionDigits
 * - w → NumberOfFractionDigitsWithoutTrailing
 * - f → FractionDigits
 * - t → FractionDigitsWithoutTrailing
 * - c, e → CompactExponent (extension for compact notation)
 */
export interface OperandsRecord {
  /**
   * CLDR operand: n (absolute value of the source number)
   */
  Number: Decimal
  /**
   * CLDR operand: i (integer digits of n)
   * Implementation: String for very large numbers exceeding Number.MAX_SAFE_INTEGER
   */
  IntegerDigits: number | string
  /**
   * CLDR operand: v (number of visible fraction digits in n, with trailing zeros)
   */
  NumberOfFractionDigits: number
  /**
   * CLDR operand: w (number of visible fraction digits in n, without trailing zeros)
   */
  NumberOfFractionDigitsWithoutTrailing: number
  /**
   * CLDR operand: f (visible fractional digits in n, with trailing zeros)
   */
  FractionDigits: number
  /**
   * CLDR operand: t (visible fractional digits in n, without trailing zeros)
   */
  FractionDigitsWithoutTrailing: number
  /**
   * CLDR operands: c and e (synonyms for compact decimal exponent)
   *
   * Extension: Not in base ECMA-402 spec, but defined in CLDR for compact notation.
   * Example: "1.2M" has exponent 6 (since M = 10^6)
   * Used by 9 locales: ca, es, fr, it, lld, pt, pt-PT, scn, vec
   */
  CompactExponent: number
}

/**
 * ECMA-402 Spec: GetOperands abstract operation
 * https://tc39.es/ecma402/#sec-getoperands
 *
 * Implementation: Extended to support compact exponent (c/e operands)
 *
 * @param s Formatted number string
 * @param exponent Compact decimal exponent (c/e operand), defaults to 0
 */
export function GetOperands(s: string, exponent: number = 0): OperandsRecord {
  invariant(
    typeof s === 'string',
    `GetOperands should have been called with a string`
  )
  const n = ToNumber(s)
  invariant(n.isFinite(), 'n should be finite')
  let dp = s.indexOf('.')
  let iv
  let f: Decimal
  let v: number
  let fv = ''
  if (dp === -1) {
    iv = n
    f = ZERO
    v = 0
  } else {
    iv = s.slice(0, dp)
    fv = s.slice(dp, s.length)
    f = ToNumber(fv)
    v = fv.length
  }
  const i = ToNumber(iv).abs()
  let w: number
  let t: Decimal
  if (!f.isZero()) {
    const ft = fv.replace(/0+$/, '')
    w = ft.length
    t = ToNumber(ft)
  } else {
    w = 0
    t = ZERO
  }
  return {
    Number: n,
    // Keep as string if too large for JavaScript number to preserve precision
    IntegerDigits:
      i.lessThanOrEqualTo(Number.MAX_SAFE_INTEGER) &&
      i.greaterThanOrEqualTo(-Number.MAX_SAFE_INTEGER)
        ? i.toNumber()
        : i.toString(),
    NumberOfFractionDigits: v,
    NumberOfFractionDigitsWithoutTrailing: w,
    FractionDigits: f.toNumber(),
    FractionDigitsWithoutTrailing: t.toNumber(),
    CompactExponent: exponent,
  }
}

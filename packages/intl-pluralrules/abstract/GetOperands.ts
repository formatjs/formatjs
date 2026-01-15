import {invariant, ToNumber, ZERO} from '@formatjs/ecma402-abstract'
import type Decimal from 'decimal.js'

export interface OperandsRecord {
  /**
   * Absolute value of the source number (integer and decimals)
   */
  Number: Decimal
  /**
   * Number of digits of `number`
   * Can be a string for very large numbers that exceed Number.MAX_SAFE_INTEGER
   */
  IntegerDigits: number | string
  /**
   * Number of visible fraction digits in [[Number]], with trailing zeroes.
   */
  NumberOfFractionDigits: number
  /**
   * Number of visible fraction digits in [[Number]], without trailing zeroes.
   */
  NumberOfFractionDigitsWithoutTrailing: number
  /**
   * Number of visible fractional digits in [[Number]], with trailing zeroes.
   */
  FractionDigits: number
  /**
   * Number of visible fractional digits in [[Number]], without trailing zeroes.
   */
  FractionDigitsWithoutTrailing: number
}

/**
 * http://ecma-international.org/ecma-402/7.0/index.html#sec-getoperands
 * @param s
 */
export function GetOperands(s: string): OperandsRecord {
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
  }
}

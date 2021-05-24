import {invariant, ToNumber} from '@formatjs/ecma402-abstract'

export interface OperandsRecord {
  /**
   * Absolute value of the source number (integer and decimals)
   */
  Number: number
  /**
   * Number of digits of `number`
   */
  IntegerDigits: number
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
  invariant(isFinite(n), 'n should be finite')
  let dp = s.indexOf('.')
  let iv: string | number
  let f: number
  let v: number
  let fv = ''
  if (dp === -1) {
    iv = n
    f = 0
    v = 0
  } else {
    iv = s.slice(0, dp)
    fv = s.slice(dp, s.length)
    f = ToNumber(fv)
    v = fv.length
  }
  const i = Math.abs(ToNumber(iv))
  let w: number
  let t: number
  if (f !== 0) {
    const ft = fv.replace(/0+$/, '')
    w = ft.length
    t = ToNumber(ft)
  } else {
    w = 0
    t = 0
  }
  return {
    Number: n,
    IntegerDigits: i,
    NumberOfFractionDigits: v,
    NumberOfFractionDigitsWithoutTrailing: w,
    FractionDigits: f,
    FractionDigitsWithoutTrailing: t,
  }
}

import {Decimal} from '@formatjs/bigdecimal'
const ZERO = new Decimal(0)
import {ToNumber} from './ToNumber.js'

function ToInteger(n: any): Decimal {
  const number = ToNumber(n)
  if (number.isNaN() || number.isZero()) {
    return ZERO
  }
  if (number.isFinite()) {
    return number
  }
  let integer = number.abs().floor()
  if (number.isNegative()) {
    integer = integer.negated()
  }
  return integer
}

/**
 * https://tc39.es/ecma262/#sec-timeclip
 */
export function TimeClip(time: Decimal): Decimal {
  if (!time.isFinite()) {
    return new Decimal(NaN)
  }
  if (time.abs().greaterThan(8.64 * 1e15)) {
    return new Decimal(NaN)
  }
  return ToInteger(time)
}

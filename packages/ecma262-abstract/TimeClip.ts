import {Decimal} from '@formatjs/bigdecimal'
const ZERO = new Decimal(0)
import {ToNumber} from '#packages/ecma262-abstract/ToNumber.js'

function ToInteger(n: any): Decimal {
  const number = ToNumber(n)
  if (number.isNaN() || number.isZero()) {
    return ZERO
  }
  if (!number.isFinite()) {
    return number
  }
  let integer = number.abs().floor()
  if (number.isNegative()) {
    integer = integer.negated()
  }
  return integer.isZero() ? ZERO : integer
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
  // ECMA-262 §21.4.1.31, step 3: truncate finite timestamps toward zero.
  // https://tc39.es/ecma262/#sec-timeclip
  // https://github.com/tc39/ecma262/blob/b7865f0eed2021720f84d561289401bc414874d0/spec.html#L34738-L34740
  return ToInteger(time)
}

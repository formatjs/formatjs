import {
  RangeErrorConstructor,
  numberIsInteger,
} from '#packages/ecma262-abstract/intrinsics.js'
import {ToNumber} from '#packages/ecma262-abstract/ToNumber.js'

// ECMA-402 §13.5.2: reject nonintegral values and normalize signed zero.
// https://tc39.es/ecma402/#sec-tointegerifintegral
export function ToIntegerIfIntegral(arg: unknown): number {
  const number = ToNumber(arg)
  if (!numberIsInteger(number)) {
    throw new RangeErrorConstructor('Duration field is not an integer')
  }
  return number === 0 ? 0 : number
}

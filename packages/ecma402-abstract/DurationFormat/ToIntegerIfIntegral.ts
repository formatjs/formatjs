import {ToNumber} from '#packages/ecma262-abstract/ToNumber.js'
import {invariant} from '#packages/ecma402-abstract/utils.js'

export function ToIntegerIfIntegral(arg: any): number {
  const number = ToNumber(arg)
  // Nonintegral Number values require RangeError, without coercing arg again.
  // https://tc39.es/ecma402/#sec-tointegerifintegral
  invariant(number.isInteger(), 'Duration field is not an integer', RangeError)
  return number.toNumber()
}

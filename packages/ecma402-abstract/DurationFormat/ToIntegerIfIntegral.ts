import {ToNumber} from '#packages/ecma262-abstract/ToNumber.js'
import {invariant} from '#packages/ecma402-abstract/utils.js'

export function ToIntegerIfIntegral(arg: any): number {
  const number = ToNumber(arg)
  // Nonintegral Number values require RangeError, without coercing arg again.
  // ECMA-402 §13.5.2 ToIntegerIfIntegral, steps 1–2.
  // https://tc39.es/ecma402/#sec-tointegerifintegral
  // https://github.com/tc39/ecma402/blob/b1c961988b9a07894b1dc3dc2b5626ea48387d61/spec/durationformat.html#L473-L474
  invariant(number.isInteger(), 'Duration field is not an integer', RangeError)
  // Step 3 returns a mathematical value: input -0 becomes unsigned zero.
  // https://github.com/tc39/ecma402/blob/b1c961988b9a07894b1dc3dc2b5626ea48387d61/spec/durationformat.html#L475
  return number.isZero() ? 0 : number.toNumber()
}

import {ToString} from '#packages/ecma262-abstract/ToString.js'

// Callers supply primitive nonnegative integers; padding observes no public hooks.
// Temporal comparison §13.25 steps1.b/2.b: decimal padding for the bounded fractional field
// https://tc39.es/proposal-temporal/#sec-temporal-formatfractionalseconds
export function zeroPadDecimal(value: number, length: number): string {
  let result = ToString(value)
  while (result.length < length) result = '0' + result
  return result
}

// Temporal comparison §13.25 steps1–3.
// https://tc39.es/proposal-temporal/#sec-temporal-formatfractionalseconds
export function formatFractionalSeconds(
  subSecondNanoseconds: number,
  precision: number | 'auto'
): string {
  // Steps1.a/2.a: auto omits a zero fraction; explicit zero omits it.
  if (precision === 'auto' ? subSecondNanoseconds === 0 : precision === 0)
    return ''
  // Steps1.b/2.b: exactly nine decimal digits for the bounded integer fraction.
  const digits = zeroPadDecimal(subSecondNanoseconds, 9)
  let length = precision === 'auto' ? 9 : precision
  // Step1.c: trim only the trailing DIGIT ZERO code units.
  if (precision === 'auto') while (digits[length - 1] === '0') length--
  // Steps2.c/3: concatenate the full stop and the selected prefix.
  let result = '.'
  for (let index = 0; index < length; index++) result += digits[index]
  return result
}

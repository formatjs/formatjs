import {ToString} from '#packages/ecma262-abstract/ToString.js'

// Callers supply primitive nonnegative integers; padding observes no public hooks.
export function zeroPadDecimal(value: number, length: number): string {
  let result = ToString(value)
  while (result.length < length) result = '0' + result
  return result
}

// https://github.com/tc39/proposal-temporal/blob/b038883fe9c6aa871ccab3238c90daf9eb5e9b17/spec/abstractops.html#L762-L770
export function formatFractionalSeconds(
  subSecondNanoseconds: number,
  precision: number | 'auto'
): string {
  // L762-L763: auto omits a zero fraction. L766-L767: explicit zero omits it.
  if (precision === 'auto' ? subSecondNanoseconds === 0 : precision === 0)
    return ''
  // L764/L768: exactly nine decimal digits for the bounded integer fraction.
  const digits = zeroPadDecimal(subSecondNanoseconds, 9)
  let length = precision === 'auto' ? 9 : precision
  // L765: trim only the trailing DIGIT ZERO code units.
  if (precision === 'auto') while (digits[length - 1] === '0') length--
  // L769-L770: concatenate the full stop and the selected prefix.
  let result = '.'
  for (let index = 0; index < length; index++) result += digits[index]
  return result
}

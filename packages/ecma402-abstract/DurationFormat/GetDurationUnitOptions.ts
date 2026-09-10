import {GetOption} from '#packages/ecma402-abstract/GetOption.js'

export function GetDurationUnitOptions<T extends object>(
  unit: keyof T,
  options: T,
  baseStyle: Exclude<T[keyof T], undefined>,
  stylesList: readonly T[keyof T][],
  digitalBase: Exclude<T[keyof T], undefined>,
  prevStyle: string,
  twoDigitHours = false
): {
  style: Exclude<T[keyof T], undefined>
  display: string | Exclude<T[keyof T], undefined>
} {
  let style = GetOption(options, unit, 'string', stylesList, undefined)
  let displayDefault = 'always'
  // ECMA-402 §13.5.6, steps 3–4: numeric styles propagate through fractional units.
  // https://tc39.es/ecma402/#sec-getdurationunitoptions
  // https://github.com/tc39/ecma402/blob/b1c961988b9a07894b1dc3dc2b5626ea48387d61/spec/durationformat.html#L599-L611
  if (style === undefined) {
    if (baseStyle === 'digital') {
      style = digitalBase
      if (unit !== 'hours' && unit !== 'minutes' && unit !== 'seconds') {
        displayDefault = 'auto'
      }
    } else if (
      prevStyle === 'fractional' ||
      prevStyle === 'numeric' ||
      prevStyle === '2-digit'
    ) {
      style = 'numeric' as Exclude<T[keyof T], undefined>
      if (unit !== 'minutes' && unit !== 'seconds') displayDefault = 'auto'
    } else {
      style = baseStyle
      displayDefault = 'auto'
    }
  }
  if (
    style === 'numeric' &&
    (unit === 'milliseconds' ||
      unit === 'microseconds' ||
      unit === 'nanoseconds')
  ) {
    style = 'fractional' as Exclude<T[keyof T], undefined>
    displayDefault = 'auto'
  }
  const display = GetOption(
    options,
    `${unit as string}Display` as keyof T,
    'string',
    ['always', 'auto'] as Array<T[keyof T]>,
    displayDefault
  )
  // ValidateDurationUnitStyle, steps 1–3, after fractional style normalization.
  // https://tc39.es/ecma402/#sec-validatedurationunitstyle
  // https://github.com/tc39/ecma402/blob/b1c961988b9a07894b1dc3dc2b5626ea48387d61/spec/durationformat.html#L657-L659
  if (display === 'always' && style === 'fractional') {
    throw new RangeError('Fractional units cannot use always display')
  }
  if (prevStyle === 'fractional' && style !== 'fractional') {
    throw new RangeError(
      'Fractional units must be followed by fractional units'
    )
  }
  if (
    (prevStyle === 'numeric' || prevStyle === '2-digit') &&
    style !== 'fractional' &&
    style !== 'numeric' &&
    style !== '2-digit'
  ) {
    throw new RangeError("Can't mix numeric and non-numeric styles")
  }
  if (twoDigitHours && unit === 'hours') {
    style = '2-digit' as Exclude<T[keyof T], undefined>
  }
  if (
    (unit === 'minutes' || unit === 'seconds') &&
    (prevStyle === 'numeric' || prevStyle === '2-digit')
  ) {
    style = '2-digit' as Exclude<T[keyof T], undefined>
  }
  return {style, display}
}

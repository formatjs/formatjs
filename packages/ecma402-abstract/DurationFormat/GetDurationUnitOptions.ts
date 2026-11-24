import {RangeErrorConstructor} from '#packages/ecma262-abstract/intrinsics.js'
import {GetOption} from '#packages/ecma402-abstract/GetOption.js'

export function GetDurationUnitOptions(
  unit: string,
  options: object,
  baseStyle: string,
  stylesList: readonly string[],
  digitalBase: string,
  prevStyle: string,
  twoDigitHours = false
): {
  style: string
  display: 'always' | 'auto'
} {
  const unitOptions = options as Record<string, string | undefined>
  let style = GetOption(unitOptions, unit, 'string', stylesList, undefined)
  let displayDefault: 'always' | 'auto' = 'always'
  // ECMA-402 §13.5.6, steps 3–4: numeric styles propagate through fractional units.
  // https://tc39.es/ecma402/#sec-getdurationunitoptions
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
      style = 'numeric'
      if (unit !== 'minutes' && unit !== 'seconds') displayDefault = 'auto'
    } else {
      style = baseStyle
      displayDefault = 'auto'
    }
  }
  // ECMA-402 §13.5.13 https://tc39.es/ecma402/#sec-isfractionalsecondunitname
  if (
    style === 'numeric' &&
    (unit === 'milliseconds' ||
      unit === 'microseconds' ||
      unit === 'nanoseconds')
  ) {
    style = 'fractional'
    displayDefault = 'auto'
  }
  const display = GetOption(
    unitOptions as Record<string, 'always' | 'auto' | undefined>,
    `${unit}Display`,
    'string',
    ['always', 'auto'],
    displayDefault
  )
  // ValidateDurationUnitStyle, steps 1–3, after fractional style normalization.
  // https://tc39.es/ecma402/#sec-validatedurationunitstyle
  if (display === 'always' && style === 'fractional') {
    throw new RangeErrorConstructor(
      'Fractional units cannot use always display'
    )
  }
  if (prevStyle === 'fractional' && style !== 'fractional') {
    throw new RangeErrorConstructor(
      'Fractional units must be followed by fractional units'
    )
  }
  if (
    (prevStyle === 'numeric' || prevStyle === '2-digit') &&
    style !== 'fractional' &&
    style !== 'numeric' &&
    style !== '2-digit'
  ) {
    throw new RangeErrorConstructor("Can't mix numeric and non-numeric styles")
  }
  // ECMA-402 §13.5.6 steps 8–9 apply clock padding after validation.
  // https://tc39.es/ecma402/#sec-getdurationunitoptions
  if (twoDigitHours && unit === 'hours') {
    style = '2-digit'
  }
  if (
    (unit === 'minutes' || unit === 'seconds') &&
    (prevStyle === 'numeric' || prevStyle === '2-digit')
  ) {
    style = '2-digit'
  }
  // ECMA-402 §13.5.6.1 https://tc39.es/ecma402/#sec-durationformat-unit-options-record
  return {style, display}
}

import {GetOption} from '@formatjs/ecma402-abstract'

export function GetDurationUnitOptions<T extends object>(
  unit: keyof T,
  options: T,
  baseStyle: Exclude<T[keyof T], undefined>,
  stylesList: readonly T[keyof T][],
  digitalBase: Exclude<T[keyof T], undefined>,
  prevStyle: string
): {
  style: Exclude<T[keyof T], undefined>
  display: string | Exclude<T[keyof T], undefined>
} {
  let style = GetOption(options, unit, 'string', stylesList, undefined)
  let displayDefault = 'always'
  if (style === undefined) {
    if (baseStyle === 'digital') {
      if (unit !== 'hours' && unit !== 'minutes' && unit !== 'seconds') {
        displayDefault = 'auto'
      }
      style = digitalBase
    } else {
      displayDefault = 'auto'
      if (prevStyle === 'numeric' || prevStyle === '2-digit') {
        style = 'numeric' as Exclude<T[keyof T], undefined>
      } else {
        style = baseStyle
      }
    }
  }
  let displayField = `${unit as string}Display` as keyof T
  let display = GetOption(
    options,
    displayField,
    'string',
    ['always', 'auto'] as Array<T[keyof T]>,
    displayDefault
  )

  if (prevStyle === 'numeric' || prevStyle === '2-digit') {
    if (style !== 'numeric' && style !== '2-digit') {
      throw new RangeError("Can't mix numeric and non-numeric styles")
    } else if (unit === 'minutes' || unit === 'seconds') {
      style = '2-digit' as Exclude<T[keyof T], undefined>
    }
    if (
      style === 'numeric' &&
      display === 'always' &&
      (unit === 'milliseconds' ||
        unit === 'microseconds' ||
        unit === 'nanoseconds')
    ) {
      throw new RangeError(
        "Can't display milliseconds, microseconds, or nanoseconds in numeric format"
      )
    }
  }
  return {
    style,
    display,
  }
}

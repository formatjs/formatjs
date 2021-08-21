import {ToObject} from '@formatjs/ecma402-abstract'

/**
 * https://tc39.es/ecma402/#sec-todatetimeoptions
 * @param options
 * @param required
 * @param defaults
 */
export function ToDateTimeOptions(
  options?: Intl.DateTimeFormatOptions | null,
  required?: string,
  defaults?: string
): Intl.DateTimeFormatOptions {
  if (options === undefined) {
    options = null
  } else {
    options = ToObject(options)
  }
  options = Object.create(options) as Intl.DateTimeFormatOptions
  let needDefaults = true
  if (required === 'date' || required === 'any') {
    for (const prop of ['weekday', 'year', 'month', 'day'] as Array<
      keyof Pick<
        Intl.DateTimeFormatOptions,
        'weekday' | 'year' | 'month' | 'day'
      >
    >) {
      const value = options[prop]
      if (value !== undefined) {
        needDefaults = false
      }
    }
  }
  if (required === 'time' || required === 'any') {
    for (const prop of [
      'dayPeriod',
      'hour',
      'minute',
      'second',
      'fractionalSecondDigits',
    ] as Array<
      keyof Pick<
        Intl.DateTimeFormatOptions,
        'dayPeriod' | 'hour' | 'minute' | 'second' | 'fractionalSecondDigits'
      >
    >) {
      const value = options[prop]
      if (value !== undefined) {
        needDefaults = false
      }
    }
  }
  if (options.dateStyle !== undefined || options.timeStyle !== undefined) {
    needDefaults = false
  }
  if (required === 'date' && options.timeStyle) {
    throw new TypeError(
      'Intl.DateTimeFormat date was required but timeStyle was included'
    )
  }
  if (required === 'time' && options.dateStyle) {
    throw new TypeError(
      'Intl.DateTimeFormat time was required but dateStyle was included'
    )
  }

  if (needDefaults && (defaults === 'date' || defaults === 'all')) {
    for (const prop of ['year', 'month', 'day'] as Array<
      keyof Pick<Intl.DateTimeFormatOptions, 'year' | 'month' | 'day'>
    >) {
      options[prop] = 'numeric'
    }
  }
  if (needDefaults && (defaults === 'time' || defaults === 'all')) {
    for (const prop of ['hour', 'minute', 'second'] as Array<
      keyof Pick<Intl.DateTimeFormatOptions, 'hour' | 'minute' | 'second'>
    >) {
      options[prop] = 'numeric'
    }
  }
  return options
}

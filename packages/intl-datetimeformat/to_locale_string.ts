// eslint-disable-next-line import/no-cycle
import {DateTimeFormat} from '#packages/intl-datetimeformat/core.js'
import {ToDateTimeOptions} from '#packages/ecma402-abstract/DateTimeFormat/ToDateTimeOptions.js'

/**
 * https://tc39.es/ecma402/#sup-date.prototype.tolocalestring
 */
export function toLocaleString(
  x?: Date | number,
  locales?: string | string[],
  options?: Intl.DateTimeFormatOptions
): string {
  const dtf = new DateTimeFormat(
    locales,
    ToDateTimeOptions(options, 'any', 'all')
  )
  return dtf.format(x)
}

/**
 * https://tc39.es/ecma402/#sup-date.prototype.tolocaledatestring
 */
export function toLocaleDateString(
  x?: Date | number,
  locales?: string | string[],
  options?: Intl.DateTimeFormatOptions
): string {
  const dtf = new DateTimeFormat(
    locales,
    ToDateTimeOptions(options, 'date', 'date')
  )
  return dtf.format(x)
}

/**
 * https://tc39.es/ecma402/#sup-date.prototype.tolocaletimestring
 */
export function toLocaleTimeString(
  x?: Date | number,
  locales?: string | string[],
  options?: Intl.DateTimeFormatOptions
): string {
  const dtf = new DateTimeFormat(
    locales,
    ToDateTimeOptions(options, 'time', 'time')
  )
  return dtf.format(x)
}

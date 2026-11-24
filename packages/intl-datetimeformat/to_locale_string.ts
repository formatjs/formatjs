import {formatDateWithDefaults} from '#packages/intl-datetimeformat/core.js'
import {defineProperty} from '#packages/ecma402-abstract/utils.js'

const numberIsNaN = Number.isNaN

const thisTimeValue = Function.prototype.call.bind(Date.prototype.getTime) as (
  date: unknown
) => number

// ECMA-402 §20.4.1–3 steps 1–4 reject non-Date receivers and return early for
// invalid dates before reading locales or options.
// https://tc39.es/ecma402/#sup-properties-of-the-date-prototype-object
function dateValue(x: Date | number): number {
  return typeof x === 'number' ? x : thisTimeValue(x)
}

// ECMA-402 §20.4.1 defaults to date and time fields.
// https://tc39.es/ecma402/#sup-date.prototype.tolocalestring
export function toLocaleString(
  x: Date | number,
  locales?: string | string[],
  options?: Intl.DateTimeFormatOptions
): string {
  const value = dateValue(x)
  if (numberIsNaN(value)) return 'Invalid Date'
  return formatDateWithDefaults(value, locales, options, {
    required: 'any',
    defaults: 'all',
  })
}

// ECMA-402 §20.4.2 defaults to date fields.
// https://tc39.es/ecma402/#sup-date.prototype.tolocaledatestring
export function toLocaleDateString(
  x: Date | number,
  locales?: string | string[],
  options?: Intl.DateTimeFormatOptions
): string {
  const value = dateValue(x)
  if (numberIsNaN(value)) return 'Invalid Date'
  return formatDateWithDefaults(value, locales, options, {
    required: 'date',
    defaults: 'date',
  })
}

// ECMA-402 §20.4.3 defaults to time fields.
// https://tc39.es/ecma402/#sup-date.prototype.tolocaletimestring
export function toLocaleTimeString(
  x: Date | number,
  locales?: string | string[],
  options?: Intl.DateTimeFormatOptions
): string {
  const value = dateValue(x)
  if (numberIsNaN(value)) return 'Invalid Date'
  return formatDateWithDefaults(value, locales, options, {
    required: 'time',
    defaults: 'time',
  })
}

const dateMethods = {
  toLocaleString(
    this: Date,
    locales: string | string[] | undefined = undefined,
    options?: Intl.DateTimeFormatOptions
  ) {
    return toLocaleString(thisTimeValue(this), locales, options)
  },
  toLocaleDateString(
    this: Date,
    locales: string | string[] | undefined = undefined,
    options?: Intl.DateTimeFormatOptions
  ) {
    return toLocaleDateString(thisTimeValue(this), locales, options)
  },
  toLocaleTimeString(
    this: Date,
    locales: string | string[] | undefined = undefined,
    options?: Intl.DateTimeFormatOptions
  ) {
    return toLocaleTimeString(thisTimeValue(this), locales, options)
  },
}

export function installDateLocaleMethods(): void {
  for (const name of Object.keys(dateMethods) as Array<
    keyof typeof dateMethods
  >) {
    defineProperty(Date.prototype, name, {value: dateMethods[name]})
  }
}

import {Formatters, IntlFormatters, CustomFormats, OnErrorFn} from './types'

import {filterProps, getNamedFormat} from './utils'
import {IntlError, IntlErrorCode} from './error'
import {DateTimeFormat} from '@formatjs/ecma402-abstract'

const DATE_TIME_FORMAT_OPTIONS: Array<keyof Intl.DateTimeFormatOptions> = [
  'formatMatcher',

  'timeZone',
  'hour12',

  'weekday',
  'era',
  'year',
  'month',
  'day',
  'hour',
  'minute',
  'second',
  'timeZoneName',
  'hourCycle',
  'dateStyle',
  'timeStyle',
  'calendar',
  // 'dayPeriod',
  'numberingSystem',
  'fractionalSecondDigits',
]

export function getFormatter(
  {
    locale,
    formats,
    onError,
    timeZone,
  }: {
    locale: string
    timeZone?: string
    formats: CustomFormats
    onError: OnErrorFn
  },
  type: 'date' | 'time',
  getDateTimeFormat: Formatters['getDateTimeFormat'],
  options: Parameters<IntlFormatters['formatDate']>[1] = {}
): DateTimeFormat {
  const {format} = options
  const defaults = {
    ...(timeZone && {timeZone}),
    ...(format && getNamedFormat(formats!, type, format, onError)),
  }

  let filteredOptions = filterProps(
    options,
    DATE_TIME_FORMAT_OPTIONS,
    defaults
  ) as Intl.DateTimeFormatOptions

  if (
    type === 'time' &&
    !filteredOptions.hour &&
    !filteredOptions.minute &&
    !filteredOptions.second &&
    !filteredOptions.timeStyle &&
    !filteredOptions.dateStyle
  ) {
    // Add default formatting options if hour, minute, or second isn't defined.
    filteredOptions = {...filteredOptions, hour: 'numeric', minute: 'numeric'}
  }

  return getDateTimeFormat(locale, filteredOptions)
}

export function formatDate(
  config: {
    locale: string
    timeZone?: string
    formats: CustomFormats
    onError: OnErrorFn
  },
  getDateTimeFormat: Formatters['getDateTimeFormat'],
  ...[value, options = {}]: Parameters<IntlFormatters['formatDate']>
): string {
  const date = typeof value === 'string' ? new Date(value || 0) : value
  try {
    return getFormatter(config, 'date', getDateTimeFormat, options).format(date)
  } catch (e) {
    config.onError(
      new IntlError(IntlErrorCode.FORMAT_ERROR, 'Error formatting date.', e)
    )
  }

  return String(date)
}

export function formatTime(
  config: {
    locale: string
    timeZone?: string
    formats: CustomFormats
    onError: OnErrorFn
  },
  getDateTimeFormat: Formatters['getDateTimeFormat'],
  ...[value, options = {}]: Parameters<IntlFormatters['formatTime']>
): string {
  const date = typeof value === 'string' ? new Date(value || 0) : value

  try {
    return getFormatter(config, 'time', getDateTimeFormat, options).format(date)
  } catch (e) {
    config.onError(
      new IntlError(IntlErrorCode.FORMAT_ERROR, 'Error formatting time.', e)
    )
  }

  return String(date)
}

export function formatDateTimeRange(
  config: {
    locale: string
    timeZone?: string
    onError: OnErrorFn
  },
  getDateTimeFormat: Formatters['getDateTimeFormat'],
  ...[from, to, options = {}]: Parameters<IntlFormatters['formatDateTimeRange']>
): string {
  const {timeZone, locale, onError} = config

  const filteredOptions = filterProps(
    options,
    DATE_TIME_FORMAT_OPTIONS,
    timeZone ? {timeZone} : {}
  ) as Intl.DateTimeFormatOptions

  try {
    return getDateTimeFormat(locale, filteredOptions).formatRange(from, to)
  } catch (e) {
    onError(
      new IntlError(
        IntlErrorCode.FORMAT_ERROR,
        'Error formatting date time range.',
        e
      )
    )
  }

  return String(from)
}

export function formatDateToParts(
  config: {
    locale: string
    timeZone?: string
    formats: CustomFormats
    onError: OnErrorFn
  },
  getDateTimeFormat: Formatters['getDateTimeFormat'],
  ...[value, options = {}]: Parameters<IntlFormatters['formatDate']>
): Intl.DateTimeFormatPart[] {
  const date = typeof value === 'string' ? new Date(value || 0) : value
  try {
    return getFormatter(
      config,
      'date',
      getDateTimeFormat,
      options
    ).formatToParts(date)
  } catch (e) {
    config.onError(
      new IntlError(IntlErrorCode.FORMAT_ERROR, 'Error formatting date.', e)
    )
  }

  return []
}

export function formatTimeToParts(
  config: {
    locale: string
    timeZone?: string
    formats: CustomFormats
    onError: OnErrorFn
  },
  getDateTimeFormat: Formatters['getDateTimeFormat'],
  ...[value, options = {}]: Parameters<IntlFormatters['formatTimeToParts']>
): Intl.DateTimeFormatPart[] {
  const date = typeof value === 'string' ? new Date(value || 0) : value

  try {
    return getFormatter(
      config,
      'time',
      getDateTimeFormat,
      options
    ).formatToParts(date)
  } catch (e) {
    config.onError(
      new IntlError(IntlErrorCode.FORMAT_ERROR, 'Error formatting time.', e)
    )
  }

  return []
}

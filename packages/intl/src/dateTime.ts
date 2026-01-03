import {
  type CustomFormats,
  type Formatters,
  type IntlFormatters,
  type OnErrorFn,
} from './types.js'

import {IntlFormatError} from './error.js'
import {filterProps, getNamedFormat} from './utils.js'

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
  type: 'date' | 'time' | 'dateTimeRange',
  getDateTimeFormat: Formatters['getDateTimeFormat'],
  options: Parameters<IntlFormatters['formatDate']>[1] = {}
): Intl.DateTimeFormat {
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
  value: Parameters<IntlFormatters['formatDate']>[0],
  options: Parameters<IntlFormatters['formatDate']>[1] = {}
): string {
  const date = typeof value === 'string' ? new Date(value || 0) : value
  try {
    return getFormatter(config, 'date', getDateTimeFormat, options).format(date)
  } catch (e) {
    config.onError(
      new IntlFormatError('Error formatting date.', config.locale, e)
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
  value: Parameters<IntlFormatters['formatTime']>[0],
  options: Parameters<IntlFormatters['formatTime']>[1] = {}
): string {
  const date = typeof value === 'string' ? new Date(value || 0) : value

  try {
    return getFormatter(config, 'time', getDateTimeFormat, options).format(date)
  } catch (e) {
    config.onError(
      new IntlFormatError('Error formatting time.', config.locale, e)
    )
  }

  return String(date)
}

export function formatDateTimeRange(
  config: {
    locale: string
    timeZone?: string
    formats: CustomFormats
    onError: OnErrorFn
  },
  getDateTimeFormat: Formatters['getDateTimeFormat'],
  from: Parameters<IntlFormatters['formatDateTimeRange']>[0],
  to: Parameters<IntlFormatters['formatDateTimeRange']>[1],
  options: Parameters<IntlFormatters['formatDateTimeRange']>[2] = {}
): string {
  const fromDate = typeof from === 'string' ? new Date(from || 0) : from
  const toDate = typeof to === 'string' ? new Date(to || 0) : to

  try {
    return getFormatter(
      config,
      'dateTimeRange',
      getDateTimeFormat,
      options
    ).formatRange(fromDate, toDate)
  } catch (e) {
    config.onError(
      new IntlFormatError('Error formatting date time range.', config.locale, e)
    )
  }

  return String(fromDate)
}

export function formatDateToParts(
  config: {
    locale: string
    timeZone?: string
    formats: CustomFormats
    onError: OnErrorFn
  },
  getDateTimeFormat: Formatters['getDateTimeFormat'],
  value: Parameters<IntlFormatters['formatDate']>[0],
  options: Parameters<IntlFormatters['formatDate']>[1] = {}
): Intl.DateTimeFormatPart[] {
  const date = typeof value === 'string' ? new Date(value || 0) : value
  try {
    return getFormatter(
      config,
      'date',
      getDateTimeFormat,
      options
    ).formatToParts(date) as Intl.DateTimeFormatPart[] // TODO: remove this when https://github.com/microsoft/TypeScript/pull/50402 is merged
  } catch (e) {
    config.onError(
      new IntlFormatError('Error formatting date.', config.locale, e)
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
  value: Parameters<IntlFormatters['formatTimeToParts']>[0],
  options: Parameters<IntlFormatters['formatTimeToParts']>[1] = {}
): Intl.DateTimeFormatPart[] {
  const date = typeof value === 'string' ? new Date(value || 0) : value

  try {
    return getFormatter(
      config,
      'time',
      getDateTimeFormat,
      options
    ).formatToParts(date) as Intl.DateTimeFormatPart[] // TODO: remove this when https://github.com/microsoft/TypeScript/pull/50402 is merged
  } catch (e) {
    config.onError(
      new IntlFormatError('Error formatting time.', config.locale, e)
    )
  }

  return []
}

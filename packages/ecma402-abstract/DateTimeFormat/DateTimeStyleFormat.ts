import {
  type DateTimeFormatLocaleInternalData,
  type Formats,
} from '#packages/ecma402-abstract/types/date-time.js'
import {invariant} from '#packages/ecma402-abstract/utils.js'
import {BestFitFormatMatcher} from '#packages/ecma402-abstract/DateTimeFormat/BestFitFormatMatcher.js'
import {DATE_TIME_PROPS} from '#packages/ecma402-abstract/DateTimeFormat/utils.js'

function getTimeStyleFormat(
  timeStyle: Intl.DateTimeFormatOptions['timeStyle'],
  dataLocaleData: DateTimeFormatLocaleInternalData,
  formats: Formats[],
  hour12: boolean | undefined
): Formats | undefined {
  if (timeStyle === undefined) {
    return undefined
  }
  invariant(
    timeStyle === 'full' ||
      timeStyle === 'long' ||
      timeStyle === 'medium' ||
      timeStyle === 'short',
    'invalid timeStyle'
  )
  const timeFormat = dataLocaleData.timeFormat[timeStyle]
  const formatHour12 = timeFormat.hour12 === true
  if (hour12 === undefined || hour12 === formatHour12) {
    return timeFormat
  }

  // Spec: ECMA-402 11.5.1 DateTimeStyleFormat selects the locale style record.
  // FormatJS impl detail: our data has separate 12/24-hour format records, so
  // use the implementation-defined matcher from 11.5.3 when 11.1.2 resolves
  // hour12 to the opposite hc from the default timeStyle pattern.
  const matcherOptions = {
    hour12,
  } as Intl.DateTimeFormatOptions
  for (const prop of DATE_TIME_PROPS) {
    const value = timeFormat[prop]
    if (value !== undefined) {
      matcherOptions[prop] = value as never
    }
  }
  return BestFitFormatMatcher(matcherOptions, formats)
}

export function DateTimeStyleFormat(
  dateStyle: Intl.DateTimeFormatOptions['dateStyle'],
  timeStyle: Intl.DateTimeFormatOptions['timeStyle'],
  dataLocaleData: DateTimeFormatLocaleInternalData,
  formats: Formats[],
  hour12?: boolean
): Formats {
  let dateFormat: Formats | undefined, timeFormat: Formats | undefined
  timeFormat = getTimeStyleFormat(timeStyle, dataLocaleData, formats, hour12)
  if (dateStyle !== undefined) {
    invariant(
      dateStyle === 'full' ||
        dateStyle === 'long' ||
        dateStyle === 'medium' ||
        dateStyle === 'short',
      'invalid dateStyle'
    )
    dateFormat = dataLocaleData.dateFormat[dateStyle]
  }

  if (dateStyle !== undefined && timeStyle !== undefined) {
    const format = {} as Formats
    for (const field in dateFormat) {
      if (
        field !== 'pattern' &&
        field !== 'rangePatterns' &&
        field !== 'rangePatterns12'
      ) {
        // @ts-ignore
        format[field] = dateFormat[field]
      }
    }
    for (const field in timeFormat) {
      if (
        field !== 'pattern' &&
        field !== 'pattern12' &&
        field !== 'rangePatterns' &&
        field !== 'rangePatterns12'
      ) {
        // @ts-ignore
        format[field] = timeFormat[field]
      }
    }
    const connector = dataLocaleData.dateTimeFormat[dateStyle]
    const pattern = connector
      .replace('{0}', timeFormat!.pattern)
      .replace('{1}', dateFormat!.pattern)
    format.pattern = pattern
    if ('pattern12' in timeFormat!) {
      const pattern12 = connector
        .replace('{0}', timeFormat!.pattern12)
        .replace('{1}', dateFormat!.pattern)
      format.pattern12 = pattern12
    }

    // Merge rangePatterns from timeFormat (for time-related differences)
    // This is needed for formatRange to work with dateStyle/timeStyle
    // See: https://github.com/formatjs/formatjs/issues/4168
    if (timeFormat!.rangePatterns) {
      format.rangePatterns = timeFormat!.rangePatterns
    }
    if (timeFormat!.rangePatterns12) {
      format.rangePatterns12 = timeFormat!.rangePatterns12
    }

    return format
  }
  if (timeStyle !== undefined) {
    return timeFormat!
  }
  invariant(dateStyle !== undefined, 'dateStyle should not be undefined')
  return dateFormat!
}

import {
  type DateTimeFormatLocaleInternalData,
  type Formats,
  type RangePatterns,
  type TABLE_2,
  RangePatternType,
} from '#packages/ecma402-abstract/types/date-time.js'
import {invariant} from '#packages/ecma402-abstract/utils.js'
import {BestFitFormatMatcher} from '#packages/ecma402-abstract/DateTimeFormat/BestFitFormatMatcher.js'
import {DATE_TIME_PROPS} from '#packages/ecma402-abstract/DateTimeFormat/utils.js'
import {splitRangePattern} from '#packages/ecma402-abstract/DateTimeFormat/skeleton.js'

function combineStyleRanges(
  date: Formats,
  ranges: Formats['rangePatterns'],
  connector: string,
  timePattern: string,
  fallbackConnector: string
): Formats['rangePatterns'] {
  const result = Object.create(null) as Formats['rangePatterns']
  const fields = Object.create(null) as Partial<RangePatterns>
  fields.monthStandalone = date.monthStandalone
  fields.weekdayStandalone = date.weekdayStandalone
  for (const field of DATE_TIME_PROPS) {
    if (date[field] !== undefined) fields[field] = date[field] as never
  }
  for (const field of Object.keys(ranges) as Array<TABLE_2 | 'default'>) {
    if (['era', 'year', 'month', 'day'].includes(field)) continue
    const range = ranges[field]
    let combined: string
    const reversed =
      range.patternParts.find(part => part.source !== RangePatternType.shared)
        ?.source === RangePatternType.endRange
    if (field === 'default') {
      const endpoint = fallbackConnector
        .replace('{0}', timePattern)
        .replace('{1}', date.pattern)
      combined = range.patternParts
        .map(part =>
          part.pattern === '{0}' || part.pattern === '{1}'
            ? endpoint
            : part.pattern
        )
        .join('')
    } else {
      combined = connector
        .replace('{0}', range.patternParts.map(part => part.pattern).join(''))
        .replace('{1}', date.pattern)
    }
    const patternParts = splitRangePattern(combined)
    if (reversed)
      for (const part of patternParts) {
        if (part.source === 'startRange')
          part.source = RangePatternType.endRange
        else if (part.source === 'endRange')
          part.source = RangePatternType.startRange
      }
    result[field] = {...fields, ...range, patternParts}
  }
  return result
}

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
    const connector = (dataLocaleData.dateTimeFormatAtTime ||
      dataLocaleData.dateTimeFormat)[dateStyle]
    const rangeConnector = dataLocaleData.dateTimeFormat[dateStyle]
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

    const rangeDateFormat =
      dateStyle === 'medium' &&
      (dateFormat!.month === 'numeric' || dateFormat!.month === '2-digit')
        ? {
            ...dateFormat!,
            pattern:
              formats.find(format => format.skeleton === 'yMd')?.pattern ||
              dateFormat!.pattern,
          }
        : dateFormat!
    // Merge rangePatterns from timeFormat (for time-related differences)
    // This is needed for formatRange to work with dateStyle/timeStyle
    // See: https://github.com/formatjs/formatjs/issues/4168
    if (timeFormat!.rangePatterns) {
      format.rangePatterns = combineStyleRanges(
        rangeDateFormat,
        timeFormat!.rangePatterns,
        rangeConnector,
        timeFormat!.pattern,
        connector
      )
    }
    if (timeFormat!.rangePatterns12) {
      format.rangePatterns12 = combineStyleRanges(
        rangeDateFormat,
        timeFormat!.rangePatterns12,
        rangeConnector,
        timeFormat!.pattern12,
        connector
      )
    }

    return format
  }
  if (timeStyle !== undefined) {
    return timeFormat!
  }
  invariant(dateStyle !== undefined, 'dateStyle should not be undefined')
  return dateFormat!
}

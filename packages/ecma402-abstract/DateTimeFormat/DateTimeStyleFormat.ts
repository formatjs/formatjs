import {arrayIncludes} from '#packages/ecma262-abstract/intrinsics.js'
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
import {
  setDateTimePatternFields,
  splitRangePattern,
} from '#packages/ecma402-abstract/DateTimeFormat/skeleton.js'

const styleRangeKeys = Object.keys
const styleIndexOf = Function.prototype.call.bind(String.prototype.indexOf) as (
  value: string,
  search: string
) => number
const styleSlice = Function.prototype.call.bind(String.prototype.slice) as (
  value: string,
  start: number,
  end?: number
) => string

function replaceStyleToken(
  pattern: string,
  token: string,
  value: string
): string {
  // ECMA-402 §11.5.1 steps 4.e and 4.g.i: insert the pattern literally.
  const index = styleIndexOf(pattern, token)
  return index < 0
    ? pattern
    : styleSlice(pattern, 0, index) +
        value +
        styleSlice(pattern, index + token.length)
}

// LDML combines missing date/time skeleton fields with a locale connector.
// A zone name can fill the time side without introducing a clock pattern.
// https://unicode.org/reports/tr35/tr35-dates.html#Missing_Skeleton_Fields
// https://github.com/formatjs/formatjs/issues/8039
export function DateWithTimeZoneFormat(
  date: Formats,
  timeZoneName: NonNullable<Formats['timeZoneName']>,
  data: DateTimeFormatLocaleInternalData
): Formats {
  const style =
    date.month === 'long'
      ? date.weekday
        ? 'full'
        : 'long'
      : date.month === 'short'
        ? 'medium'
        : 'short'
  const connector = (data.dateTimeFormatAtTime || data.dateTimeFormat)[style]
  const withZone = replaceStyleToken(connector, '{0}', '{timeZoneName}')
  const pattern = replaceStyleToken(withZone, '{1}', date.pattern)
  const format = {
    __proto__: null,
    ...date,
    timeZoneName,
    pattern,
    pattern12: pattern,
    // Date-only interval records lack the zone. Use the full endpoint fallback.
    rangePatterns: {__proto__: null} as unknown as Formats['rangePatterns'],
    rangePatterns12: {__proto__: null} as unknown as Formats['rangePatterns12'],
  } as Formats
  setDateTimePatternFields(format, format)
  return format
}

function combineStyleRanges(
  date: Formats,
  ranges: Formats['rangePatterns'],
  connector: string,
  timePattern: string,
  fallbackConnector: string
): Formats['rangePatterns'] {
  // ECMA-402 §11.5.1 steps 4.h–j: supply private combined-style interval records.
  const result = {__proto__: null} as unknown as Formats['rangePatterns']
  const fields = {__proto__: null} as unknown as Partial<RangePatterns>
  fields.monthStandalone = date.monthStandalone
  fields.weekdayStandalone = date.weekdayStandalone
  for (let index = 0; index < DATE_TIME_PROPS.length; index++) {
    const field = DATE_TIME_PROPS[index]
    if (date[field] !== undefined) fields[field] = date[field] as never
  }
  const keys = styleRangeKeys(ranges) as Array<TABLE_2 | 'default'>
  for (let index = 0; index < keys.length; index++) {
    const field = keys[index]
    if (arrayIncludes(['era', 'year', 'month', 'day'], field)) continue
    const range = ranges[field]
    let reversed = false
    for (
      let partIndex = 0;
      partIndex < range.patternParts.length;
      partIndex++
    ) {
      const source = range.patternParts[partIndex].source
      if (source !== RangePatternType.shared) {
        reversed = source === RangePatternType.endRange
        break
      }
    }
    let endpoint: string | undefined
    if (field === 'default') {
      endpoint = replaceStyleToken(
        replaceStyleToken(fallbackConnector, '{0}', timePattern),
        '{1}',
        date.pattern
      )
    }
    let combinedParts = ''
    for (
      let partIndex = 0;
      partIndex < range.patternParts.length;
      partIndex++
    ) {
      const pattern = range.patternParts[partIndex].pattern
      combinedParts +=
        endpoint !== undefined && (pattern === '{0}' || pattern === '{1}')
          ? endpoint
          : pattern
    }
    const combined =
      field === 'default'
        ? combinedParts
        : replaceStyleToken(
            replaceStyleToken(connector, '{0}', combinedParts),
            '{1}',
            date.pattern
          )
    const patternParts = splitRangePattern(combined)
    if (reversed)
      for (let partIndex = 0; partIndex < patternParts.length; partIndex++) {
        const part = patternParts[partIndex]
        if (part.source === 'startRange')
          part.source = RangePatternType.endRange
        else if (part.source === 'endRange')
          part.source = RangePatternType.startRange
      }
    result[field] = {
      __proto__: null,
      ...fields,
      ...range,
      patternParts,
    } as RangePatterns
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

  // ECMA-402 §11.5.1 step 2.b selects the locale style record.
  // Adapt its hour cycle through implementation-defined §11.5.3 matching.
  const matcherOptions = {
    __proto__: null,
    hour12,
  } as Intl.DateTimeFormatOptions
  for (let index = 0; index < DATE_TIME_PROPS.length; index++) {
    const prop = DATE_TIME_PROPS[index]
    const value = timeFormat[prop]
    if (value !== undefined) {
      matcherOptions[prop] = value as never
    }
  }
  return BestFitFormatMatcher(matcherOptions, formats)
}

// ECMA-402 §11.5.1 combines the selected date and time styles.
// https://tc39.es/ecma402/#sec-date-time-style-format
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
    // ECMA-402 §11.5.1 steps 4.a–c combine the fields into a private record.
    const format = {__proto__: null} as unknown as Formats
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
    const connector = (
      dataLocaleData.dateTimeFormatAtTime || dataLocaleData.dateTimeFormat
    )[dateStyle]
    const rangeConnector = dataLocaleData.dateTimeFormat[dateStyle]
    const pattern = replaceStyleToken(
      replaceStyleToken(connector, '{0}', timeFormat!.pattern),
      '{1}',
      dateFormat!.pattern
    )
    format.pattern = pattern
    if ('pattern12' in timeFormat!) {
      const pattern12 = replaceStyleToken(
        replaceStyleToken(connector, '{0}', timeFormat!.pattern12),
        '{1}',
        dateFormat!.pattern
      )
      format.pattern12 = pattern12
    }

    // Compute style ranges on demand from the selected date and time styles.
    // ECMA-402 §11.2.3.8.
    // https://tc39.es/ecma402/#sec-datetimeformat-date-range-record
    // ECMA-402 §11.2.3.9.
    // https://tc39.es/ecma402/#sec-datetimeformat-time-range-record
    let rangeDateFormat = dateFormat!
    if (
      dateStyle === 'medium' &&
      (dateFormat!.month === 'numeric' || dateFormat!.month === '2-digit')
    ) {
      // ECMA-402 §11.5.1 steps 4.h–j: prepare the numeric-date interval input.
      let pattern = dateFormat!.pattern
      for (let index = 0; index < formats.length; index++) {
        const candidate = formats[index]
        if (candidate.skeleton === 'yMd') {
          pattern = candidate.pattern || pattern
          break
        }
      }
      rangeDateFormat = {__proto__: null, ...dateFormat!, pattern} as Formats
    }
    // Merge rangePatterns from timeFormat (for time-related differences)
    // This is needed for formatRange to work with dateStyle/timeStyle
    // See: https://github.com/formatjs/formatjs/issues/4168
    // ECMA-402 §11.2.3.10 projects rangePatterns and rangePatterns12 onto the combined format.
    // https://tc39.es/ecma402/#sec-datetimeformat-style-range-record
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

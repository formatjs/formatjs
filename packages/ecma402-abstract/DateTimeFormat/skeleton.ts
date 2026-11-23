import {HasOwnProperty} from '#packages/ecma262-abstract/HasOwnProperty.js'
import {
  RangeErrorConstructor,
  arraySome,
  mathMin,
  mathMax,
  setDataProperty,
} from '#packages/ecma262-abstract/intrinsics.js'
import {
  type Formats,
  type RangePatternPart,
  type RangePatterns,
  RangePatternType,
  type TABLE_2,
  type IntervalFormatsData,
  type IntervalFormatTemplates,
} from '#packages/ecma402-abstract/types/date-time.js'

// Temporal comparison §15.6.5 steps5–9: selected interval metadata stays private.
const skeletonCreate = Object.create
const skeletonDefineProperties = Object.defineProperties
const skeletonDefineProperty = Object.defineProperty
const skeletonKeys = Object.keys
const skeletonApply = Reflect.apply
const SkeletonMap = Map
const skeletonMapGet = Map.prototype.get
const skeletonMapSet = Map.prototype.set
const skeletonSlice = Function.prototype.call.bind(String.prototype.slice) as (
  value: string,
  start: number,
  end?: number
) => string
const skeletonIndexOf = Function.prototype.call.bind(
  String.prototype.indexOf
) as (value: string, search: string, start?: number) => number
const skeletonIncludes = Function.prototype.call.bind(
  String.prototype.includes
) as (value: string, search: string) => boolean
const skeletonStartsWith = Function.prototype.call.bind(
  String.prototype.startsWith
) as (value: string, search: string) => boolean
const skeletonTrim = Function.prototype.call.bind(String.prototype.trim) as (
  value: string
) => string

export function expandIntervalFormatTemplates(
  data: IntervalFormatsData,
  templates?: IntervalFormatTemplates
): IntervalFormatsData {
  if (!templates) return data
  const expanded = {...data}
  for (const [timeKey, time, timeRanges] of templates.times) {
    for (const [
      dateKey,
      date,
      connector,
      fallbackConnector,
    ] of templates.dates) {
      const key = connector.replace('{0}', timeKey).replace('{1}', dateKey)
      if (expanded[key] !== undefined) continue
      const ranges = skeletonCreate(null) as Record<string, string>
      for (const field of Object.keys(timeRanges)) {
        const info = getRangePatternInfo(timeRanges[field])
        const pattern = connector
          .replace('{0}', info.pattern)
          .replace('{1}', date)
        ranges[field] =
          info.reversed === undefined
            ? pattern
            : `${info.reversed ? 'latestFirst' : 'earliestFirst'}:${pattern}`
      }
      const endpoint = fallbackConnector
        .replace('{0}', time)
        .replace('{1}', date)
      ranges.date = data.intervalFormatFallback
        .replace('{0}', endpoint)
        .replace('{1}', endpoint)
      expanded[key] = ranges
    }
  }
  return expanded
}

const patternFields = new WeakMap<Formats, Intl.DateTimeFormatOptions>()
const readPatternFields = patternFields.get.bind(patternFields)
const writePatternFields = patternFields.set.bind(patternFields)

export function setDateTimePatternFields(
  format: Formats,
  fields: Intl.DateTimeFormatOptions
): void {
  writePatternFields(format, fields)
}

export function getDateTimePatternFields(
  format: Formats
): Intl.DateTimeFormatOptions {
  const cached = readPatternFields(format)
  if (cached) return cached
  const fields: Intl.DateTimeFormatOptions = skeletonCreate(null)
  processDateTimePattern(format.rawPattern, fields)
  writePatternFields(format, fields)
  return fields
}

// ECMA-402 §11.5.5 steps 5–6 use the layout for the resolved hour cycle.
// CLDR supplies the two layouts as separate patterns.
// https://tc39.es/ecma402/#sec-partitiondatetimepattern
export function availableFormatHourCycle(
  options: Intl.DateTimeFormatOptions,
  formats: Formats[]
): boolean | undefined {
  const hour12 = options.hour === undefined ? undefined : options.hour12
  if (
    hour12 !== undefined &&
    arraySome(formats, format => {
      const fields = getDateTimePatternFields(format)
      return fields.hour !== undefined && (fields.hour12 === true) === hour12
    })
  ) {
    return hour12
  }
  return undefined
}

/**
 * https://unicode.org/reports/tr35/tr35-dates.html#Date_Field_Symbol_Table
 * Credit: https://github.com/caridy/intl-datetimeformat-pattern/blob/master/index.js
 * with some tweaks
 */

function matchSkeletonPattern(
  match: string,
  result: Pick<
    Intl.DateTimeFormatOptions,
    | 'weekday'
    | 'era'
    | 'year'
    | 'month'
    | 'day'
    | 'dayPeriod'
    | 'hour'
    | 'minute'
    | 'second'
    | 'fractionalSecondDigits'
    | 'timeZoneName'
  > & {
    hour12?: boolean
    monthStandalone?: boolean
    weekdayStandalone?: boolean
  }
) {
  const len = match.length
  switch (match[0]) {
    // Era
    case 'G':
      result.era = len === 4 ? 'long' : len === 5 ? 'narrow' : 'short'
      return '{era}'

    // Year
    case 'y':
    case 'Y':
    case 'u':
      result.year = len === 2 ? '2-digit' : 'numeric'
      return '{year}'
    case 'U':
      result.year = 'numeric'
      return '{yearName}'
    case 'r':
      result.year = 'numeric'
      return '{relatedYear}'

    // Quarter
    case 'q':
    case 'Q':
      throw new RangeErrorConstructor(
        '`w/Q` (quarter) patterns are not supported'
      )
    // Month
    case 'M':
    case 'L':
      result.monthStandalone = match[0] === 'L'
      result.month = ['numeric', '2-digit', 'short', 'long', 'narrow'][
        len - 1
      ] as 'numeric'
      return '{month}'

    // Week
    case 'w':
    case 'W':
      throw new RangeErrorConstructor(
        '`w/W` (week of year) patterns are not supported'
      )
    case 'd':
      result.day = ['numeric', '2-digit'][len - 1] as 'numeric'
      return '{day}'

    case 'D':
    case 'F':
    case 'g':
      result.day = 'numeric'
      return '{day}'

    // Weekday
    case 'E':
      result.weekdayStandalone = false
      result.weekday = len === 4 ? 'long' : len === 5 ? 'narrow' : 'short'
      return '{weekday}'

    case 'e':
      result.weekdayStandalone = false
      result.weekday = [
        undefined,
        undefined,
        'short',
        'long',
        'narrow',
        'short',
      ][len - 1] as 'short'
      return '{weekday}'

    case 'c':
      result.weekdayStandalone = true
      result.weekday = [
        undefined,
        undefined,
        'short',
        'long',
        'narrow',
        'short',
      ][len - 1] as 'short'
      return '{weekday}'

    // Period
    case 'a': // AM, PM
    case 'b': // am, pm, noon, midnight
      result.hour12 = true
      return '{ampm}'
    // LDML Date Field Symbol Table: B widths select flexible day periods.
    // https://unicode.org/reports/tr35/tr35-dates.html#Date_Field_Symbol_Table
    // https://github.com/unicode-org/cldr/blob/acd6d88ae493633240e19a87a721076a8a75c310/docs/ldml/tr35-dates.md#L2235-L2240
    case 'B':
      result.dayPeriod = len === 4 ? 'long' : len === 5 ? 'narrow' : 'short'
      return '{dayPeriod}'
    // Hour
    case 'h':
      result.hour = ['numeric', '2-digit'][len - 1] as 'numeric'
      result.hour12 = true
      return '{hour}'

    case 'H':
      result.hour = ['numeric', '2-digit'][len - 1] as 'numeric'
      return '{hour}'

    case 'K':
      result.hour = ['numeric', '2-digit'][len - 1] as 'numeric'
      result.hour12 = true
      return '{hour}'

    case 'k':
      result.hour = ['numeric', '2-digit'][len - 1] as 'numeric'
      return '{hour}'

    case 'j':
    case 'J':
    case 'C':
      throw new RangeErrorConstructor(
        '`j/J/C` (hour) patterns are not supported, use `h/H/K/k` instead'
      )
    // Minute
    case 'm':
      result.minute = ['numeric', '2-digit'][len - 1] as 'numeric'
      return '{minute}'

    // Second
    case 's':
      result.second = ['numeric', '2-digit'][len - 1] as 'numeric'
      return '{second}'

    case 'S':
      // LDML Date Field Symbol Table: S is a fraction of a second.
      // https://unicode.org/reports/tr35/tr35-dates.html#Date_Field_Symbol_Table
      result.fractionalSecondDigits = len === 1 ? 1 : len === 2 ? 2 : 3
      return '{fractionalSecondDigits}'
    case 'A':
      result.second = 'numeric'
      return '{second}'
    case 'v':
      result.timeZoneName = len < 4 ? 'shortGeneric' : 'longGeneric'
      return '{timeZoneName}'
    case 'O':
      result.timeZoneName = len < 4 ? 'shortOffset' : 'longOffset'
      return '{timeZoneName}'
    // Zone
    case 'z': // 1..3, 4: specific non-location format
    case 'Z': // 1..3, 4, 5: The ISO8601 varios formats
    case 'V': // 1, 2, 3, 4: time zone ID or city
    case 'X': // 1, 2, 3, 4: The ISO8601 varios formats
    case 'x': // 1, 2, 3, 4: The ISO8601 varios formats
      result.timeZoneName = len < 4 ? 'short' : 'long'
      return '{timeZoneName}'
  }
  return ''
}

function skeletonTokenToTable2(c: string): TABLE_2 {
  switch (c) {
    // Era
    case 'G':
      return 'era'

    // Year
    case 'y':
    case 'Y':
    case 'u':
    case 'U':
    case 'r':
      return 'year'

    // Month
    case 'M':
    case 'L':
      return 'month'

    // Day
    case 'd':
    case 'D':
    case 'F':
    case 'g':
      return 'day'

    // Period
    case 'a': // AM, PM
    case 'b': // am, pm, noon, midnight
      return 'ampm'
    case 'B': // flexible day periods
      return 'dayPeriod'
    // Hour
    case 'h':
    case 'H':
    case 'K':
    case 'k':
      return 'hour'
    // Minute
    case 'm':
      return 'minute'

    // Second
    case 's':
    case 'A':
      return 'second'
    case 'S':
      return 'fractionalSecondDigits'
    default:
      throw new RangeErrorConstructor('Invalid range pattern token')
  }
}

function replaceDateTimeTokens(
  pattern: string,
  result: Intl.DateTimeFormatOptions & {
    monthStandalone?: boolean
    weekdayStandalone?: boolean
  }
): string {
  let output = ''
  let quoted = false
  for (let i = 0; i < pattern.length;) {
    const c = pattern[i]
    if (c === "'") {
      if (pattern[i + 1] === "'") {
        output += "'"
        i += 2
      } else {
        quoted = !quoted
        i++
      }
      continue
    }
    const maximum = skeletonIncludes('Eec', c)
      ? 6
      : skeletonIncludes('GQqUMLabB', c)
        ? 5
        : skeletonIncludes('zZOvVxX', c)
          ? 4
          : c === 'D'
            ? 3
            : skeletonIncludes('dhkHKwms', c)
              ? 2
              : skeletonIncludes('FW', c)
                ? 1
                : skeletonIncludes('yYurS', c)
                  ? Infinity
                  : 0
    if (quoted || !maximum) {
      output += c
      i++
      continue
    }
    let end = i + 1
    while (end < pattern.length && end - i < maximum && pattern[end] === c)
      end++
    output += matchSkeletonPattern(skeletonSlice(pattern, i, end), result)
    i = end
  }
  return output
}

export function processDateTimePattern(
  pattern: string,
  result: Intl.DateTimeFormatOptions & {
    monthStandalone?: boolean
    weekdayStandalone?: boolean
  } = skeletonCreate(null)
): [string, string] {
  const pattern12 = replaceDateTimeTokens(pattern, result)
  const period = skeletonIndexOf(pattern12, '{ampm}')
  let withoutPeriod = pattern12
  if (period >= 0) {
    const after = period + '{ampm}'.length
    const surroundingSpace =
      period > 0 &&
      after < pattern12.length &&
      !skeletonTrim(pattern12[period - 1]) &&
      !skeletonTrim(pattern12[after])
    withoutPeriod =
      skeletonSlice(pattern12, 0, period) +
      skeletonSlice(pattern12, after + (surroundingSpace ? 1 : 0))
  }
  return [skeletonTrim(withoutPeriod), pattern12]
}

export function getRangePatternInfo(rawPattern: string): {
  pattern: string
  reversed?: boolean
} {
  if (skeletonStartsWith(rawPattern, 'latestFirst:'))
    return {
      pattern: skeletonSlice(rawPattern, 'latestFirst:'.length),
      reversed: true,
    }
  if (skeletonStartsWith(rawPattern, 'earliestFirst:'))
    return {
      pattern: skeletonSlice(rawPattern, 'earliestFirst:'.length),
      reversed: false,
    }
  return {pattern: rawPattern}
}

export function parseDateTimeSkeleton(
  skeleton: string,
  rawPattern: string = skeleton,
  rangePatterns?: Record<string, string>,
  intervalFormatFallback?: string,
  lazyRanges: boolean = false
): Formats {
  const result = {
    __proto__: null,
    pattern: '',
    pattern12: '',
    skeleton,
    rawPattern,
    rangePatterns: skeletonCreate(null) as Formats['rangePatterns'],
    rangePatterns12: skeletonCreate(null) as Formats['rangePatterns12'],
  } as Formats

  // Process skeleton
  replaceDateTimeTokens(skeleton, result)
  const fields: Intl.DateTimeFormatOptions = skeletonCreate(null)
  const processedPattern = processDateTimePattern(rawPattern, fields)
  const pattern = processedPattern[0]
  const pattern12 = processedPattern[1]
  writePatternFields(result, fields)
  result.pattern = pattern
  result.pattern12 = pattern12
  const standaloneFields = ['monthStandalone', 'weekdayStandalone'] as const
  for (let index = 0; index < standaloneFields.length; index++) {
    const field = standaloneFields[index]
    if ((fields as Formats)[field] !== undefined)
      result[field] = (fields as Formats)[field]
  }
  // Matching inspects many candidates; parse intervals only for selected records.
  function initializeRanges() {
    const descriptors = {
      rangePatterns: {
        __proto__: null,
        value: skeletonCreate(null),
        writable: true,
        configurable: true,
        enumerable: true,
      },
      rangePatterns12: {
        __proto__: null,
        value: skeletonCreate(null),
        writable: true,
        configurable: true,
        enumerable: true,
      },
    }
    skeletonDefineProperties(result, descriptors)
    const first =
      intervalFormatFallback == null
        ? -1
        : skeletonIndexOf(intervalFormatFallback, '{0}')
    const last =
      intervalFormatFallback == null
        ? -1
        : skeletonIndexOf(intervalFormatFallback, '{1}')
    const defaultReversed = first >= 0 && last >= 0 && last < first
    function addRange(k: string, rawPattern: string) {
      const info = getRangePatternInfo(rawPattern)
      const reversed = info.reversed ?? defaultReversed
      const key = k === 'fallback' ? 'default' : skeletonTokenToTable2(k)
      const intervalResult = {
        __proto__: null,
        patternParts: [],
      } as unknown as RangePatterns
      const processed = processDateTimePattern(info.pattern, intervalResult)
      result.rangePatterns[key] = {
        __proto__: null,
        ...intervalResult,
        patternParts: splitRangePattern(processed[0]),
      } as RangePatterns
      result.rangePatterns12[key] = {
        __proto__: null,
        ...intervalResult,
        patternParts: splitRangePattern(processed[1]),
      } as RangePatterns
      if (reversed) {
        const ranges = [result.rangePatterns[key], result.rangePatterns12[key]]
        for (let rangeIndex = 0; rangeIndex < ranges.length; rangeIndex++) {
          const parts = ranges[rangeIndex].patternParts
          for (let partIndex = 0; partIndex < parts.length; partIndex++) {
            const part = parts[partIndex]
            if (part.source === RangePatternType.startRange)
              part.source = RangePatternType.endRange
            else if (part.source === RangePatternType.endRange)
              part.source = RangePatternType.startRange
          }
        }
      }
    }
    if (rangePatterns) {
      const keys = skeletonKeys(rangePatterns)
      const dateFields = ['G', 'y', 'M', 'd']
      for (let index = 0; index < keys.length; index++) {
        const key = keys[index]
        if (key === 'date') {
          for (
            let fieldIndex = 0;
            fieldIndex < dateFields.length;
            fieldIndex++
          ) {
            const field = dateFields[fieldIndex]
            if (!HasOwnProperty(rangePatterns, field))
              addRange(field, rangePatterns[key])
          }
        } else addRange(key, rangePatterns[key])
      }
    }
    if (intervalFormatFallback && !result.rangePatterns.default) {
      const patternParts = splitFallbackRangePattern(intervalFormatFallback)
      result.rangePatterns.default = {
        __proto__: null,
        ...fields,
        patternParts,
      } as RangePatterns
      result.rangePatterns12.default = {
        __proto__: null,
        ...fields,
        patternParts,
      } as RangePatterns
    }
    // Preserve the selected calendar's exact year field types.
    const yearFields: string[] = []
    const candidates = ['{relatedYear}', '{yearName}']
    for (let index = 0; index < candidates.length; index++) {
      const field = candidates[index]
      if (skeletonIncludes(pattern, field))
        setDataProperty(yearFields, `${yearFields.length}`, field)
    }
    if (yearFields.length) {
      const allPatterns = [result.rangePatterns, result.rangePatterns12]
      for (
        let patternIndex = 0;
        patternIndex < allPatterns.length;
        patternIndex++
      ) {
        const patterns = allPatterns[patternIndex]
        const keys = skeletonKeys(patterns) as Array<keyof typeof patterns>
        for (let keyIndex = 0; keyIndex < keys.length; keyIndex++) {
          const field = keys[keyIndex]
          if (field === 'default') continue
          const parts = patterns[field]!.patternParts
          let range = ''
          for (let partIndex = 0; partIndex < parts.length; partIndex++)
            range += parts[partIndex].pattern
          if (
            arraySome(
              yearFields,
              yearField => !skeletonIncludes(range, yearField)
            )
          )
            delete patterns[field]
        }
      }
    }
  }
  if (lazyRanges) {
    const rangeFields = ['rangePatterns', 'rangePatterns12'] as const
    for (let index = 0; index < rangeFields.length; index++) {
      const field = rangeFields[index]
      const descriptor = {
        __proto__: null,
        configurable: true,
        enumerable: true,
        get() {
          initializeRanges()
          return result[field]
        },
        set(value: Formats[typeof field]) {
          initializeRanges()
          result[field] = value
        },
      }
      skeletonDefineProperty(result, field, descriptor)
    }
  } else initializeRanges()
  return result
}

export function splitFallbackRangePattern(
  pattern: string
): Array<RangePatternPart> {
  const parts: RangePatternPart[] = []
  let start = 0
  for (let i = 0; i < pattern.length; i++) {
    const token = skeletonSlice(pattern, i, i + 3)
    if (token !== '{0}' && token !== '{1}') continue
    if (i > start)
      setDataProperty(parts, `${parts.length}`, {
        source: RangePatternType.shared,
        pattern: skeletonSlice(pattern, start, i),
      })
    setDataProperty(parts, `${parts.length}`, {
      source:
        token === '{0}'
          ? RangePatternType.startRange
          : RangePatternType.endRange,
      pattern: token,
    })
    start = i + 3
    i += 2
  }
  if (start < pattern.length)
    setDataProperty(parts, `${parts.length}`, {
      source: RangePatternType.shared,
      pattern: skeletonSlice(pattern, start),
    })
  return parts
}

export function splitRangePattern(pattern: string): Array<RangePatternPart> {
  const fields = new SkeletonMap<string, {start: number; end: number}>()
  let startBegin = pattern.length
  let startEnd = 0
  let endBegin = pattern.length
  let endEnd = 0
  for (let index = skeletonIndexOf(pattern, '{'); index >= 0;) {
    const close = skeletonIndexOf(pattern, '}', index + 1)
    if (close < 0) break
    const key = skeletonSlice(pattern, index + 1, close)
    const first = skeletonApply(skeletonMapGet, fields, [key]) as
      | {start: number; end: number}
      | undefined
    const end = close + 1
    if (first) {
      startBegin = mathMin(startBegin, first.start)
      startEnd = mathMax(startEnd, first.end)
      endBegin = mathMin(endBegin, index)
      endEnd = mathMax(endEnd, end)
    } else {
      skeletonApply(skeletonMapSet, fields, [key, {start: index, end}])
    }
    index = skeletonIndexOf(pattern, '{', end)
  }
  if (!startEnd) return [{source: RangePatternType.shared, pattern}]

  // ECMA-402 §11.5.8 step 19.f.i preserves each range record's source.
  // Repeated fields bound each endpoint; outer text and the separator are shared.
  // ICU derives the same spans from repeated field positions:
  // https://github.com/unicode-org/icu/blob/030fa1a4791ee7c2f58505ebb61253c3032916ec/icu4c/source/i18n/formattedval_iterimpl.cpp#L86-L122
  // https://tc39.es/ecma402/#sec-partitiondatetimerangepattern
  // https://github.com/tc39/ecma402/blob/b1c961988b9a07894b1dc3dc2b5626ea48387d61/spec/datetimeformat.html#L1577-L1587
  // https://unicode.org/reports/tr35/tr35-dates.html#intervalFormats
  // https://github.com/unicode-org/cldr/blob/acd6d88ae493633240e19a87a721076a8a75c310/docs/ldml/tr35-dates.md#L868-L882
  const result: RangePatternPart[] = []
  function append(begin: number, end: number, source: RangePatternType) {
    if (begin < end)
      setDataProperty(result, `${result.length}`, {
        source,
        pattern: skeletonSlice(pattern, begin, end),
      })
  }
  append(0, startBegin, RangePatternType.shared)
  append(startBegin, startEnd, RangePatternType.startRange)
  append(startEnd, endBegin, RangePatternType.shared)
  append(endBegin, endEnd, RangePatternType.endRange)
  append(endEnd, pattern.length, RangePatternType.shared)
  return result
}

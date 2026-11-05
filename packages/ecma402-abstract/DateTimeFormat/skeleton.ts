import {
  type Formats,
  type RangePatternPart,
  type RangePatterns,
  RangePatternType,
  type TABLE_2,
} from '#packages/ecma402-abstract/types/date-time.js'

const patternFields = new WeakMap<Formats, Intl.DateTimeFormatOptions>()

export function getDateTimePatternFields(
  format: Formats
): Intl.DateTimeFormatOptions {
  const cached = patternFields.get(format)
  if (cached) return cached
  const fields: Intl.DateTimeFormatOptions = Object.create(null)
  processDateTimePattern(format.rawPattern, fields)
  patternFields.set(format, fields)
  return fields
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
      throw new RangeError('`w/Q` (quarter) patterns are not supported')
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
      throw new RangeError('`w/W` (week of year) patterns are not supported')
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
      throw new RangeError(
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

    case 'S':
    case 'A':
      return 'second'
    default:
      throw new RangeError('Invalid range pattern token')
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
    const maximum = 'Eec'.includes(c)
      ? 6
      : 'GQqUMLabB'.includes(c)
        ? 5
        : 'zZOvVxX'.includes(c)
          ? 4
          : c === 'D'
            ? 3
            : 'dhkHKwms'.includes(c)
              ? 2
              : 'FW'.includes(c)
                ? 1
                : 'yYur'.includes(c)
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
    output += matchSkeletonPattern(pattern.slice(i, end), result)
    i = end
  }
  return output
}

export function processDateTimePattern(
  pattern: string,
  result: Intl.DateTimeFormatOptions & {
    monthStandalone?: boolean
    weekdayStandalone?: boolean
  } = Object.create(null)
): [string, string] {
  const pattern12 = replaceDateTimeTokens(pattern, result)
  const period = pattern12.indexOf('{ampm}')
  let withoutPeriod = pattern12
  if (period >= 0) {
    const after = period + '{ampm}'.length
    const surroundingSpace =
      period > 0 &&
      after < pattern12.length &&
      !pattern12[period - 1].trim() &&
      !pattern12[after].trim()
    withoutPeriod =
      pattern12.slice(0, period) +
      pattern12.slice(after + (surroundingSpace ? 1 : 0))
  }
  return [withoutPeriod.trim(), pattern12]
}

export function getRangePatternInfo(rawPattern: string): {
  pattern: string
  reversed?: boolean
} {
  if (rawPattern.startsWith('latestFirst:'))
    return {pattern: rawPattern.slice('latestFirst:'.length), reversed: true}
  if (rawPattern.startsWith('earliestFirst:'))
    return {pattern: rawPattern.slice('earliestFirst:'.length), reversed: false}
  return {pattern: rawPattern}
}

export function parseDateTimeSkeleton(
  skeleton: string,
  rawPattern: string = skeleton,
  rangePatterns?: Record<string, string>,
  intervalFormatFallback?: string,
  lazyRanges: boolean = false
): Formats {
  const result: Formats = Object.assign(Object.create(null), {
    pattern: '',
    pattern12: '',
    skeleton,
    rawPattern,
    rangePatterns: Object.create(null) as Formats['rangePatterns'],
    rangePatterns12: Object.create(null) as Formats['rangePatterns12'],
  })

  // Process skeleton
  replaceDateTimeTokens(skeleton, result)
  const fields: Intl.DateTimeFormatOptions = Object.create(null)
  const [pattern, pattern12] = processDateTimePattern(rawPattern, fields)
  patternFields.set(result, fields)
  result.pattern = pattern
  result.pattern12 = pattern12
  for (const field of ['monthStandalone', 'weekdayStandalone'] as const) {
    if ((fields as Formats)[field] !== undefined)
      result[field] = (fields as Formats)[field]
  }
  // Matching inspects many candidates; parse intervals only for selected records.
  function initializeRanges() {
    Object.defineProperties(result, {
      rangePatterns: {
        value: Object.create(null),
        writable: true,
        configurable: true,
        enumerable: true,
      },
      rangePatterns12: {
        value: Object.create(null),
        writable: true,
        configurable: true,
        enumerable: true,
      },
    })
    const first = intervalFormatFallback?.indexOf('{0}') ?? -1
    const last = intervalFormatFallback?.indexOf('{1}') ?? -1
    const defaultReversed = first >= 0 && last >= 0 && last < first
    function addRange(k: string, rawPattern: string) {
      const info = getRangePatternInfo(rawPattern)
      const reversed = info.reversed ?? defaultReversed
      const key = k === 'fallback' ? 'default' : skeletonTokenToTable2(k)
      const intervalResult: RangePatterns = Object.assign(Object.create(null), {
        patternParts: [],
      })
      const [pattern, pattern12] = processDateTimePattern(
        info.pattern,
        intervalResult
      )

      result.rangePatterns[key] = {
        ...intervalResult,
        patternParts: splitRangePattern(pattern),
      }
      result.rangePatterns12[key] = {
        ...intervalResult,
        patternParts: splitRangePattern(pattern12),
      }
      if (reversed)
        for (const range of [
          result.rangePatterns[key],
          result.rangePatterns12[key],
        ]) {
          for (const part of range.patternParts) {
            if (part.source === RangePatternType.startRange)
              part.source = RangePatternType.endRange
            else if (part.source === RangePatternType.endRange)
              part.source = RangePatternType.startRange
          }
        }
    }
    if (rangePatterns) {
      for (const key of Object.keys(rangePatterns)) {
        if (key === 'date') {
          for (const field of ['G', 'y', 'M', 'd']) {
            if (!Object.prototype.hasOwnProperty.call(rangePatterns, field))
              addRange(field, rangePatterns[key])
          }
        } else addRange(key, rangePatterns[key])
      }
    }
    if (intervalFormatFallback && !result.rangePatterns.default) {
      const patternParts = splitFallbackRangePattern(intervalFormatFallback)
      result.rangePatterns.default = {
        ...fields,
        patternParts,
      }
      result.rangePatterns12.default = {
        ...fields,
        patternParts,
      }
    }

    // Interval data must preserve the selected calendar's year field types.
    const yearFields = ['{relatedYear}', '{yearName}'].filter(field =>
      pattern.includes(field)
    )
    if (yearFields.length) {
      for (const patterns of [result.rangePatterns, result.rangePatterns12]) {
        for (const field of Object.keys(patterns) as Array<
          keyof typeof patterns
        >) {
          if (field === 'default') continue
          const range = patterns[field]!.patternParts.map(
            part => part.pattern
          ).join('')
          if (yearFields.some(yearField => !range.includes(yearField))) {
            delete patterns[field]
          }
        }
      }
    }
  }
  if (lazyRanges)
    for (const field of ['rangePatterns', 'rangePatterns12'] as const) {
      Object.defineProperty(result, field, {
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
      })
    }
  else initializeRanges()
  return result
}

export function splitFallbackRangePattern(
  pattern: string
): Array<RangePatternPart> {
  let parts: RangePatternPart[] = []
  let start = 0
  for (let i = 0; i < pattern.length; i++) {
    const token = pattern.slice(i, i + 3)
    if (token !== '{0}' && token !== '{1}') continue
    if (i > start)
      parts = [
        ...parts,
        {source: RangePatternType.shared, pattern: pattern.slice(start, i)},
      ]
    parts = [
      ...parts,
      {
        source:
          token === '{0}'
            ? RangePatternType.startRange
            : RangePatternType.endRange,
        pattern: token,
      },
    ]
    start = i + 3
    i += 2
  }
  if (start < pattern.length)
    parts = [
      ...parts,
      {source: RangePatternType.shared, pattern: pattern.slice(start)},
    ]
  return parts
}

export function splitRangePattern(pattern: string): Array<RangePatternPart> {
  const fields = new Map<string, {start: number; end: number}>()
  let startBegin = pattern.length
  let startEnd = 0
  let endBegin = pattern.length
  let endEnd = 0
  for (let index = pattern.indexOf('{'); index >= 0;) {
    const close = pattern.indexOf('}', index + 1)
    if (close < 0) break
    const key = pattern.slice(index + 1, close)
    const first = fields.get(key)
    const end = close + 1
    if (first) {
      startBegin = Math.min(startBegin, first.start)
      startEnd = Math.max(startEnd, first.end)
      endBegin = Math.min(endBegin, index)
      endEnd = Math.max(endEnd, end)
    } else {
      fields.set(key, {start: index, end})
    }
    index = pattern.indexOf('{', end)
  }
  if (!startEnd) return [{source: RangePatternType.shared, pattern}]

  // ECMA-402 11.5.9, step 19.f.i preserves each range record's source.
  // Repeated fields bound each endpoint; outer text and the separator are shared.
  // ICU derives the same spans from repeated field positions:
  // https://github.com/unicode-org/icu/blob/030fa1a4791ee7c2f58505ebb61253c3032916ec/icu4c/source/i18n/formattedval_iterimpl.cpp#L86-L122
  // https://tc39.es/ecma402/#sec-partitiondatetimerangepattern
  // https://github.com/tc39/ecma402/blob/b1c961988b9a07894b1dc3dc2b5626ea48387d61/spec/datetimeformat.html#L1577-L1587
  // https://unicode.org/reports/tr35/tr35-dates.html#intervalFormats
  // https://github.com/unicode-org/cldr/blob/acd6d88ae493633240e19a87a721076a8a75c310/docs/ldml/tr35-dates.md#L868-L882
  let result: RangePatternPart[] = []
  function append(begin: number, end: number, source: RangePatternType) {
    if (begin < end)
      result = [...result, {source, pattern: pattern.slice(begin, end)}]
  }
  append(0, startBegin, RangePatternType.shared)
  append(startBegin, startEnd, RangePatternType.startRange)
  append(startEnd, endBegin, RangePatternType.shared)
  append(endBegin, endEnd, RangePatternType.endRange)
  append(endEnd, pattern.length, RangePatternType.shared)
  return result
}

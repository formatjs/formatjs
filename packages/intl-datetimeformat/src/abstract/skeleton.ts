import {
  Formats,
  RangePatternPart,
  RangePatterns,
  RangePatternType,
  TABLE_2,
} from '@formatjs/ecma402-abstract'

/**
 * https://unicode.org/reports/tr35/tr35-dates.html#Date_Field_Symbol_Table
 * Credit: https://github.com/caridy/intl-datetimeformat-pattern/blob/master/index.js
 * with some tweaks
 */
const DATE_TIME_REGEX =
  /(?:[Eec]{1,6}|G{1,5}|[Qq]{1,5}|(?:[yYur]+|U{1,5})|[ML]{1,5}|d{1,2}|D{1,3}|F{1}|[abB]{1,5}|[hkHK]{1,2}|w{1,2}|W{1}|m{1,2}|s{1,2}|[zZOvVxX]{1,4})(?=([^']*'[^']*')*[^']*$)/g

// trim patterns after transformations
const expPatternTrimmer = /^[\s\uFEFF\xA0]+|[\s\uFEFF\xA0]+$/g

function matchSkeletonPattern(
  match: string,
  result: Pick<
    Intl.DateTimeFormatOptions,
    | 'weekday'
    | 'era'
    | 'year'
    | 'month'
    | 'day'
    | 'hour'
    | 'minute'
    | 'second'
    | 'timeZoneName'
  > & {
    hour12?: boolean
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
    case 'U':
    case 'r':
      result.year = len === 2 ? '2-digit' : 'numeric'
      return '{year}'

    // Quarter
    case 'q':
    case 'Q':
      throw new RangeError('`w/Q` (quarter) patterns are not supported')
    // Month
    case 'M':
    case 'L':
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
      result.weekday = len === 4 ? 'long' : len === 5 ? 'narrow' : 'short'
      return '{weekday}'

    case 'e':
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
    case 'B': // flexible day periods
      result.hour12 = true
      return '{ampm}'
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
    // Zone
    case 'z': // 1..3, 4: specific non-location format
    case 'Z': // 1..3, 4, 5: The ISO8601 varios formats
    case 'O': // 1, 4: miliseconds in day short, long
    case 'v': // 1, 4: generic non-location format
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
    case 'B': // flexible day periods
      return 'ampm'
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

export function processDateTimePattern(
  pattern: string,
  result?: Pick<
    Intl.DateTimeFormatOptions,
    | 'weekday'
    | 'era'
    | 'year'
    | 'month'
    | 'day'
    | 'hour'
    | 'minute'
    | 'second'
    | 'timeZoneName'
  > & {
    hour12?: boolean
  }
): [string, string] {
  const literals: string[] = []

  // Use skeleton to populate result, but use mapped pattern to populate pattern
  let pattern12 = pattern
    // Double apostrophe
    .replace(/'{2}/g, '{apostrophe}')
    // Apostrophe-escaped
    .replace(/'(.*?)'/g, (_, literal) => {
      literals.push(literal)
      return `$$${literals.length - 1}$$`
    })
    .replace(DATE_TIME_REGEX, m => matchSkeletonPattern(m, result || {}))

  //Restore literals
  if (literals.length) {
    pattern12 = pattern12
      .replace(/\$\$(\d+)\$\$/g, (_, i) => {
        return literals[+i]
      })
      .replace(/\{apostrophe\}/g, "'")
  }
  // Handle apostrophe-escaped things
  return [
    pattern12
      .replace(/([\s\uFEFF\xA0])\{ampm\}([\s\uFEFF\xA0])/, '$1')
      .replace('{ampm}', '')
      .replace(expPatternTrimmer, ''),
    pattern12,
  ]
}

/**
 * Parse Date time skeleton into Intl.DateTimeFormatOptions
 * Ref: https://unicode.org/reports/tr35/tr35-dates.html#Date_Field_Symbol_Table
 * @public
 * @param skeleton skeleton string
 */
export function parseDateTimeSkeleton(
  skeleton: string,
  rawPattern: string = skeleton,
  rangePatterns?: Record<string, string>,
  intervalFormatFallback?: string
): Formats {
  const result: Formats = {
    pattern: '',
    pattern12: '',
    skeleton,
    rawPattern,
    rangePatterns: {} as Formats['rangePatterns'],
    rangePatterns12: {} as Formats['rangePatterns12'],
  }

  if (rangePatterns) {
    for (const k in rangePatterns) {
      const key = skeletonTokenToTable2(k)
      const rawPattern = rangePatterns[k]
      const intervalResult: RangePatterns = {
        patternParts: [],
      }
      const [pattern, pattern12] = processDateTimePattern(
        rawPattern,
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
    }
  }
  if (intervalFormatFallback) {
    const patternParts = splitFallbackRangePattern(intervalFormatFallback)
    result.rangePatterns.default = {
      patternParts,
    }
    result.rangePatterns12.default = {
      patternParts,
    }
  }

  // Process skeleton
  skeleton.replace(DATE_TIME_REGEX, m => matchSkeletonPattern(m, result))
  const [pattern, pattern12] = processDateTimePattern(rawPattern)
  result.pattern = pattern
  result.pattern12 = pattern12
  return result
}

export function splitFallbackRangePattern(
  pattern: string
): Array<RangePatternPart> {
  const parts = pattern.split(/(\{[0|1]\})/g).filter(Boolean)
  return parts.map(pattern => {
    switch (pattern) {
      case '{0}':
        return {
          source: RangePatternType.startRange,
          pattern,
        }
      case '{1}':
        return {
          source: RangePatternType.endRange,
          pattern,
        }
      default:
        return {
          source: RangePatternType.shared,
          pattern,
        }
    }
  })
}

export function splitRangePattern(pattern: string): Array<RangePatternPart> {
  const PART_REGEX = /\{(.*?)\}/g
  // Map of part and index within the string
  const parts: Record<string, number> = {}
  let match
  let splitIndex = 0
  while ((match = PART_REGEX.exec(pattern))) {
    if (!(match[0] in parts)) {
      parts[match[0]] = match.index
    } else {
      splitIndex = match.index
      break
    }
  }
  if (!splitIndex) {
    return [
      {
        source: RangePatternType.startRange,
        pattern,
      },
    ]
  }
  return [
    {
      source: RangePatternType.startRange,
      pattern: pattern.slice(0, splitIndex),
    },
    {
      source: RangePatternType.endRange,
      pattern: pattern.slice(splitIndex),
    },
  ]
}

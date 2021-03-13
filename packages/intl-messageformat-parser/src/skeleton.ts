import {ExtendedNumberFormatOptions, NumberSkeletonToken} from './types'

/**
 * https://unicode.org/reports/tr35/tr35-dates.html#Date_Field_Symbol_Table
 * Credit: https://github.com/caridy/intl-datetimeformat-pattern/blob/master/index.js
 * with some tweaks
 */
const DATE_TIME_REGEX = /(?:[Eec]{1,6}|G{1,5}|[Qq]{1,5}|(?:[yYur]+|U{1,5})|[ML]{1,5}|d{1,2}|D{1,3}|F{1}|[abB]{1,5}|[hkHK]{1,2}|w{1,2}|W{1}|m{1,2}|s{1,2}|[zZOvVxX]{1,4})(?=([^']*'[^']*')*[^']*$)/g

export interface ExtendedDateTimeFormatOptions
  extends Intl.DateTimeFormatOptions {
  hourCycle?: 'h11' | 'h12' | 'h23' | 'h24'
}

/**
 * Parse Date time skeleton into Intl.DateTimeFormatOptions
 * Ref: https://unicode.org/reports/tr35/tr35-dates.html#Date_Field_Symbol_Table
 * @public
 * @param skeleton skeleton string
 */
export function parseDateTimeSkeleton(
  skeleton: string
): ExtendedDateTimeFormatOptions {
  const result: ExtendedDateTimeFormatOptions = {}
  skeleton.replace(DATE_TIME_REGEX, match => {
    const len = match.length
    switch (match[0]) {
      // Era
      case 'G':
        result.era = len === 4 ? 'long' : len === 5 ? 'narrow' : 'short'
        break
      // Year
      case 'y':
        result.year = len === 2 ? '2-digit' : 'numeric'
        break
      case 'Y':
      case 'u':
      case 'U':
      case 'r':
        throw new RangeError(
          '`Y/u/U/r` (year) patterns are not supported, use `y` instead'
        )
      // Quarter
      case 'q':
      case 'Q':
        throw new RangeError('`q/Q` (quarter) patterns are not supported')
      // Month
      case 'M':
      case 'L':
        result.month = ['numeric', '2-digit', 'short', 'long', 'narrow'][
          len - 1
        ] as 'numeric'
        break
      // Week
      case 'w':
      case 'W':
        throw new RangeError('`w/W` (week) patterns are not supported')
      case 'd':
        result.day = ['numeric', '2-digit'][len - 1] as 'numeric'
        break
      case 'D':
      case 'F':
      case 'g':
        throw new RangeError(
          '`D/F/g` (day) patterns are not supported, use `d` instead'
        )
      // Weekday
      case 'E':
        result.weekday = len === 4 ? 'short' : len === 5 ? 'narrow' : 'short'
        break
      case 'e':
        if (len < 4) {
          throw new RangeError('`e..eee` (weekday) patterns are not supported')
        }
        result.weekday = ['short', 'long', 'narrow', 'short'][
          len - 4
        ] as 'short'
        break
      case 'c':
        if (len < 4) {
          throw new RangeError('`c..ccc` (weekday) patterns are not supported')
        }
        result.weekday = ['short', 'long', 'narrow', 'short'][
          len - 4
        ] as 'short'
        break

      // Period
      case 'a': // AM, PM
        result.hour12 = true
        break
      case 'b': // am, pm, noon, midnight
      case 'B': // flexible day periods
        throw new RangeError(
          '`b/B` (period) patterns are not supported, use `a` instead'
        )
      // Hour
      case 'h':
        result.hourCycle = 'h12'
        result.hour = ['numeric', '2-digit'][len - 1] as 'numeric'
        break
      case 'H':
        result.hourCycle = 'h23'
        result.hour = ['numeric', '2-digit'][len - 1] as 'numeric'
        break
      case 'K':
        result.hourCycle = 'h11'
        result.hour = ['numeric', '2-digit'][len - 1] as 'numeric'
        break
      case 'k':
        result.hourCycle = 'h24'
        result.hour = ['numeric', '2-digit'][len - 1] as 'numeric'
        break
      case 'j':
      case 'J':
      case 'C':
        throw new RangeError(
          '`j/J/C` (hour) patterns are not supported, use `h/H/K/k` instead'
        )
      // Minute
      case 'm':
        result.minute = ['numeric', '2-digit'][len - 1] as 'numeric'
        break
      // Second
      case 's':
        result.second = ['numeric', '2-digit'][len - 1] as 'numeric'
        break
      case 'S':
      case 'A':
        throw new RangeError(
          '`S/A` (second) patterns are not supported, use `s` instead'
        )
      // Zone
      case 'z': // 1..3, 4: specific non-location format
        result.timeZoneName = len < 4 ? 'short' : 'long'
        break
      case 'Z': // 1..3, 4, 5: The ISO8601 varios formats
      case 'O': // 1, 4: miliseconds in day short, long
      case 'v': // 1, 4: generic non-location format
      case 'V': // 1, 2, 3, 4: time zone ID or city
      case 'X': // 1, 2, 3, 4: The ISO8601 varios formats
      case 'x': // 1, 2, 3, 4: The ISO8601 varios formats
        throw new RangeError(
          '`Z/O/v/V/X/x` (timeZone) patterns are not supported, use `z` instead'
        )
    }
    return ''
  })
  return result
}

function icuUnitToEcma(unit: string): ExtendedNumberFormatOptions['unit'] {
  return unit.replace(/^(.*?)-/, '') as ExtendedNumberFormatOptions['unit']
}

const FRACTION_PRECISION_REGEX = /^\.(?:(0+)(\*)?|(#+)|(0+)(#+))$/g
const SIGNIFICANT_PRECISION_REGEX = /^(@+)?(\+|#+)?$/g
const INTEGER_WIDTH_REGEX = /(\*)(0+)|(#+)(0+)|(0+)/g
const CONCISE_INTEGER_WIDTH_REGEX = /^(0+)$/

function parseSignificantPrecision(str: string): ExtendedNumberFormatOptions {
  const result: ExtendedNumberFormatOptions = {}
  str.replace(
    SIGNIFICANT_PRECISION_REGEX,
    function (_: string, g1: string, g2: string | number) {
      // @@@ case
      if (typeof g2 !== 'string') {
        result.minimumSignificantDigits = g1.length
        result.maximumSignificantDigits = g1.length
      }
      // @@@+ case
      else if (g2 === '+') {
        result.minimumSignificantDigits = g1.length
      }
      // .### case
      else if (g1[0] === '#') {
        result.maximumSignificantDigits = g1.length
      }
      // .@@## or .@@@ case
      else {
        result.minimumSignificantDigits = g1.length
        result.maximumSignificantDigits =
          g1.length + (typeof g2 === 'string' ? g2.length : 0)
      }
      return ''
    }
  )
  return result
}

function parseSign(str: string): ExtendedNumberFormatOptions | undefined {
  switch (str) {
    case 'sign-auto':
      return {
        signDisplay: 'auto',
      }
    case 'sign-accounting':
    case '()':
      return {
        currencySign: 'accounting',
      }
    case 'sign-always':
    case '+!':
      return {
        signDisplay: 'always',
      }
    case 'sign-accounting-always':
    case '()!':
      return {
        signDisplay: 'always',
        currencySign: 'accounting',
      }
    case 'sign-except-zero':
    case '+?':
      return {
        signDisplay: 'exceptZero',
      }
    case 'sign-accounting-except-zero':
    case '()?':
      return {
        signDisplay: 'exceptZero',
        currencySign: 'accounting',
      }
    case 'sign-never':
    case '+_':
      return {
        signDisplay: 'never',
      }
  }
}

function parseConciseScientificAndEngineeringStem(
  stem: string
): ExtendedNumberFormatOptions | undefined {
  // Engineering
  let result: ExtendedNumberFormatOptions | undefined
  if (stem[0] === 'E' && stem[1] === 'E') {
    result = {
      notation: 'engineering',
    }
    stem = stem.slice(2)
  } else if (stem[0] === 'E') {
    result = {
      notation: 'scientific',
    }
    stem = stem.slice(1)
  }
  if (result) {
    const signDisplay = stem.slice(0, 2)
    if (signDisplay === '+!') {
      result.signDisplay = 'always'
      stem = stem.slice(2)
    } else if (signDisplay === '+?') {
      result.signDisplay = 'exceptZero'
      stem = stem.slice(2)
    }
    if (!CONCISE_INTEGER_WIDTH_REGEX.test(stem)) {
      throw new Error('Malformed concise eng/scientific notation')
    }
    result.minimumIntegerDigits = stem.length
  }
  return result
}

function parseNotationOptions(opt: string): ExtendedNumberFormatOptions {
  const result: ExtendedNumberFormatOptions = {}
  const signOpts = parseSign(opt)
  if (signOpts) {
    return signOpts
  }
  return result
}

/**
 * https://github.com/unicode-org/icu/blob/master/docs/userguide/format_parse/numbers/skeletons.md#skeleton-stems-and-options
 */
export function parseNumberSkeleton(
  tokens: NumberSkeletonToken[]
): ExtendedNumberFormatOptions {
  let result: ExtendedNumberFormatOptions = {}
  for (const token of tokens) {
    switch (token.stem) {
      case 'percent':
      case '%':
        result.style = 'percent'
        continue
      case '%x100':
        result.style = 'percent'
        result.scale = 100
        continue
      case 'currency':
        result.style = 'currency'
        result.currency = token.options[0]
        continue
      case 'group-off':
      case ',_':
        result.useGrouping = false
        continue
      case 'precision-integer':
      case '.':
        result.maximumFractionDigits = 0
        continue
      case 'measure-unit':
      case 'unit':
        result.style = 'unit'
        result.unit = icuUnitToEcma(token.options[0])
        continue
      case 'compact-short':
      case 'K':
        result.notation = 'compact'
        result.compactDisplay = 'short'
        continue
      case 'compact-long':
      case 'KK':
        result.notation = 'compact'
        result.compactDisplay = 'long'
        continue
      case 'scientific':
        result = {
          ...result,
          notation: 'scientific',
          ...token.options.reduce(
            (all, opt) => ({...all, ...parseNotationOptions(opt)}),
            {}
          ),
        }
        continue
      case 'engineering':
        result = {
          ...result,
          notation: 'engineering',
          ...token.options.reduce(
            (all, opt) => ({...all, ...parseNotationOptions(opt)}),
            {}
          ),
        }
        continue
      case 'notation-simple':
        result.notation = 'standard'
        continue
      // https://github.com/unicode-org/icu/blob/master/icu4c/source/i18n/unicode/unumberformatter.h
      case 'unit-width-narrow':
        result.currencyDisplay = 'narrowSymbol'
        result.unitDisplay = 'narrow'
        continue
      case 'unit-width-short':
        result.currencyDisplay = 'code'
        result.unitDisplay = 'short'
        continue
      case 'unit-width-full-name':
        result.currencyDisplay = 'name'
        result.unitDisplay = 'long'
        continue
      case 'unit-width-iso-code':
        result.currencyDisplay = 'symbol'
        continue
      case 'scale':
        result.scale = parseFloat(token.options[0])
        continue
      // https://unicode-org.github.io/icu/userguide/format_parse/numbers/skeletons.html#integer-width
      case 'integer-width':
        if (token.options.length > 1) {
          throw new RangeError(
            'integer-width stems only accept a single optional option'
          )
        }
        token.options[0].replace(
          INTEGER_WIDTH_REGEX,
          function (
            _: string,
            g1: string,
            g2: string,
            g3: string,
            g4: string,
            g5: string
          ) {
            if (g1) {
              result.minimumIntegerDigits = g2.length
            } else if (g3 && g4) {
              throw new Error(
                'We currently do not support maximum integer digits'
              )
            } else if (g5) {
              throw new Error(
                'We currently do not support exact integer digits'
              )
            }
            return ''
          }
        )
        continue
    }
    // https://unicode-org.github.io/icu/userguide/format_parse/numbers/skeletons.html#integer-width
    if (CONCISE_INTEGER_WIDTH_REGEX.test(token.stem)) {
      result.minimumIntegerDigits = token.stem.length
      continue
    }
    if (FRACTION_PRECISION_REGEX.test(token.stem)) {
      // Precision
      // https://unicode-org.github.io/icu/userguide/format_parse/numbers/skeletons.html#fraction-precision
      // precision-integer case
      if (token.options.length > 1) {
        throw new RangeError(
          'Fraction-precision stems only accept a single optional option'
        )
      }
      token.stem.replace(
        FRACTION_PRECISION_REGEX,
        function (
          _: string,
          g1: string,
          g2: string | number,
          g3: string,
          g4: string,
          g5: string
        ) {
          // .000* case (before ICU67 it was .000+)
          if (g2 === '*') {
            result.minimumFractionDigits = g1.length
          }
          // .### case
          else if (g3 && g3[0] === '#') {
            result.maximumFractionDigits = g3.length
          }
          // .00## case
          else if (g4 && g5) {
            result.minimumFractionDigits = g4.length
            result.maximumFractionDigits = g4.length + g5.length
          } else {
            result.minimumFractionDigits = g1.length
            result.maximumFractionDigits = g1.length
          }
          return ''
        }
      )

      if (token.options.length) {
        result = {...result, ...parseSignificantPrecision(token.options[0])}
      }
      continue
    }
    // https://unicode-org.github.io/icu/userguide/format_parse/numbers/skeletons.html#significant-digits-precision
    if (SIGNIFICANT_PRECISION_REGEX.test(token.stem)) {
      result = {...result, ...parseSignificantPrecision(token.stem)}
      continue
    }
    const signOpts = parseSign(token.stem)
    if (signOpts) {
      result = {...result, ...signOpts}
    }
    const conciseScientificAndEngineeringOpts = parseConciseScientificAndEngineeringStem(
      token.stem
    )
    if (conciseScientificAndEngineeringOpts) {
      result = {...result, ...conciseScientificAndEngineeringOpts}
    }
  }
  return result
}

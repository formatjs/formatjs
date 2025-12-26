import {
  IntlDateTimeFormatPart,
  IntlDateTimeFormatPartType,
  PartitionPattern,
  RangePatternType,
  SameValue,
  TABLE_2,
  TimeClip,
} from '@formatjs/ecma402-abstract'
import Decimal from 'decimal.js'
import {
  FormatDateTimePattern,
  FormatDateTimePatternImplDetails,
} from './FormatDateTimePattern.js'
import {ToLocalTime, ToLocalTimeImplDetails} from './ToLocalTime.js'

const TABLE_2_FIELDS: Array<TABLE_2> = [
  'era',
  'year',
  'month',
  'day',
  'dayPeriod',
  'ampm',
  'hour',
  'minute',
  'second',
  'fractionalSecondDigits',
]

export function PartitionDateTimeRangePattern(
  dtf: Intl.DateTimeFormat,
  x: Decimal,
  y: Decimal,
  implDetails: FormatDateTimePatternImplDetails & ToLocalTimeImplDetails
): IntlDateTimeFormatPart[] {
  x = TimeClip(x)
  if (x.isNaN()) {
    throw new RangeError('Invalid start time')
  }
  y = TimeClip(y)
  if (y.isNaN()) {
    throw new RangeError('Invalid end time')
  }
  /** IMPL START */
  const {getInternalSlots, tzData, localeData} = implDetails
  const internalSlots = getInternalSlots(dtf)
  const dataLocale = internalSlots.dataLocale
  const dataLocaleData = localeData[dataLocale]
  /** IMPL END */
  const tm1 = ToLocalTime(
    x,
    // @ts-ignore
    internalSlots.calendar,
    internalSlots.timeZone,
    {tzData}
  )
  const tm2 = ToLocalTime(
    y,
    // @ts-ignore
    internalSlots.calendar,
    internalSlots.timeZone,
    {tzData}
  )
  const {pattern, rangePatterns} = internalSlots
  let rangePattern
  let dateFieldsPracticallyEqual = true
  let patternContainsLargerDateField = false

  for (const fieldName of TABLE_2_FIELDS) {
    if (dateFieldsPracticallyEqual && !patternContainsLargerDateField) {
      let rp = fieldName in rangePatterns ? rangePatterns[fieldName] : undefined
      if (rangePattern !== undefined && rp === undefined) {
        patternContainsLargerDateField = true
      } else {
        rangePattern = rp
        if (fieldName === 'ampm') {
          let v1 = tm1.hour
          let v2 = tm2.hour
          if ((v1 > 11 && v2 < 11) || (v1 < 11 && v2 > 11)) {
            dateFieldsPracticallyEqual = false
          }
        } else if (fieldName === 'dayPeriod') {
          // TODO
        } else if (fieldName === 'fractionalSecondDigits') {
          let fractionalSecondDigits = internalSlots.fractionalSecondDigits
          if (fractionalSecondDigits === undefined) {
            fractionalSecondDigits = 3
          }
          let v1 = Math.floor(
            tm1.millisecond * 10 ** (fractionalSecondDigits - 3)
          )
          let v2 = Math.floor(
            tm2.millisecond * 10 ** (fractionalSecondDigits - 3)
          )
          if (!SameValue(v1, v2)) {
            dateFieldsPracticallyEqual = false
          }
        } else {
          let v1 = tm1[fieldName]
          let v2 = tm2[fieldName]
          if (!SameValue(v1, v2)) {
            dateFieldsPracticallyEqual = false
          }
        }
      }
    }
  }
  if (dateFieldsPracticallyEqual) {
    let result = FormatDateTimePattern(
      dtf,
      PartitionPattern<IntlDateTimeFormatPartType>(pattern),
      x,
      implDetails
    )
    for (const r of result) {
      r.source = RangePatternType.shared
    }
    return result
  }
  let result: IntlDateTimeFormatPart[] = []
  if (rangePattern === undefined) {
    rangePattern = rangePatterns.default
    /** IMPL DETAILS */
    // If rangePatterns.default is also undefined (e.g., when using dateStyle/timeStyle),
    // create a fallback range pattern using the locale's intervalFormatFallback from CLDR
    //
    // SPEC COMPLIANCE:
    // - ECMA-402: https://tc39.es/ecma402/#sec-partitiondatetimerangepattern
    //   Delegates to CLDR for interval format patterns
    // - Unicode LDML UTS #35 Part 4: Dates: https://unicode-org.github.io/cldr/ldml/tr35-dates.html#intervalFormats
    //   Defines intervalFormatFallback pattern (e.g., "{0} – {1}" or "{1} – {0}")
    //   where {0} is start datetime and {1} is end datetime
    // - ICU4J DateIntervalFormat: Uses setFallbackIntervalPattern() to set locale-specific fallback
    // - Firefox SpiderMonkey & WebKit JSC: Both use ICU's UDateIntervalFormat which reads
    //   intervalFormatFallback from CLDR data internally
    //
    // LOCALE EXAMPLES from CLDR:
    // - English (en): "{0}\u2009–\u2009{1}" (en dash with thin spaces U+2009)
    // - Japanese (ja): "{0}～{1}" (wave dash U+301C, no spaces)
    // - German (de): "{0}\u2009–\u2009{1}" (en dash with thin spaces)
    // - Arabic (ar): "{0}\u2009–\u2009{1}" (en dash with thin spaces)
    //
    // See: https://github.com/formatjs/formatjs/issues/4168
    if (!rangePattern) {
      const fallback = dataLocaleData.intervalFormatFallback
      // Parse the fallback pattern (e.g., "{0} – {1}" for English, "{0}～{1}" for Japanese)
      // to extract the separator between {0} and {1}
      const start0 = fallback.indexOf('{0}')
      const start1 = fallback.indexOf('{1}')
      const separator =
        start0 < start1
          ? fallback.substring(start0 + 3, start1)
          : fallback.substring(start1 + 3, start0)

      rangePattern = {
        patternParts:
          start0 < start1
            ? [
                {source: RangePatternType.startRange, pattern: '{0}'},
                {source: RangePatternType.shared, pattern: separator},
                {source: RangePatternType.endRange, pattern: '{1}'},
              ]
            : [
                {source: RangePatternType.endRange, pattern: '{1}'},
                {source: RangePatternType.shared, pattern: separator},
                {source: RangePatternType.startRange, pattern: '{0}'},
              ],
      }
    }
    // Now we have to replace {0} & {1} with actual pattern
    for (const patternPart of rangePattern.patternParts) {
      if (patternPart.pattern === '{0}' || patternPart.pattern === '{1}') {
        patternPart.pattern = pattern
      }
    }
  }
  for (const rangePatternPart of rangePattern.patternParts) {
    const {source, pattern} = rangePatternPart
    let z
    if (
      source === RangePatternType.startRange ||
      source === RangePatternType.shared
    ) {
      z = x
    } else {
      z = y
    }
    const patternParts = PartitionPattern<IntlDateTimeFormatPartType>(pattern)
    let partResult = FormatDateTimePattern(dtf, patternParts, z, implDetails)
    for (const r of partResult) {
      r.source = source
    }
    result = result.concat(partResult)
  }
  return result
}

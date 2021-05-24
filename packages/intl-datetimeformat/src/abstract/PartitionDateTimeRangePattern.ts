import {
  IntlDateTimeFormatPart,
  IntlDateTimeFormatPartType,
  RangePatternType,
  TABLE_2,
  PartitionPattern,
  SameValue,
  TimeClip,
} from '@formatjs/ecma402-abstract'
import {ToLocalTime, ToLocalTimeImplDetails} from './ToLocalTime'
import {
  FormatDateTimePattern,
  FormatDateTimePatternImplDetails,
} from './FormatDateTimePattern'

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
  x: number,
  y: number,
  implDetails: FormatDateTimePatternImplDetails & ToLocalTimeImplDetails
) {
  x = TimeClip(x)
  if (isNaN(x)) {
    throw new RangeError('Invalid start time')
  }
  y = TimeClip(y)
  if (isNaN(y)) {
    throw new RangeError('Invalid end time')
  }
  /** IMPL START */
  const {getInternalSlots, tzData} = implDetails
  const internalSlots = getInternalSlots(dtf)
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

import {PartitionPattern} from '#packages/ecma402-abstract/PartitionPattern.js'
import {
  type DateTimeFormat,
  type IntlDateTimeFormatPart,
  type IntlDateTimeFormatPartType,
} from '#packages/ecma402-abstract/types/date-time.js'
import {
  HandleDateTimeValue,
  type DateTimeFormattable,
} from '#packages/ecma402-abstract/DateTimeFormat/HandleDateTimeValue.js'
import {
  FormatDateTimePattern,
  type FormatDateTimePatternImplDetails,
} from '#packages/ecma402-abstract/DateTimeFormat/FormatDateTimePattern.js'
import {type ToLocalTimeImplDetails} from '#packages/ecma402-abstract/DateTimeFormat/ToLocalTime.js'

/**
 * https://tc39.es/ecma402/#sec-partitiondatetimepattern
 * @param dtf
 * @param x
 */
export function PartitionDateTimePattern(
  dtf: Intl.DateTimeFormat | DateTimeFormat,
  x: DateTimeFormattable,
  implDetails: ToLocalTimeImplDetails & FormatDateTimePatternImplDetails
): IntlDateTimeFormatPart[] {
  const record = HandleDateTimeValue(implDetails.getInternalSlots(dtf), x)
  const internalSlots = record.format

  const {pattern} = internalSlots
  return FormatDateTimePattern(
    dtf,
    PartitionPattern<IntlDateTimeFormatPartType>(pattern),
    record.epochNanoseconds,
    record.isPlain,
    {...implDetails, getInternalSlots: () => internalSlots}
  )
}

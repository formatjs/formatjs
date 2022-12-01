import {
  DateTimeFormat,
  IntlDateTimeFormatPart,
  IntlDateTimeFormatPartType,
  PartitionPattern,
  TimeClip,
} from '@formatjs/ecma402-abstract'
import {ToLocalTimeImplDetails} from './ToLocalTime'
import {
  FormatDateTimePattern,
  FormatDateTimePatternImplDetails,
} from './FormatDateTimePattern'

/**
 * https://tc39.es/ecma402/#sec-partitiondatetimepattern
 * @param dtf
 * @param x
 */
export function PartitionDateTimePattern(
  dtf: Intl.DateTimeFormat | DateTimeFormat,
  x: number,
  implDetails: ToLocalTimeImplDetails & FormatDateTimePatternImplDetails
): IntlDateTimeFormatPart[] {
  x = TimeClip(x)
  if (isNaN(x)) {
    throw new RangeError('invalid time')
  }

  /** IMPL START */
  const {getInternalSlots} = implDetails
  const internalSlots = getInternalSlots(dtf)
  /** IMPL END */

  const {pattern} = internalSlots
  return FormatDateTimePattern(
    dtf,
    PartitionPattern<IntlDateTimeFormatPartType>(pattern),
    x,
    implDetails
  )
}

import {
  type DateTimeFormat,
  type IntlDateTimeFormatPart,
  type IntlDateTimeFormatPartType,
  invariant,
  PartitionPattern,
  TimeClip,
} from '@formatjs/ecma402-abstract'
import type Decimal from 'decimal.js'
import {
  FormatDateTimePattern,
  type FormatDateTimePatternImplDetails,
} from './FormatDateTimePattern.js'
import {type ToLocalTimeImplDetails} from './ToLocalTime.js'

/**
 * https://tc39.es/ecma402/#sec-partitiondatetimepattern
 * @param dtf
 * @param x
 */
export function PartitionDateTimePattern(
  dtf: Intl.DateTimeFormat | DateTimeFormat,
  x: Decimal,
  implDetails: ToLocalTimeImplDetails & FormatDateTimePatternImplDetails
): IntlDateTimeFormatPart[] {
  x = TimeClip(x)
  invariant(!x.isNaN(), 'Invalid time', RangeError)

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

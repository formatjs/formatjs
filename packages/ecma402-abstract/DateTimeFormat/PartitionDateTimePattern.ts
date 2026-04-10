import {TimeClip} from '#packages/ecma402-abstract/262.js'
import {PartitionPattern} from '#packages/ecma402-abstract/PartitionPattern.js'
import {
  type DateTimeFormat,
  type IntlDateTimeFormatPart,
  type IntlDateTimeFormatPartType,
} from '#packages/ecma402-abstract/types/date-time.js'
import {invariant} from '#packages/ecma402-abstract/utils.js'
import type Decimal from '@formatjs/bigdecimal'
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

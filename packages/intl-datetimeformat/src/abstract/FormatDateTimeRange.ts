import type Decimal from 'decimal.js'
import {type FormatDateTimePatternImplDetails} from './FormatDateTimePattern.js'
import {PartitionDateTimeRangePattern} from './PartitionDateTimeRangePattern.js'
import {type ToLocalTimeImplDetails} from './ToLocalTime.js'

export function FormatDateTimeRange(
  dtf: Intl.DateTimeFormat,
  x: Decimal,
  y: Decimal,
  implDetails: FormatDateTimePatternImplDetails & ToLocalTimeImplDetails
): string {
  const parts = PartitionDateTimeRangePattern(dtf, x, y, implDetails)
  let result = ''
  for (const part of parts) {
    result += part.value
  }
  return result
}

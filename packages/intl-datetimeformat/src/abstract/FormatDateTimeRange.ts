import Decimal from 'decimal.js'
import {FormatDateTimePatternImplDetails} from './FormatDateTimePattern'
import {PartitionDateTimeRangePattern} from './PartitionDateTimeRangePattern'
import {ToLocalTimeImplDetails} from './ToLocalTime'

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

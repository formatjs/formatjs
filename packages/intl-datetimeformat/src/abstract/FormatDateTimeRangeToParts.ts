import {FormatDateTimePatternImplDetails} from './FormatDateTimePattern'
import {PartitionDateTimeRangePattern} from './PartitionDateTimeRangePattern'
import {ToLocalTimeImplDetails} from './ToLocalTime'

export function FormatDateTimeRangeToParts(
  dtf: Intl.DateTimeFormat,
  x: number,
  y: number,
  implDetails: FormatDateTimePatternImplDetails & ToLocalTimeImplDetails
) {
  const parts = PartitionDateTimeRangePattern(dtf, x, y, implDetails)
  const result = new Array(0)
  for (const part of parts) {
    result.push({
      type: part.type,
      value: part.value,
      source: part.source,
    })
  }
  return result
}

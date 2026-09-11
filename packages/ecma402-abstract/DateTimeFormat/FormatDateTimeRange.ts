import type {DateTimeFormattable} from '#packages/ecma402-abstract/DateTimeFormat/HandleDateTimeValue.js'
import {type FormatDateTimePatternImplDetails} from '#packages/ecma402-abstract/DateTimeFormat/FormatDateTimePattern.js'
import {PartitionDateTimeRangePattern} from '#packages/ecma402-abstract/DateTimeFormat/PartitionDateTimeRangePattern.js'
import {type ToLocalTimeImplDetails} from '#packages/ecma402-abstract/DateTimeFormat/ToLocalTime.js'

export function FormatDateTimeRange(
  dtf: Intl.DateTimeFormat,
  x: DateTimeFormattable,
  y: DateTimeFormattable,
  implDetails: FormatDateTimePatternImplDetails & ToLocalTimeImplDetails
): string {
  const parts = PartitionDateTimeRangePattern(dtf, x, y, implDetails)
  let result = ''
  for (const part of parts) {
    result += part.value
  }
  return result
}

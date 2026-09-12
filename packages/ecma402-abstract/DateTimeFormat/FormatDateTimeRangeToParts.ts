import {type IntlDateTimeFormatPart} from '#packages/ecma402-abstract/types/date-time.js'
import type {DateTimeFormattable} from '#packages/ecma402-abstract/DateTimeFormat/HandleDateTimeValue.js'
import {type FormatDateTimePatternImplDetails} from '#packages/ecma402-abstract/DateTimeFormat/FormatDateTimePattern.js'
import {PartitionDateTimeRangePattern} from '#packages/ecma402-abstract/DateTimeFormat/PartitionDateTimeRangePattern.js'
import {type ToLocalTimeImplDetails} from '#packages/ecma402-abstract/DateTimeFormat/ToLocalTime.js'

export function FormatDateTimeRangeToParts(
  dtf: Intl.DateTimeFormat,
  x: DateTimeFormattable,
  y: DateTimeFormattable,
  implDetails: FormatDateTimePatternImplDetails & ToLocalTimeImplDetails
): IntlDateTimeFormatPart[] {
  const parts = PartitionDateTimeRangePattern(dtf, x, y, implDetails)
  const result: IntlDateTimeFormatPart[] = []
  for (const part of parts) {
    result.push({
      type: part.type,
      value: part.value,
      source: part.source,
    })
  }
  return result
}

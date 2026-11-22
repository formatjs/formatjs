import {setDataProperty} from '#packages/ecma262-abstract/intrinsics.js'
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
  // Temporal comparison §15.6.10 steps4–4.e: own type/value/source projection.
  for (let index = 0; index < parts.length; index++) {
    const part = parts[index]
    setDataProperty(result, `${index}`, {
      type: part.type,
      value: part.value,
      source: part.source,
    })
  }
  return result
}

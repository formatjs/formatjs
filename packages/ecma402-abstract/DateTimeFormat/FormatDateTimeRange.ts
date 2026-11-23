import type {DateTimeFormattable} from '#packages/ecma402-abstract/DateTimeFormat/HandleDateTimeValue.js'
import {type FormatDateTimePatternImplDetails} from '#packages/ecma402-abstract/DateTimeFormat/FormatDateTimePattern.js'
import {PartitionDateTimeRangePattern} from '#packages/ecma402-abstract/DateTimeFormat/PartitionDateTimeRangePattern.js'
import {type ToLocalTimeImplDetails} from '#packages/ecma402-abstract/DateTimeFormat/ToLocalTime.js'

// Temporal amendment §15.6.9: format two prepared values as a range.
// https://tc39.es/proposal-temporal/#sec-formatdatetimerange
// ECMA-402 §11.5.9 concatenates the partition values.
// https://tc39.es/ecma402/#sec-formatdatetimerange
export function FormatDateTimeRange(
  dtf: Intl.DateTimeFormat,
  x: DateTimeFormattable,
  y: DateTimeFormattable,
  implDetails: FormatDateTimePatternImplDetails & ToLocalTimeImplDetails
): string {
  const parts = PartitionDateTimeRangePattern(dtf, x, y, implDetails)
  let result = ''
  // Temporal comparison §15.6.9 steps3–3.a: concatenate a private List.
  for (let index = 0; index < parts.length; index++) {
    result += parts[index].value
  }
  return result
}

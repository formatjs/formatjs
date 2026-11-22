import {type DateTimeFormat} from '#packages/ecma402-abstract/types/date-time.js'
import type {DateTimeFormattable} from '#packages/ecma402-abstract/DateTimeFormat/HandleDateTimeValue.js'
import {PartitionDateTimePattern} from '#packages/ecma402-abstract/DateTimeFormat/PartitionDateTimePattern.js'

/**
 * https://tc39.es/ecma402/#sec-formatdatetime
 * @param dtf DateTimeFormat
 * @param x
 */
export function FormatDateTime(
  dtf: Intl.DateTimeFormat | DateTimeFormat,
  x: DateTimeFormattable,
  implDetails: Parameters<typeof PartitionDateTimePattern>[2]
): string {
  const parts = PartitionDateTimePattern(dtf, x, implDetails)
  let result = ''
  // Temporal comparison §15.6.6 steps3–3.a: concatenate a private List.
  for (let index = 0; index < parts.length; index++) {
    result += parts[index].value
  }
  return result
}

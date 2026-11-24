import {type DateTimeFormat} from '#packages/ecma402-abstract/types/date-time.js'
import type {DateTimeFormattable} from '#packages/ecma402-abstract/DateTimeFormat/HandleDateTimeValue.js'
import {PartitionDateTimePattern} from '#packages/ecma402-abstract/DateTimeFormat/PartitionDateTimePattern.js'

// ECMA-402 §11.5.6 step 1 partitions the date. Steps 2–4 join the part values.
// https://tc39.es/ecma402/#sec-formatdatetime
// Temporal §15.6.6 also accepts a prepared Temporal value.
// https://tc39.es/proposal-temporal/#sec-formatdatetime
export function FormatDateTime(
  dtf: Intl.DateTimeFormat | DateTimeFormat,
  x: DateTimeFormattable,
  implDetails: Parameters<typeof PartitionDateTimePattern>[2]
): string {
  const parts = PartitionDateTimePattern(dtf, x, implDetails)
  let result = ''
  for (let index = 0; index < parts.length; index++) {
    result += parts[index].value
  }
  return result
}

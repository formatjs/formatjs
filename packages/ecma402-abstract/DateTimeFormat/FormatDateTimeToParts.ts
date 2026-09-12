import {ArrayCreate} from '#packages/ecma262-abstract/ArrayCreate.js'
import {type IntlDateTimeFormatPart} from '#packages/ecma402-abstract/types/date-time.js'
import type {DateTimeFormattable} from '#packages/ecma402-abstract/DateTimeFormat/HandleDateTimeValue.js'
import {PartitionDateTimePattern} from '#packages/ecma402-abstract/DateTimeFormat/PartitionDateTimePattern.js'

/**
 * https://tc39.es/ecma402/#sec-formatdatetimetoparts
 *
 * @param dtf
 * @param x
 * @param implDetails
 */
export function FormatDateTimeToParts(
  dtf: Intl.DateTimeFormat,
  x: DateTimeFormattable,
  implDetails: Parameters<typeof PartitionDateTimePattern>[2]
): IntlDateTimeFormatPart[] {
  const parts = PartitionDateTimePattern(dtf, x, implDetails)
  const result = ArrayCreate(0) as IntlDateTimeFormatPart[]
  for (const part of parts) {
    result.push({
      type: part.type,
      value: part.value,
    })
  }
  return result
}

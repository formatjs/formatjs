import {type DateTimeFormat} from '#packages/ecma402-abstract/types/date-time.js'
import type Decimal from '@formatjs/bigdecimal'
import {PartitionDateTimePattern} from '#packages/ecma402-abstract/DateTimeFormat/PartitionDateTimePattern.js'

/**
 * https://tc39.es/ecma402/#sec-formatdatetime
 * @param dtf DateTimeFormat
 * @param x
 */
export function FormatDateTime(
  dtf: Intl.DateTimeFormat | DateTimeFormat,
  x: Decimal,
  implDetails: Parameters<typeof PartitionDateTimePattern>[2]
): string {
  const parts = PartitionDateTimePattern(dtf, x, implDetails)
  let result = ''
  for (const part of parts) {
    result += part.value
  }
  return result
}

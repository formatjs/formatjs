import {type DateTimeFormat} from '@formatjs/ecma402-abstract'
import type Decimal from 'decimal.js'
import {PartitionDateTimePattern} from './PartitionDateTimePattern.js'

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

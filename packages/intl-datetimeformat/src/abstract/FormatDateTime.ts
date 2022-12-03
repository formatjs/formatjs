import {DateTimeFormat} from '@formatjs/ecma402-abstract'
import {PartitionDateTimePattern} from './PartitionDateTimePattern'

/**
 * https://tc39.es/ecma402/#sec-formatdatetime
 * @param dtf DateTimeFormat
 * @param x
 */
export function FormatDateTime(
  dtf: Intl.DateTimeFormat | DateTimeFormat,
  x: number,
  implDetails: Parameters<typeof PartitionDateTimePattern>[2]
) {
  const parts = PartitionDateTimePattern(dtf, x, implDetails)
  let result = ''
  for (const part of parts) {
    result += part.value
  }
  return result
}

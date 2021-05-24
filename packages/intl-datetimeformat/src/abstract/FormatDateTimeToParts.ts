import {PartitionDateTimePattern} from './PartitionDateTimePattern'
import {ArrayCreate, IntlDateTimeFormatPart} from '@formatjs/ecma402-abstract'

/**
 * https://tc39.es/ecma402/#sec-formatdatetimetoparts
 *
 * @param dtf
 * @param x
 * @param implDetails
 */
export function FormatDateTimeToParts(
  dtf: Intl.DateTimeFormat,
  x: number,
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

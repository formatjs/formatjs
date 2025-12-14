import {ArrayCreate, IntlDateTimeFormatPart} from '@formatjs/ecma402-abstract'
import Decimal from 'decimal.js'
import {PartitionDateTimePattern} from './PartitionDateTimePattern.js'

/**
 * https://tc39.es/ecma402/#sec-formatdatetimetoparts
 *
 * @param dtf
 * @param x
 * @param implDetails
 */
export function FormatDateTimeToParts(
  dtf: Intl.DateTimeFormat,
  x: Decimal,
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

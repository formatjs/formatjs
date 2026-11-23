import {CreatePartsArray} from '#packages/ecma402-abstract/CreatePartsArray.js'
import {type IntlDateTimeFormatPart} from '#packages/ecma402-abstract/types/date-time.js'
import type {DateTimeFormattable} from '#packages/ecma402-abstract/DateTimeFormat/HandleDateTimeValue.js'
import {PartitionDateTimePattern} from '#packages/ecma402-abstract/DateTimeFormat/PartitionDateTimePattern.js'

/** ECMA-402 §11.5.7. */
// Temporal amendment §15.6.7: project parts from the prepared value.
// https://tc39.es/proposal-temporal/#sec-formatdatetimetoparts
export function FormatDateTimeToParts(
  dtf: Intl.DateTimeFormat,
  x: DateTimeFormattable,
  implDetails: Parameters<typeof PartitionDateTimePattern>[2]
): IntlDateTimeFormatPart[] {
  const parts = PartitionDateTimePattern(dtf, x, implDetails)
  return CreatePartsArray(parts)
}

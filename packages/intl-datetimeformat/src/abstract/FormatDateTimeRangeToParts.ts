import {IntlDateTimeFormatPart} from '@formatjs/ecma402-abstract'
import {Decimal} from 'decimal.js'
import {FormatDateTimePatternImplDetails} from './FormatDateTimePattern.js'
import {PartitionDateTimeRangePattern} from './PartitionDateTimeRangePattern.js'
import {ToLocalTimeImplDetails} from './ToLocalTime.js'

export function FormatDateTimeRangeToParts(
  dtf: Intl.DateTimeFormat,
  x: Decimal,
  y: Decimal,
  implDetails: FormatDateTimePatternImplDetails & ToLocalTimeImplDetails
): IntlDateTimeFormatPart[] {
  const parts = PartitionDateTimeRangePattern(dtf, x, y, implDetails)
  const result: IntlDateTimeFormatPart[] = []
  for (const part of parts) {
    result.push({
      type: part.type,
      value: part.value,
      source: part.source,
    })
  }
  return result
}

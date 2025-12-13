import {IntlDateTimeFormatPart} from '@formatjs/ecma402-abstract'
import {Decimal} from 'decimal.js'
import {FormatDateTimePatternImplDetails} from './FormatDateTimePattern'
import {PartitionDateTimeRangePattern} from './PartitionDateTimeRangePattern'
import {ToLocalTimeImplDetails} from './ToLocalTime'

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

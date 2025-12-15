import {Decimal} from 'decimal.js'
import {NumberFormatInternal} from '../types/number.js'
import {PartitionNumberRangePattern} from './PartitionNumberRangePattern.js'

/**
 * https://tc39.es/ecma402/#sec-formatnumericrange
 */
export function FormatNumericRange(
  numberFormat: Intl.NumberFormat,
  x: Decimal,
  y: Decimal,
  {
    getInternalSlots,
  }: {
    getInternalSlots(nf: Intl.NumberFormat): NumberFormatInternal
  }
): string {
  const parts = PartitionNumberRangePattern(numberFormat, x, y, {
    getInternalSlots,
  })

  return parts.map(part => part.value).join('')
}

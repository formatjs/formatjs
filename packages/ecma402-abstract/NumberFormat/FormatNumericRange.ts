import {NumberFormatInternal} from '../types/number'
import {PartitionNumberRangePattern} from './PartitionNumberRangePattern'

/**
 * https://tc39.es/ecma402/#sec-formatnumericrange
 */
export function FormatNumericRange(
  numberFormat: Intl.NumberFormat,
  x: number,
  y: number,
  {
    getInternalSlots,
  }: {
    getInternalSlots(nf: Intl.NumberFormat): NumberFormatInternal
  }
) {
  const parts = PartitionNumberRangePattern(numberFormat, x, y, {
    getInternalSlots,
  })

  return parts.map(part => part.value).join('')
}

import {NumberFormatInternal, NumberRangeToParts} from '../types/number'
import {PartitionNumberRangePattern} from './PartitionNumberRangePattern'

/**
 * https://tc39.es/ecma402/#sec-formatnumericrangetoparts
 */
export function FormatNumericRangeToParts(
  numberFormat: Intl.NumberFormat,
  x: number,
  y: number,
  {
    getInternalSlots,
  }: {
    getInternalSlots(nf: Intl.NumberFormat): NumberFormatInternal
  }
): NumberRangeToParts[] {
  const parts = PartitionNumberRangePattern(numberFormat, x, y, {
    getInternalSlots,
  })

  return parts.map((part, index) => ({
    type: part.type,
    value: part.value,
    source: part.source,
    result: index.toString(),
  }))
}

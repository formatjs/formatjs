import type {Decimal} from 'decimal.js'
import {
  type NumberFormatInternal,
  type NumberRangeToParts,
} from '../types/number.js'
import {PartitionNumberRangePattern} from './PartitionNumberRangePattern.js'

/**
 * https://tc39.es/ecma402/#sec-formatnumericrangetoparts
 */
export function FormatNumericRangeToParts(
  numberFormat: Intl.NumberFormat,
  x: Decimal,
  y: Decimal,
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

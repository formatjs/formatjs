import type {Decimal} from '@formatjs/bigdecimal'
import {
  type NumberFormatInternal,
  type NumberRangeToParts,
} from '#packages/ecma402-abstract/types/number.js'
import {PartitionNumberRangePattern} from '#packages/ecma402-abstract/NumberFormat/PartitionNumberRangePattern.js'

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

  // ECMA-402 §16.5.23 steps 4.b–4.d create only type, value, and source.
  // https://tc39.es/ecma402/#sec-formatnumericrangetoparts
  // https://github.com/tc39/ecma402/blob/b1c961988b9a07894b1dc3dc2b5626ea48387d61/spec/numberformat.html#L1920-L1922
  return parts.map(part => ({
    type: part.type,
    value: part.value,
    source: part.source,
  }))
}

import type {IntlMathematicalValue} from '#packages/ecma402-abstract/ToIntlMathematicalValue.js'
import type {Decimal} from '@formatjs/bigdecimal'
import {
  type NumberFormatInternal,
  type NumberRangeToParts,
} from '#packages/ecma402-abstract/types/number.js'
import {PartitionNumberRangePattern} from '#packages/ecma402-abstract/NumberFormat/PartitionNumberRangePattern.js'
import {setDataProperty} from '#packages/ecma262-abstract/intrinsics.js'

/**
 * https://tc39.es/ecma402/#sec-formatnumericrangetoparts
 */
export function FormatNumericRangeToParts(
  numberFormat: Intl.NumberFormat,
  x: Decimal | IntlMathematicalValue,
  y: Decimal | IntlMathematicalValue,
  {
    getInternalSlots,
  }: {
    getInternalSlots(nf: Intl.NumberFormat): NumberFormatInternal
  }
): NumberRangeToParts[] {
  const parts = PartitionNumberRangePattern(numberFormat, x, y, {
    getInternalSlots,
  })

  // ECMA-402 §16.5.22 steps 4.b–4.d create only type, value, and source.
  // https://tc39.es/ecma402/#sec-formatnumericrangetoparts
  const result: NumberRangeToParts[] = []
  for (let index = 0; index < parts.length; index++) {
    const {type, value, source} = parts[index]
    setDataProperty(result, index, {type, value, source})
  }
  return result
}

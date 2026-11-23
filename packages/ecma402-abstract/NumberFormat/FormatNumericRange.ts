import type {IntlMathematicalValue} from '#packages/ecma402-abstract/ToIntlMathematicalValue.js'
import type {Decimal} from '@formatjs/bigdecimal'
import {type NumberFormatInternal} from '#packages/ecma402-abstract/types/number.js'
import {PartitionNumberRangePattern} from '#packages/ecma402-abstract/NumberFormat/PartitionNumberRangePattern.js'
import {joinNumberParts} from '#packages/ecma402-abstract/NumberFormat/FormatNumeric.js'

/**
 * https://tc39.es/ecma402/#sec-formatnumericrange
 */
export function FormatNumericRange(
  numberFormat: Intl.NumberFormat,
  x: Decimal | IntlMathematicalValue,
  y: Decimal | IntlMathematicalValue,
  {
    getInternalSlots,
  }: {
    getInternalSlots(nf: Intl.NumberFormat): NumberFormatInternal
  }
): string {
  const parts = PartitionNumberRangePattern(numberFormat, x, y, {
    getInternalSlots,
  })

  // ECMA-402 §16.5.21 steps 2–4 join the private list in order.
  return joinNumberParts(parts)
}

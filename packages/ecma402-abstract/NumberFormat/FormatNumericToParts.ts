import type {IntlMathematicalValue} from '#packages/ecma402-abstract/ToIntlMathematicalValue.js'
import type {Decimal} from '@formatjs/bigdecimal'
import {CreatePartsArray} from '#packages/ecma402-abstract/CreatePartsArray.js'
import {
  type NumberFormatInternal,
  type NumberFormatPart,
} from '#packages/ecma402-abstract/types/number.js'
import {PartitionNumberPattern} from '#packages/ecma402-abstract/NumberFormat/PartitionNumberPattern.js'

/** ECMA-402 §16.5.6. */
export function FormatNumericToParts(
  nf: Intl.NumberFormat,
  x: Decimal | IntlMathematicalValue,
  implDetails: {
    getInternalSlots(nf: Intl.NumberFormat): NumberFormatInternal
  }
): NumberFormatPart[] {
  const parts = PartitionNumberPattern(implDetails.getInternalSlots(nf), x)
  return CreatePartsArray(parts)
}

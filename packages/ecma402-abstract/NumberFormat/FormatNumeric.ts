import type {Decimal} from '@formatjs/bigdecimal'
import {type NumberFormatInternal} from '#packages/ecma402-abstract/types/number.js'
import {PartitionNumberPattern} from '#packages/ecma402-abstract/NumberFormat/PartitionNumberPattern.js'

export function FormatNumeric(
  internalSlots: NumberFormatInternal,
  x: Decimal
): string {
  const parts = PartitionNumberPattern(internalSlots, x)
  return parts.map(p => p.value).join('')
}

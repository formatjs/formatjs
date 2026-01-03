import type {Decimal} from 'decimal.js'
import {type NumberFormatInternal} from '../types/number.js'
import {PartitionNumberPattern} from './PartitionNumberPattern.js'

export function FormatNumeric(
  internalSlots: NumberFormatInternal,
  x: Decimal
): string {
  const parts = PartitionNumberPattern(internalSlots, x)
  return parts.map(p => p.value).join('')
}

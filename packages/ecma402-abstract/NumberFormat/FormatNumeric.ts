import Decimal from 'decimal.js'
import {NumberFormatInternal} from '../types/number'
import {PartitionNumberPattern} from './PartitionNumberPattern'

export function FormatNumeric(
  internalSlots: NumberFormatInternal,
  x: Decimal
): string {
  const parts = PartitionNumberPattern(internalSlots, x)
  return parts.map(p => p.value).join('')
}

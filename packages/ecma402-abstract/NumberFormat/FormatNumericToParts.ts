import type {Decimal} from 'decimal.js'
import {ArrayCreate} from '../262.js'
import {
  type NumberFormatInternal,
  type NumberFormatPart,
} from '../types/number.js'
import {PartitionNumberPattern} from './PartitionNumberPattern.js'

export function FormatNumericToParts(
  nf: Intl.NumberFormat,
  x: Decimal,
  implDetails: {
    getInternalSlots(nf: Intl.NumberFormat): NumberFormatInternal
  }
): NumberFormatPart[] {
  const parts = PartitionNumberPattern(implDetails.getInternalSlots(nf), x)
  const result = ArrayCreate(0) as NumberFormatPart[]

  for (const part of parts) {
    result.push({
      type: part.type,
      value: part.value,
    })
  }
  return result
}

import Decimal from 'decimal.js'
import {ArrayCreate} from '../262'
import {NumberFormatInternal, NumberFormatPart} from '../types/number'
import {PartitionNumberPattern} from './PartitionNumberPattern'

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

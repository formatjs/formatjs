import {PartitionNumberPattern} from './PartitionNumberPattern';
import {ArrayCreate} from '../../262';
import {NumberFormatInternal, NumberFormatPart} from '../../types/number';

export function FormatNumericToParts(
  nf: Intl.NumberFormat,
  x: number,
  implDetails: {
    getInternalSlots(nf: Intl.NumberFormat): NumberFormatInternal;
  }
): NumberFormatPart[] {
  const parts = PartitionNumberPattern(nf, x, implDetails);
  const result = ArrayCreate(0) as NumberFormatPart[];

  for (const part of parts) {
    result.push({
      type: part.type,
      value: part.value,
    });
  }
  return result;
}

import {PartitionNumberPattern} from './PartitionNumberPattern';
import ArrayCreate from 'es-abstract/2015/ArrayCreate';
import {NumberFormatInternal, NumberFormatPart} from '../../types/number';
import CreateDataPropertyOrThrow from 'es-abstract/2019/CreateDataPropertyOrThrow';
import ToString from 'es-abstract/2019/ToString';

export function FormatNumericToParts(
  nf: Intl.NumberFormat,
  x: number,
  implDetails: {
    getInternalSlots(nf: Intl.NumberFormat): NumberFormatInternal;
  }
): NumberFormatPart[] {
  const parts = PartitionNumberPattern(nf, x, implDetails);
  const result = ArrayCreate(0) as NumberFormatPart[];
  let n = 0;
  for (const part of parts) {
    const o = {};
    CreateDataPropertyOrThrow(o, 'type', part.type);
    CreateDataPropertyOrThrow(o, 'value', part.value);
    CreateDataPropertyOrThrow(result, ToString(n), o);
    n++;
  }
  return result;
}

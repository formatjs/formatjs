import {
  RelativeTimeFormat,
  RelativeTimeFormattableUnit,
  RelativeTimePart,
  RelativeTimeFormatInternal,
} from '../../types/relative-time';
import {PartitionRelativeTimePattern} from './PartitionRelativeTimePattern';
import ArrayCreate from 'es-abstract/2019/ArrayCreate';
import CreateDataPropertyOrThrow from 'es-abstract/2019/CreateDataPropertyOrThrow';
import ToString from 'es-abstract/2019/ToString';

export function FormatRelativeTimeToParts(
  rtf: RelativeTimeFormat,
  value: number,
  unit: RelativeTimeFormattableUnit,
  implDetails: {
    getInternalSlots(rtf: RelativeTimeFormat): RelativeTimeFormatInternal;
  }
): RelativeTimePart[] {
  const parts = PartitionRelativeTimePattern(rtf, value, unit, implDetails);
  const result = ArrayCreate(0) as RelativeTimePart[];
  let n = 0;
  for (const part of parts) {
    const o = {};
    CreateDataPropertyOrThrow(o, 'type', part.type);
    CreateDataPropertyOrThrow(o, 'value', part.value);
    if ('unit' in part) {
      CreateDataPropertyOrThrow(o, 'unit', part.unit);
    }
    CreateDataPropertyOrThrow(result, ToString(n), o);
    n++;
  }
  return result;
}

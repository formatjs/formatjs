import {
  RelativeTimeFormat,
  RelativeTimeFormattableUnit,
  RelativeTimePart,
  RelativeTimeFormatInternal,
  RelativeTimeFormatNumberPart,
} from '../types/relative-time';
import {PartitionRelativeTimePattern} from './PartitionRelativeTimePattern';
import {ArrayCreate} from '../262';

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

  for (const part of parts) {
    const o = {
      type: part.type,
      value: part.value,
    } as RelativeTimePart;
    if ('unit' in part) {
      (o as RelativeTimeFormatNumberPart).unit = part.unit;
    }
    result.push(o);
  }
  return result;
}

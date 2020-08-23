import {
  RelativeTimeFormat,
  RelativeTimeFormattableUnit,
  RelativeTimeFormatInternal,
} from '../../types/relative-time';
import {PartitionRelativeTimePattern} from './PartitionRelativeTimePattern';

export function FormatRelativeTime(
  rtf: RelativeTimeFormat,
  value: number,
  unit: RelativeTimeFormattableUnit,
  implDetails: {
    getInternalSlots(rtf: RelativeTimeFormat): RelativeTimeFormatInternal;
  }
): string {
  const parts = PartitionRelativeTimePattern(rtf, value, unit, implDetails);
  let result = '';
  for (const part of parts) {
    result += part.value;
  }
  return result;
}

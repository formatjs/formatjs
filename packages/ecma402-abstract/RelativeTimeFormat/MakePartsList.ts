import {RelativeTimeUnit, RelativeTimePart} from '../types/relative-time';
import {PartitionPattern} from '../PartitionPattern';
import {invariant} from '../utils';

export function MakePartsList(
  pattern: string,
  unit: RelativeTimeUnit,
  parts: Intl.NumberFormatPart[]
) {
  const patternParts = PartitionPattern(pattern);
  const result: RelativeTimePart[] = [];
  for (const patternPart of patternParts) {
    if (patternPart.type === 'literal') {
      result.push({
        type: 'literal',
        value: patternPart.value!,
      });
    } else {
      invariant(patternPart.type === '0', `Malformed pattern ${pattern}`);
      for (const part of parts) {
        result.push({
          type: part.type,
          value: part.value,
          unit,
        });
      }
    }
  }
  return result;
}

import {PartitionPattern} from '../PartitionPattern';
import {invariant} from '../utils';

export function MakePartsList(
  pattern: string,
  unit: Intl.RelativeTimeFormatUnit,
  parts: Intl.NumberFormatPart[] | Intl.RelativeTimeFormatPart[]
) {
  const patternParts = PartitionPattern(pattern);
  const result: Intl.RelativeTimeFormatPart[] = [];
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

import {RelativeTimeFormatInternal} from '@formatjs/ecma402-abstract'
import {PartitionRelativeTimePattern} from './PartitionRelativeTimePattern'

export function FormatRelativeTime(
  rtf: Intl.RelativeTimeFormat,
  value: number,
  unit: Intl.RelativeTimeFormatUnit,
  implDetails: {
    getInternalSlots(rtf: Intl.RelativeTimeFormat): RelativeTimeFormatInternal
  }
): string {
  const parts = PartitionRelativeTimePattern(rtf, value, unit, implDetails)
  let result = ''
  for (const part of parts) {
    result += part.value
  }
  return result
}

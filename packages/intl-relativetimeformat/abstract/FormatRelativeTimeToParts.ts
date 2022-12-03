import {RelativeTimeFormatInternal} from '@formatjs/ecma402-abstract'
import {PartitionRelativeTimePattern} from './PartitionRelativeTimePattern'

export function FormatRelativeTimeToParts(
  rtf: Intl.RelativeTimeFormat,
  value: number,
  unit: Intl.RelativeTimeFormatUnit,
  implDetails: {
    getInternalSlots(rtf: Intl.RelativeTimeFormat): RelativeTimeFormatInternal
  }
): Intl.RelativeTimeFormatPart[] {
  return PartitionRelativeTimePattern(rtf, value, unit, implDetails)
}

import {type RelativeTimeFormatInternal} from '#packages/ecma402-abstract/types/relative-time.js'
import {PartitionRelativeTimePattern} from './PartitionRelativeTimePattern.js'

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

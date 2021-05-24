import {
  ArrayCreate,
  RelativeTimeFormatInternal,
} from '@formatjs/ecma402-abstract'
import {PartitionRelativeTimePattern} from './PartitionRelativeTimePattern'

export function FormatRelativeTimeToParts(
  rtf: Intl.RelativeTimeFormat,
  value: number,
  unit: Intl.RelativeTimeFormatUnit,
  implDetails: {
    getInternalSlots(rtf: Intl.RelativeTimeFormat): RelativeTimeFormatInternal
  }
): Intl.RelativeTimeFormatPart[] {
  const parts = PartitionRelativeTimePattern(rtf, value, unit, implDetails)
  const result = ArrayCreate(0) as Intl.RelativeTimeFormatPart[]

  for (const part of parts) {
    const o = {
      type: part.type,
      value: part.value,
    } as Intl.RelativeTimeFormatPart
    if ('unit' in part) {
      o.unit = part.unit
    }
    result.push(o)
  }
  return result
}

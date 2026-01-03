// Type-only circular import
// eslint-disable-next-line import/no-cycle

import {type RelativeTimeFormatInternal} from '@formatjs/ecma402-abstract'

const internalSlotMap = new WeakMap<
  Intl.RelativeTimeFormat,
  RelativeTimeFormatInternal
>()

export default function getInternalSlots(
  x: Intl.RelativeTimeFormat
): RelativeTimeFormatInternal {
  let internalSlots = internalSlotMap.get(x)
  if (!internalSlots) {
    internalSlots = Object.create(null) as RelativeTimeFormatInternal
    internalSlotMap.set(x, internalSlots)
  }
  return internalSlots
}

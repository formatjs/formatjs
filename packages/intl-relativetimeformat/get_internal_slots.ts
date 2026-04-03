// Type-only circular import
// eslint-disable-next-line import/no-cycle

import {type RelativeTimeFormatInternal} from '#packages/ecma402-abstract/types/relative-time.js'

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

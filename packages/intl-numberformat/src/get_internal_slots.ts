// Type-only circular import

import {type NumberFormatInternal} from '#packages/ecma402-abstract/types/number.js'

const internalSlotMap = new WeakMap<Intl.NumberFormat, NumberFormatInternal>()

export default function getInternalSlots(
  x: Intl.NumberFormat
): NumberFormatInternal {
  let internalSlots = internalSlotMap.get(x)
  if (!internalSlots) {
    internalSlots = Object.create(null) as NumberFormatInternal
    internalSlotMap.set(x, internalSlots)
  }
  return internalSlots
}

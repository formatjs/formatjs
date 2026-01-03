// Type-only circular import
// eslint-disable-next-line import/no-cycle

import {
  type DateTimeFormat,
  type IntlDateTimeFormatInternal,
} from '@formatjs/ecma402-abstract'

const internalSlotMap = new WeakMap<
  DateTimeFormat,
  IntlDateTimeFormatInternal
>()

export default function getInternalSlots(
  x: DateTimeFormat
): IntlDateTimeFormatInternal {
  let internalSlots = internalSlotMap.get(x)
  if (!internalSlots) {
    internalSlots = Object.create(null) as IntlDateTimeFormatInternal
    internalSlotMap.set(x, internalSlots)
  }
  return internalSlots
}

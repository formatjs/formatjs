// Type-only circular import
// eslint-disable-next-line import/no-cycle

import {
  type DateTimeFormat,
  type IntlDateTimeFormatInternal,
} from '#packages/ecma402-abstract/types/date-time.js'

const internalSlotMap = new WeakMap<
  DateTimeFormat | Intl.DateTimeFormat,
  IntlDateTimeFormatInternal
>()

export default function getInternalSlots(
  x: DateTimeFormat | Intl.DateTimeFormat,
  initialize = false
): IntlDateTimeFormatInternal {
  let internalSlots = internalSlotMap.get(x)
  if (!internalSlots && initialize) {
    internalSlots = Object.create(null) as IntlDateTimeFormatInternal
    internalSlotMap.set(x, internalSlots)
  }
  // ECMA-402 §11.3.3, step 3: require the receiver's internal brand.
  // Only constructor initialization may allocate slots.
  // https://tc39.es/ecma402/#sec-intl.datetimeformat.prototype.format
  // https://github.com/tc39/ecma402/blob/b1c961988b9a07894b1dc3dc2b5626ea48387d61/spec/datetimeformat.html#L1033-L1037
  if (!internalSlots) {
    throw new TypeError('Receiver is not an initialized Intl.DateTimeFormat')
  }
  return internalSlots
}

// Type-only circular import

import {type NumberFormatInternal} from '#packages/ecma402-abstract/types/number.js'

const internalSlotMap = new WeakMap<Intl.NumberFormat, NumberFormatInternal>()

export default function getInternalSlots(
  x: Intl.NumberFormat,
  initialize = false
): NumberFormatInternal {
  let internalSlots = internalSlotMap.get(x)
  if (!internalSlots && initialize) {
    internalSlots = Object.create(null) as NumberFormatInternal
    internalSlotMap.set(x, internalSlots)
  }
  // ECMA-402 §16.3.3 step 3: require the receiver's internal brand.
  // https://tc39.es/ecma402/#sec-intl.numberformat.prototype.format
  // https://github.com/tc39/ecma402/blob/b1c961988b9a07894b1dc3dc2b5626ea48387d61/spec/numberformat.html#L438-L441
  if (!internalSlots) {
    throw new TypeError('Receiver is not an initialized Intl.NumberFormat')
  }
  return internalSlots
}

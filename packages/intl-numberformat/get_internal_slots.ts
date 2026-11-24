// Type-only circular import

import {type NumberFormatInternal} from '#packages/ecma402-abstract/types/number.js'
import {TypeErrorConstructor} from '#packages/ecma262-abstract/intrinsics.js'

// ECMA-402 §16.4 https://tc39.es/ecma402/#sec-properties-of-intl-numberformat-instances
const internalSlotMap = new WeakMap<object, NumberFormatInternal>()
const readInternalSlots = internalSlotMap.get.bind(internalSlotMap)
const writeInternalSlots = internalSlotMap.set.bind(internalSlotMap)
const containsInternalSlots = internalSlotMap.has.bind(internalSlotMap)
const createSlots = Object.create

export default function getInternalSlots(
  x: object,
  initialize = false
): NumberFormatInternal {
  let internalSlots = readInternalSlots(x)
  if (!internalSlots && initialize) {
    internalSlots = createSlots(null) as NumberFormatInternal
    writeInternalSlots(x, internalSlots)
  }
  // ECMA-402 §16.3.3 step 3: require the receiver's internal brand.
  // https://tc39.es/ecma402/#sec-intl.numberformat.prototype.format
  if (!internalSlots) {
    throw new TypeErrorConstructor(
      'Receiver is not an initialized Intl.NumberFormat'
    )
  }
  return internalSlots
}

export function hasInternalSlots(x: unknown): x is Intl.NumberFormat {
  return containsInternalSlots(x as Intl.NumberFormat)
}

// Type-only circular import
// eslint-disable-next-line import/no-cycle

import type Locale from '#packages/intl-locale/index.js'
import {type IntlLocaleInternal} from '#packages/intl-locale/index.js'
import {TypeErrorConstructor} from '#packages/ecma262-abstract/intrinsics.js'

const internalSlotMap = new WeakMap<Locale, IntlLocaleInternal>()
const readSlots = internalSlotMap.get.bind(internalSlotMap)
const writeSlots = internalSlotMap.set.bind(internalSlotMap)
const createSlots = Object.create

// Non-mutating brand probe for the Locale constructor's tag argument.
// ECMA-402 §15.1.1, step 8.
// https://tc39.es/ecma402/#sec-Intl.Locale
export function getInternalSlotsIfPresent(
  x: Locale
): IntlLocaleInternal | undefined {
  return readSlots(x)
}

export default function getInternalSlots(
  x: Locale,
  initialize = false
): IntlLocaleInternal {
  let internalSlots = readSlots(x)
  if (!internalSlots) {
    // Locale accessors require the internal brand; reading must not create it.
    // ECMA-402 §15.3.3, step 2 (also required by the other Locale accessors).
    // https://tc39.es/ecma402/#sec-Intl.Locale.prototype.calendar
    if (!initialize) {
      throw new TypeErrorConstructor(
        'Intl.Locale method called on incompatible receiver'
      )
    }
    internalSlots = createSlots(null) as IntlLocaleInternal
    writeSlots(x, internalSlots)
  }
  return internalSlots
}

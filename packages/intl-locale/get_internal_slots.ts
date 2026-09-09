// Type-only circular import
// eslint-disable-next-line import/no-cycle

import type Locale from '#packages/intl-locale/index.js'
import {type IntlLocaleInternal} from '#packages/intl-locale/index.js'

const internalSlotMap = new WeakMap<Locale, IntlLocaleInternal>()

// Non-mutating brand probe for the Locale constructor's tag argument.
// ECMA-402 §15.1.1, step 8.
// https://tc39.es/ecma402/#sec-Intl.Locale
// https://github.com/tc39/ecma402/blob/b1c961988b9a07894b1dc3dc2b5626ea48387d61/spec/locale.html#L28-L31
export function getInternalSlotsIfPresent(
  x: Locale
): IntlLocaleInternal | undefined {
  return internalSlotMap.get(x)
}

export default function getInternalSlots(
  x: Locale,
  internalSlotsList?: string[]
): IntlLocaleInternal {
  let internalSlots = internalSlotMap.get(x)
  if (!internalSlots) {
    // Locale accessors require the internal brand; reading must not create it.
    // ECMA-402 §15.3.3, step 2 (also required by the other Locale accessors).
    // https://tc39.es/ecma402/#sec-Intl.Locale.prototype.calendar
    // https://github.com/tc39/ecma402/blob/b1c961988b9a07894b1dc3dc2b5626ea48387d61/spec/locale.html#L221-L223
    if (internalSlotsList === undefined) {
      throw new TypeError('Intl.Locale method called on incompatible receiver')
    }
    internalSlots = Object.create(
      null,
      internalSlotsList.reduce<PropertyDescriptorMap>((all, prop) => {
        all[prop] = {
          enumerable: false,
          writable: true,
          configurable: true,
        }
        return all
      }, {})
    ) as IntlLocaleInternal
    internalSlotMap.set(x, internalSlots)
  }
  return internalSlots
}

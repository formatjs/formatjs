// Type-only circular import
// eslint-disable-next-line import/no-cycle

import type Locale from './index.js'
import {type IntlLocaleInternal} from './index.js'

const internalSlotMap = new WeakMap<Locale, IntlLocaleInternal>()

export default function getInternalSlots(
  x: Locale,
  internalSlotsList: string[] = []
): IntlLocaleInternal {
  let internalSlots = internalSlotMap.get(x)
  if (!internalSlots) {
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

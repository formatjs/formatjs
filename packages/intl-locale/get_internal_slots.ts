// Type-only circular import
// eslint-disable-next-line import/no-cycle

import Locale, {IntlLocaleInternal} from '.';

const internalSlotMap = new WeakMap<Locale, IntlLocaleInternal>();

export default function getInternalSlots(x: Locale): IntlLocaleInternal {
  let internalSlots = internalSlotMap.get(x);
  if (!internalSlots) {
    internalSlots = Object.create(null) as IntlLocaleInternal;
    internalSlotMap.set(x, internalSlots);
  }
  return internalSlots;
}

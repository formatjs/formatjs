// Type-only circular import
// eslint-disable-next-line import/no-cycle

import {
  RelativeTimeFormat,
  RelativeTimeFormatInternal,
} from '@formatjs/ecma402-abstract';

const internalSlotMap = new WeakMap<
  RelativeTimeFormat,
  RelativeTimeFormatInternal
>();

export default function getInternalSlots(
  x: RelativeTimeFormat
): RelativeTimeFormatInternal {
  let internalSlots = internalSlotMap.get(x);
  if (!internalSlots) {
    internalSlots = Object.create(null) as RelativeTimeFormatInternal;
    internalSlotMap.set(x, internalSlots);
  }
  return internalSlots;
}

// Type-only circular import
// eslint-disable-next-line import/no-cycle
import {NumberFormat} from '.';
import {NumberFormatInternal} from './types';

const internalSlotMap = new WeakMap<NumberFormat, NumberFormatInternal>();

export default function getInternalSlots(
  x: NumberFormat
): NumberFormatInternal {
  let internalSlots = internalSlotMap.get(x);
  if (!internalSlots) {
    internalSlots = Object.create(null) as NumberFormatInternal;
    internalSlotMap.set(x, internalSlots);
  }
  return internalSlots;
}

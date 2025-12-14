// Type-only circular import
// eslint-disable-next-line import/no-cycle
import type {DurationFormat, IntlDurationFormatInternal} from './types.js'

const internalSlotMap = new WeakMap<
  DurationFormat,
  IntlDurationFormatInternal
>()

export function getInternalSlots(
  x: DurationFormat
): IntlDurationFormatInternal {
  let internalSlots = internalSlotMap.get(x)
  if (!internalSlots) {
    internalSlots = Object.create(null) as IntlDurationFormatInternal
    internalSlotMap.set(x, internalSlots)
  }
  return internalSlots
}

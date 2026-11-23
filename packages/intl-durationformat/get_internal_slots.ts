// Type-only circular import
// eslint-disable-next-line import/no-cycle
import type {
  DurationFormat,
  IntlDurationFormatInternal,
} from '#packages/intl-durationformat/types.js'

const internalSlotMap = new WeakMap<
  DurationFormat,
  IntlDurationFormatInternal
>()

// Temporal comparison §§15.10.1–2 steps2,4: access private slots with captured intrinsics.
// https://tc39.es/proposal-temporal/#sec-Intl.DurationFormat.prototype.format
const getSlots = internalSlotMap.get.bind(internalSlotMap)
const setSlots = internalSlotMap.set.bind(internalSlotMap)
const createSlots = Object.create

export function getInternalSlots(
  x: DurationFormat
): IntlDurationFormatInternal {
  let internalSlots = getSlots(x)
  if (!internalSlots) {
    internalSlots = createSlots(null) as IntlDurationFormatInternal
    setSlots(x, internalSlots)
  }
  return internalSlots
}

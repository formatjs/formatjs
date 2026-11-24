// Type-only circular import
// eslint-disable-next-line import/no-cycle
import type {
  DurationFormat,
  IntlDurationFormatInternal,
} from '#packages/intl-durationformat/types.js'
import {TypeErrorConstructor} from '#packages/ecma262-abstract/intrinsics.js'

const internalSlotMap = new WeakMap<
  DurationFormat,
  IntlDurationFormatInternal
>()

// ECMA-402 §13.4: access private instance slots with captured intrinsics.
// https://tc39.es/ecma402/#sec-properties-of-intl-durationformat-instances
const getSlots = internalSlotMap.get.bind(internalSlotMap)
const setSlots = internalSlotMap.set.bind(internalSlotMap)
const createSlots = Object.create

// ECMA-402 §13.3.2–13.3.4 step 2 requires [[InitializedDurationFormat]].
// https://tc39.es/ecma262/#sec-requireinternalslot
export function requireInternalSlots(
  x: DurationFormat
): IntlDurationFormatInternal {
  const slots = getSlots(x)
  if (!slots?.initializedDurationFormat) {
    throw new TypeErrorConstructor('Incompatible Intl.DurationFormat receiver')
  }
  return slots
}

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

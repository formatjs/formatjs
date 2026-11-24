// Type-only circular import
// eslint-disable-next-line import/no-cycle

import {TypeErrorConstructor} from '#packages/ecma262-abstract/intrinsics.js'
import {type RelativeTimeFormatInternal} from '#packages/ecma402-abstract/types/relative-time.js'

// ECMA-402 §18.4: each initialized instance owns its formatting state.
// https://tc39.es/ecma402/#sec-properties-of-intl-relativetimeformat-instances
const internalSlotMap = new WeakMap<
  Intl.RelativeTimeFormat,
  RelativeTimeFormatInternal
>()
const readSlots = WeakMap.prototype.get.bind(internalSlotMap)
const writeSlots = WeakMap.prototype.set.bind(internalSlotMap)

// ECMA-402 §18.3.2–18.3.4 step 2 checks [[InitializedRelativeTimeFormat]].
// https://tc39.es/ecma262/#sec-requireinternalslot
export function requireInternalSlots(
  receiver: Intl.RelativeTimeFormat
): RelativeTimeFormatInternal {
  const slots = readSlots(receiver)
  if (!slots?.initializedRelativeTimeFormat) {
    throw new TypeErrorConstructor(
      'Incompatible Intl.RelativeTimeFormat receiver'
    )
  }
  return slots
}

export default function getInternalSlots(
  x: Intl.RelativeTimeFormat
): RelativeTimeFormatInternal {
  let internalSlots = readSlots(x)
  if (!internalSlots) {
    internalSlots = Object.create(null) as RelativeTimeFormatInternal
    writeSlots(x, internalSlots)
  }
  return internalSlots
}

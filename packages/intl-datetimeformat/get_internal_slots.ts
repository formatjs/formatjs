import {TypeErrorConstructor} from '#packages/ecma262-abstract/intrinsics.js'
import {
  type DateTimeFormat,
  type IntlDateTimeFormatInternal,
} from '#packages/ecma402-abstract/types/date-time.js'

const internalSlotMap = new WeakMap<
  DateTimeFormat | Intl.DateTimeFormat,
  IntlDateTimeFormatInternal
>()
const readInternalSlots = internalSlotMap.get.bind(internalSlotMap)
const writeInternalSlots = internalSlotMap.set.bind(internalSlotMap)
const createObject = Object.create

export default function getInternalSlots(
  x: DateTimeFormat | Intl.DateTimeFormat,
  initialize = false
): IntlDateTimeFormatInternal {
  let internalSlots = readInternalSlots(x)
  if (!internalSlots && initialize) {
    // Temporal §15.4.1 step 1 allocates private formatter slots.
    // https://tc39.es/proposal-temporal/#sec-createdatetimeformat
    internalSlots = createObject(null) as IntlDateTimeFormatInternal
    writeInternalSlots(x, internalSlots)
  }
  // ECMA-262 §10.1.15 steps 1–2 reject receivers without the required slot.
  // https://tc39.es/ecma262/#sec-requireinternalslot
  if (!internalSlots) {
    throw new TypeErrorConstructor(
      'Receiver is not an initialized Intl.DateTimeFormat'
    )
  }
  return internalSlots
}

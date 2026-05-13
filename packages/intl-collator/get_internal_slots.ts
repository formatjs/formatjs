import type {
  Collator,
  IntlCollatorInternal,
} from '#packages/intl-collator/types.js'

const internalSlotMap = new WeakMap<Collator, IntlCollatorInternal>()

export function getInternalSlots(collator: Collator): IntlCollatorInternal {
  const internalSlots = internalSlotMap.get(collator)
  if (internalSlots) {
    return internalSlots
  }
  const newInternalSlots: IntlCollatorInternal = Object.create(null)
  internalSlotMap.set(collator, newInternalSlots)
  return newInternalSlots
}

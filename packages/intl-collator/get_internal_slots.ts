import type {Collator, CollatorSlots} from '#packages/intl-collator/types.js'
import {TypeErrorConstructor} from '#packages/ecma262-abstract/intrinsics.js'

// ECMA-402 §10.4 stores options and the bound comparison per instance.
// https://tc39.es/ecma402/#sec-properties-of-intl-collator-instances
const internalSlotMap = new WeakMap<Collator, CollatorSlots>()
const read = internalSlotMap.get.bind(internalSlotMap)
const write = internalSlotMap.set.bind(internalSlotMap)

export function requireInternalSlots(collator: Collator): CollatorSlots {
  const slots = read(collator)
  if (!slots?.initializedCollator) {
    throw new TypeErrorConstructor('Incompatible Intl.Collator receiver')
  }
  return slots
}

export function getInternalSlots(collator: Collator): CollatorSlots {
  const internalSlots = read(collator)
  if (internalSlots) {
    return internalSlots
  }
  const newInternalSlots: CollatorSlots = Object.create(null)
  write(collator, newInternalSlots)
  return newInternalSlots
}

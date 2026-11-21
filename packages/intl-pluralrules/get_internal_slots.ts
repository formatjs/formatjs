// Type-only circular import
// eslint-disable-next-line import/no-cycle
import type {PluralRules} from '#packages/intl-pluralrules/index.js'
import {type PluralRulesInternal} from '#packages/intl-pluralrules/index.js'

const internalSlotMap = new WeakMap<PluralRules, PluralRulesInternal>()
const readInternalSlots = internalSlotMap.get.bind(internalSlotMap)
const writeInternalSlots = internalSlotMap.set.bind(internalSlotMap)

export default function getInternalSlots(x: PluralRules): PluralRulesInternal {
  let internalSlots = readInternalSlots(x)
  if (!internalSlots) {
    internalSlots = Object.create(null) as PluralRulesInternal
    writeInternalSlots(x, internalSlots)
  }
  return internalSlots
}

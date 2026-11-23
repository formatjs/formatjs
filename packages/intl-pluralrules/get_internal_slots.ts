// Type-only circular import
// eslint-disable-next-line import/no-cycle
import type {PluralRules} from '#packages/intl-pluralrules/index.js'
import {type PluralRulesInternal} from '#packages/intl-pluralrules/index.js'
import {TypeErrorConstructor} from '#packages/ecma262-abstract/intrinsics.js'

// ECMA-402 §17.4 https://tc39.es/ecma402/#sec-properties-of-intl-pluralrules-instances
const internalSlotMap = new WeakMap<PluralRules, PluralRulesInternal>()
const readInternalSlots = internalSlotMap.get.bind(internalSlotMap)
const writeInternalSlots = internalSlotMap.set.bind(internalSlotMap)

// ECMA-402 §17.3.2–17.3.4 step 2 requires [[InitializedPluralRules]].
// https://tc39.es/ecma262/#sec-requireinternalslot
export function requireInternalSlots(
  receiver: PluralRules
): PluralRulesInternal {
  const slots = readInternalSlots(receiver)
  if (!slots?.initializedPluralRules) {
    throw new TypeErrorConstructor('Incompatible Intl.PluralRules receiver')
  }
  return slots
}

export default function getInternalSlots(x: PluralRules): PluralRulesInternal {
  let internalSlots = readInternalSlots(x)
  if (!internalSlots) {
    internalSlots = {__proto__: null} as unknown as PluralRulesInternal
    writeInternalSlots(x, internalSlots)
  }
  return internalSlots
}

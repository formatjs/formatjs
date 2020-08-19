// Type-only circular import
// eslint-disable-next-line import/no-cycle
import {PluralRules, PluralRulesInternal} from '.';

const internalSlotMap = new WeakMap<PluralRules, PluralRulesInternal>();

export default function getInternalSlots(x: PluralRules): PluralRulesInternal {
  let internalSlots = internalSlotMap.get(x);
  if (!internalSlots) {
    internalSlots = Object.create(null) as PluralRulesInternal;
    internalSlotMap.set(x, internalSlots);
  }
  return internalSlots;
}

import type {Collation} from '@formatjs_generated/cldr.supported-values/collations.js'
import {collations} from '@formatjs_generated/cldr.supported-values/collations.js'
import {collationCandidateLocales} from '@formatjs_generated/cldr.collation/locale-data.js'

function isSupportedCollation(collation: Collation): boolean {
  // ECMA-402 §6.8.1 AvailableCanonicalCollations describes support across
  // the implementation, including collations unavailable for English.
  // This is an implementation-defined operation, with no numbered steps.
  // https://tc39.es/ecma402/#sec-availablecanonicalcollations
  // https://github.com/tc39/ecma402/blob/b1c961988b9a07894b1dc3dc2b5626ea48387d61/spec/locales-currencies-tz.html#L509-L514
  const candidates = (
    collationCandidateLocales as Record<string, readonly string[]>
  )[collation] || ['en']
  for (const locale of candidates) {
    try {
      if (
        new Intl.Collator(`${locale}-u-co-${collation}`).resolvedOptions()
          .collation === collation
      ) {
        return true
      }
    } catch {}
  }
  return false
}

export function getSupportedCollations(): Collation[] {
  return collations.filter(isSupportedCollation).sort()
}

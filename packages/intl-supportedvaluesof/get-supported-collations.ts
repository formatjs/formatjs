import {getCollatorProbe} from '#packages/intl-supportedvaluesof/memoize.js'
import {supportedEntries} from '#packages/intl-supportedvaluesof/supported-entries.js'
import type {Collation} from '@formatjs_generated/cldr.supported-values/collations.js'
import {collations} from '@formatjs_generated/cldr.supported-values/collations.js'
import {collationCandidateLocales} from '@formatjs_generated/cldr.collation/locale-data.js'

// ECMA-402 §8.3.2 step 3 returns collations supported in any locale.
// https://tc39.es/ecma402/#sec-collation-types
// https://tc39.es/ecma402/#sec-availablecanonicalcollations
export function getSupportedCollations(): Collation[] {
  const probe = getCollatorProbe()
  if (!probe?.resolve) return []
  const {create, resolve} = probe
  return supportedEntries(collations, collation => {
    const candidates = (
      collationCandidateLocales as Record<string, readonly string[]>
    )[collation] || ['en']
    for (let index = 0; index < candidates.length; index++) {
      const locale = candidates[index]
      try {
        if (
          resolve(create(`${locale}-u-co-${collation}`)).collation === collation
        )
          return true
      } catch {}
    }
    return false
  })
}

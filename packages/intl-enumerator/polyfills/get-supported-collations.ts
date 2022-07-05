import type {Collation} from '../data/collations'
import {collations} from '../data/collations'

function isSupported(collation: Collation): boolean {
  try {
    return (
      Intl.Collator('en-u-co-' + collation).resolvedOptions().locale === 'en'
    )
  } catch (_err) {}

  return false
}

export function getSupportedCollations(): Collation[] {
  return collations.filter(isSupported)
}

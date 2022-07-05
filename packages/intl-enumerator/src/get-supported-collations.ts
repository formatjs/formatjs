import type {Collation} from './collations.generated'
import {collations} from './collations.generated'

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

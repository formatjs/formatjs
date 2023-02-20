import type {Collation} from './collations.generated'
import {collations} from './collations.generated'

function isSupported(collation: Collation, locale: string = 'en'): boolean {
  try {
    return (
      Intl.Collator(`${locale}-u-co-${collation}`).resolvedOptions()
        .collation === collation
    )
  } catch (_err) {}

  return false
}

export function getSupportedCollations(locale?: string): Collation[] {
  return collations.filter(collation => isSupported(collation, locale))
}

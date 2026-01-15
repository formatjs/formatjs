import type {Collation} from './collations.generated.js'
import {collations} from './collations.generated.js'

/**
 * Implementation: Tests if a collation is supported by attempting to create
 * a Collator with that collation and verifying it was accepted.
 *
 * CLDR Data: Candidate values come from CLDR collation types
 */
function isSupportedCollation(collation: Collation): boolean {
  try {
    // Always use 'en' for testing
    return (
      Intl.Collator(`en-u-co-${collation}`).resolvedOptions().collation ===
      collation
    )
  } catch {}

  return false
}

/**
 * ECMA-402 Spec: Returns supported collation identifiers
 * ECMA-402 Spec: Results must be sorted lexicographically
 *
 * Implementation: Filters CLDR list against actual runtime support
 */
export function getSupportedCollations(): Collation[] {
  return collations.filter(isSupportedCollation).sort()
}

import {createMemoizedNumberFormat} from '@formatjs/ecma402-abstract'
import {numberingSystemNames} from './numbering-systems.generated.js'

/**
 * Implementation: Tests if a numbering system is supported by attempting to create
 * a NumberFormat with that numbering system and verifying it was accepted.
 *
 * CLDR Data: Candidate values come from CLDR numbering system types
 */
function isSupportedNumberingSystem(system: string): boolean {
  try {
    // Always use 'en' for testing
    const numberFormat = createMemoizedNumberFormat(`en-u-nu-${system}`)
    const options = numberFormat.resolvedOptions().numberingSystem

    if (
      (options === system && system === 'latn') ||
      numberFormat.format(123) !== '123'
    ) {
      return true
    }
  } catch {}

  return false
}

/**
 * ECMA-402 Spec: Returns supported numbering system identifiers
 * ECMA-402 Spec: Results must be sorted lexicographically
 *
 * Implementation: Filters CLDR list against actual runtime support
 */
export function getSupportedNumberingSystems(): string[] {
  return numberingSystemNames.filter(isSupportedNumberingSystem).sort()
}

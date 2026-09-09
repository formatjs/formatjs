import {IsSanctionedSimpleUnitIdentifier} from '#packages/ecma402-abstract/IsSanctionedSimpleUnitIdentifier.js'

/**
 * https://tc39.es/ecma402/#sec-iswellformedunitidentifier
 * @param unit
 */
export function IsWellFormedUnitIdentifier(unit: string): boolean {
  // ECMA-402 §6.6.1, steps 1–5: match sanctioned identifiers without case folding.
  // https://tc39.es/ecma402/#sec-iswellformedunitidentifier
  // https://github.com/tc39/ecma402/blob/b1c961988b9a07894b1dc3dc2b5626ea48387d61/spec/locales-currencies-tz.html#L399-L404
  if (IsSanctionedSimpleUnitIdentifier(unit)) {
    return true
  }
  const units = unit.split('-per-')
  if (units.length !== 2) {
    return false
  }
  const [numerator, denominator] = units
  if (
    !IsSanctionedSimpleUnitIdentifier(numerator) ||
    !IsSanctionedSimpleUnitIdentifier(denominator)
  ) {
    return false
  }
  return true
}

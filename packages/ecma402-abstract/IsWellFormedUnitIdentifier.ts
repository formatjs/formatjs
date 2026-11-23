import {IsSanctionedSimpleUnitIdentifier} from '#packages/ecma402-abstract/IsSanctionedSimpleUnitIdentifier.js'

const apply = Reflect.apply
const indexOf = String.prototype.indexOf
const slice = String.prototype.slice
const separator = '-per-'

/**
 * https://tc39.es/ecma402/#sec-iswellformedunitidentifier
 * @param unit
 */
export function IsWellFormedUnitIdentifier(unit: string): boolean {
  // ECMA-402 §§6.6–6.6.1: match canonical sanctioned identifiers without case folding.
  // https://tc39.es/ecma402/#sec-measurement-unit-identifiers
  // https://tc39.es/ecma402/#sec-iswellformedunitidentifier
  if (IsSanctionedSimpleUnitIdentifier(unit)) {
    return true
  }
  // ECMA-402 §6.5.4 and §6.6.1 steps 2–3 only need exactly two components.
  // https://tc39.es/ecma402/#sec-string-split-to-list
  const boundary = apply(indexOf, unit, [separator])
  if (boundary < 0) return false
  const denominatorStart = boundary + separator.length
  if (apply(indexOf, unit, [separator, denominatorStart]) >= 0) return false

  const numerator = apply(slice, unit, [0, boundary])
  const denominator = apply(slice, unit, [denominatorStart])
  return (
    IsSanctionedSimpleUnitIdentifier(numerator) &&
    IsSanctionedSimpleUnitIdentifier(denominator)
  )
}

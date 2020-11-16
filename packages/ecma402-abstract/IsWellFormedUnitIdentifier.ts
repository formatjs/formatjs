import {IsSanctionedSimpleUnitIdentifier} from './IsSanctionedSimpleUnitIdentifier';

/**
 * This follows https://tc39.es/ecma402/#sec-case-sensitivity-and-case-mapping
 * @param str string to convert
 */
function toLowerCase(str: string): string {
  return str.replace(/([A-Z])/g, (_, c) => c.toLowerCase());
}

/**
 * https://tc39.es/ecma402/#sec-iswellformedunitidentifier
 * @param unit
 */
export function IsWellFormedUnitIdentifier(unit: string) {
  unit = toLowerCase(unit);
  if (IsSanctionedSimpleUnitIdentifier(unit)) {
    return true;
  }
  const units = unit.split('-per-');
  if (units.length !== 2) {
    return false;
  }
  const [numerator, denominator] = units;
  if (
    !IsSanctionedSimpleUnitIdentifier(numerator) ||
    !IsSanctionedSimpleUnitIdentifier(denominator)
  ) {
    return false;
  }
  return true;
}

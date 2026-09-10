/**
 * https://tc39.es/ecma402/#table-sanctioned-simple-unit-identifiers
 */
export const SANCTIONED_UNITS = [
  'angle-degree',
  'area-acre',
  'area-hectare',
  'concentr-percent',
  'digital-bit',
  'digital-byte',
  'digital-gigabit',
  'digital-gigabyte',
  'digital-kilobit',
  'digital-kilobyte',
  'digital-megabit',
  'digital-megabyte',
  'digital-petabyte',
  'digital-terabit',
  'digital-terabyte',
  'duration-day',
  'duration-hour',
  // ECMA-402 §6.6.2, step 1: include both sub-millisecond units in the table.
  // https://tc39.es/ecma402/#table-sanctioned-single-unit-identifiers
  // https://github.com/tc39/ecma402/blob/b1c961988b9a07894b1dc3dc2b5626ea48387d61/spec/locales-currencies-tz.html#L457-L465
  'duration-microsecond',
  'duration-millisecond',
  'duration-minute',
  'duration-month',
  'duration-nanosecond',
  'duration-second',
  'duration-week',
  'duration-year',
  'length-centimeter',
  'length-foot',
  'length-inch',
  'length-kilometer',
  'length-meter',
  'length-mile-scandinavian',
  'length-mile',
  'length-millimeter',
  'length-yard',
  'mass-gram',
  'mass-kilogram',
  'mass-ounce',
  'mass-pound',
  'mass-stone',
  'temperature-celsius',
  'temperature-fahrenheit',
  'volume-fluid-ounce',
  'volume-gallon',
  'volume-liter',
  'volume-milliliter',
] as const

// In CLDR, the unit name always follows the form `namespace-unit` pattern.
// For example: `digital-bit` instead of `bit`. This function removes the namespace prefix.
export function removeUnitNamespace(unit: string): string {
  return unit.slice(unit.indexOf('-') + 1)
}

/**
 * https://tc39.es/ecma402/#table-sanctioned-simple-unit-identifiers
 */
export const SIMPLE_UNITS: string[] = SANCTIONED_UNITS.map(removeUnitNamespace)

/**
 * https://tc39.es/ecma402/#sec-issanctionedsimpleunitidentifier
 */
export function IsSanctionedSimpleUnitIdentifier(
  unitIdentifier: string
): boolean {
  return SIMPLE_UNITS.indexOf(unitIdentifier) > -1
}

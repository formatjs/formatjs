import {
  RangeErrorConstructor,
  TypeErrorConstructor,
} from '#packages/ecma262-abstract/intrinsics.js'
import {GetOption} from '#packages/ecma402-abstract/GetOption.js'
import {IsWellFormedCurrencyCode} from '#packages/ecma402-abstract/IsWellFormedCurrencyCode.js'
import {IsWellFormedUnitIdentifier} from '#packages/ecma402-abstract/IsWellFormedUnitIdentifier.js'
import {
  type NumberFormatInternal,
  type NumberFormatOptions,
} from '#packages/ecma402-abstract/types/number.js'
import {invariant} from '#packages/ecma402-abstract/utils.js'

const apply = Reflect.apply
const upperCase = String.prototype.toUpperCase

/**
 * https://tc39.es/ecma402/#sec-setnumberformatunitoptions
 */
export function SetNumberFormatUnitOptions(
  internalSlots: NumberFormatInternal,
  options: NumberFormatOptions | undefined = Object.create(null)
): void {
  // 1. Let style be ? GetOption(options, "style", "string", « "decimal", "percent", "currency", "unit" », "decimal").
  const style = GetOption(
    options,
    'style',
    'string',
    ['decimal', 'percent', 'currency', 'unit'],
    'decimal'
  )
  // 2. Set internalSlots.[[Style]] to style.
  internalSlots.style = style

  // 3. Let currency be ? GetOption(options, "currency", "string", undefined, undefined).
  const currency = GetOption(
    options,
    'currency',
    'string',
    undefined,
    undefined
  )
  // Step 5.a validates a supplied currency code.
  invariant(
    currency === undefined || IsWellFormedCurrencyCode(currency),
    'Malformed currency code',
    RangeErrorConstructor
  )

  // Step 4.a requires currency for currency style.
  invariant(
    style !== 'currency' || currency !== undefined,
    'currency cannot be undefined',
    TypeErrorConstructor
  )

  // 6. Let currencyDisplay be ? GetOption(options, "currencyDisplay", "string", « "code", "symbol", "narrowSymbol", "name" », "symbol").
  const currencyDisplay = GetOption(
    options,
    'currencyDisplay',
    'string',
    ['code', 'symbol', 'narrowSymbol', 'name'],
    'symbol'
  )
  // 7. Let currencySign be ? GetOption(options, "currencySign", "string", « "standard", "accounting" », "standard").
  const currencySign = GetOption(
    options,
    'currencySign',
    'string',
    ['standard', 'accounting'],
    'standard'
  )

  // 8. Let unit be ? GetOption(options, "unit", "string", undefined, undefined).
  const unit = GetOption(options, 'unit', 'string', undefined, undefined)
  // Step 10.a validates a supplied unit identifier.
  invariant(
    unit === undefined || IsWellFormedUnitIdentifier(unit),
    'Invalid unit argument for Intl.NumberFormat()',
    RangeErrorConstructor
  )
  // Step 9.a requires unit for unit style.
  invariant(
    style !== 'unit' || unit !== undefined,
    'unit cannot be undefined',
    TypeErrorConstructor
  )

  // 11. Let unitDisplay be ? GetOption(options, "unitDisplay", "string", « "short", "narrow", "long" », "short").
  const unitDisplay = GetOption(
    options,
    'unitDisplay',
    'string',
    ['short', 'narrow', 'long'],
    'short'
  )

  // 12. If style is "currency", then
  if (style === 'currency') {
    // Step 12.a uses ASCII uppercase on the validated code.
    // https://tc39.es/ecma402/#sec-case-sensitivity-and-case-mapping
    internalSlots.currency = apply(upperCase, currency, [])
    // b. Set internalSlots.[[CurrencyDisplay]] to currencyDisplay.
    internalSlots.currencyDisplay = currencyDisplay
    // c. Set internalSlots.[[CurrencySign]] to currencySign.
    internalSlots.currencySign = currencySign
  }
  // 13. If style is "unit", then
  if (style === 'unit') {
    // a. Set internalSlots.[[Unit]] to unit.
    internalSlots.unit = unit
    // b. Set internalSlots.[[UnitDisplay]] to unitDisplay.
    internalSlots.unitDisplay = unitDisplay
  }
}

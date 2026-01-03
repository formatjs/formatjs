import {GetOption} from '../GetOption.js'
import {IsWellFormedCurrencyCode} from '../IsWellFormedCurrencyCode.js'
import {IsWellFormedUnitIdentifier} from '../IsWellFormedUnitIdentifier.js'
import {
  type NumberFormatInternal,
  type NumberFormatOptions,
} from '../types/number.js'
import {invariant} from '../utils.js'

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
  // 4. If currency is not undefined, then
  // a. If the result of IsWellFormedCurrencyCode(currency) is false, throw a RangeError exception.
  invariant(
    currency === undefined || IsWellFormedCurrencyCode(currency),
    'Malformed currency code',
    RangeError
  )

  // 5. If style is "currency" and currency is undefined, throw a TypeError exception.
  invariant(
    style !== 'currency' || currency !== undefined,
    'currency cannot be undefined',
    TypeError
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
  // 9. If unit is not undefined, then
  // a. If the result of IsWellFormedUnitIdentifier(unit) is false, throw a RangeError exception.
  invariant(
    unit === undefined || IsWellFormedUnitIdentifier(unit),
    'Invalid unit argument for Intl.NumberFormat()',
    RangeError
  )
  // 10. If style is "unit" and unit is undefined, throw a TypeError exception.
  invariant(
    style !== 'unit' || unit !== undefined,
    'unit cannot be undefined',
    TypeError
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
    // a. Set internalSlots.[[Currency]] to the result of converting currency to upper case as specified in 6.1.
    internalSlots.currency = currency!.toUpperCase()
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

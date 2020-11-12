import {NumberFormatInternal, NumberFormatOptions} from '../types/number';
import {GetOption} from '../GetOption';
import {IsWellFormedCurrencyCode} from '../IsWellFormedCurrencyCode';
import {IsWellFormedUnitIdentifier} from '../IsWellFormedUnitIdentifier';

/**
 * https://tc39.es/ecma402/#sec-setnumberformatunitoptions
 */
export function SetNumberFormatUnitOptions(
  nf: Intl.NumberFormat,
  options: NumberFormatOptions = Object.create(null),
  {
    getInternalSlots,
  }: {getInternalSlots(nf: Intl.NumberFormat): NumberFormatInternal}
) {
  const internalSlots = getInternalSlots(nf);
  const style = GetOption(
    options,
    'style',
    'string',
    ['decimal', 'percent', 'currency', 'unit'],
    'decimal'
  );
  internalSlots.style = style;
  const currency = GetOption(
    options,
    'currency',
    'string',
    undefined,
    undefined
  );
  if (currency !== undefined && !IsWellFormedCurrencyCode(currency)) {
    throw RangeError('Malformed currency code');
  }
  if (style === 'currency' && currency === undefined) {
    throw TypeError('currency cannot be undefined');
  }
  const currencyDisplay = GetOption(
    options,
    'currencyDisplay',
    'string',
    ['code', 'symbol', 'narrowSymbol', 'name'],
    'symbol'
  );
  const currencySign = GetOption(
    options,
    'currencySign',
    'string',
    ['standard', 'accounting'],
    'standard'
  );

  const unit = GetOption(options, 'unit', 'string', undefined, undefined);
  if (unit !== undefined && !IsWellFormedUnitIdentifier(unit)) {
    throw RangeError('Invalid unit argument for Intl.NumberFormat()');
  }
  if (style === 'unit' && unit === undefined) {
    throw TypeError('unit cannot be undefined');
  }
  const unitDisplay = GetOption(
    options,
    'unitDisplay',
    'string',
    ['short', 'narrow', 'long'],
    'short'
  );

  if (style === 'currency') {
    internalSlots.currency = currency!.toUpperCase();
    internalSlots.currencyDisplay = currencyDisplay;
    internalSlots.currencySign = currencySign;
  }
  if (style === 'unit') {
    internalSlots.unit = unit;
    internalSlots.unitDisplay = unitDisplay;
  }
}

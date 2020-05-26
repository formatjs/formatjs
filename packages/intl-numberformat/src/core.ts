import {
  createResolveLocale,
  DecimalFormatNum,
  defineProperty,
  formatNumericToString,
  getMagnitude,
  getOption,
  hasOwnProperty,
  invariant,
  isWellFormedCurrencyCode,
  isWellFormedUnitIdentifier,
  objectIs,
  RawNumberLocaleData,
  setNumberFormatDigitOptions,
  supportedLocales,
  toObject,
  unpackData,
} from '@formatjs/intl-utils';
import * as currencyDigitsData from './data/currency-digits.json';
import {names as numberingSystemNames} from './data/numbering-systems.json';
import formatToParts from './format_to_parts';
// eslint-disable-next-line import/no-cycle
import getInternalSlots from './get_internal_slots';
import {NumberFormatConstructor, NumberFormatOptions} from './types';
import type {getCanonicalLocales} from '@formatjs/intl-getcanonicallocales';

// Merge declaration with the constructor defined below.
export type NumberFormat = import('./types').NumberFormat;

const VALID_NUMBERING_SYSTEM_NAMES = new Set(numberingSystemNames);

const RESOLVED_OPTIONS_KEYS = [
  'locale',
  'numberingSystem',
  'style',
  'currency',
  'currencyDisplay',
  'currencySign',
  'unit',
  'unitDisplay',
  'minimumIntegerDigits',
  'minimumFractionDigits',
  'maximumFractionDigits',
  'minimumSignificantDigits',
  'maximumSignificantDigits',
  'useGrouping',
  'notation',
  'compactDisplay',
  'signDisplay',
] as const;

/**
 * Chop off the unicode extension from the locale string.
 */
function removeUnicodeExtensionFromLocale(canonicalLocale: string): string {
  const extensionIndex = canonicalLocale.indexOf('-u-');
  return extensionIndex >= 0
    ? canonicalLocale.slice(0, extensionIndex)
    : canonicalLocale;
}

/**
 * https://tc39.es/ecma402/#sec-currencydigits
 */
function currencyDigits(c: string): number {
  return hasOwnProperty(currencyDigitsData, c)
    ? (currencyDigitsData as Record<string, number>)[c]
    : 2;
}

/**
 * https://tc39.es/ecma402/#sec-initializenumberformat
 */
function initializeNumberFormat(
  nf: NumberFormat,
  locales?: string | string[],
  opts?: NumberFormatOptions
) {
  // @ts-ignore
  const requestedLocales: string[] = Intl.getCanonicalLocales(locales);
  const options: NumberFormatOptions =
    opts === undefined ? Object.create(null) : toObject(opts);
  const opt = Object.create(null);
  const matcher = getOption(
    options,
    'localeMatcher',
    'string',
    ['lookup', 'best fit'],
    'best fit'
  );
  opt.localeMatcher = matcher;

  const numberingSystem = getOption(
    options,
    'numberingSystem',
    'string',
    undefined,
    undefined
  );
  if (
    numberingSystem !== undefined &&
    !VALID_NUMBERING_SYSTEM_NAMES.has(numberingSystem)
  ) {
    // 8.a. If numberingSystem does not match the Unicode Locale Identifier type nonterminal,
    // throw a RangeError exception.
    throw RangeError(`Invalid numberingSystems: ${numberingSystem}`);
  }
  opt.nu = numberingSystem;

  const {localeData} = NumberFormat;
  const r = createResolveLocale(NumberFormat.getDefaultLocale)(
    NumberFormat.availableLocales,
    requestedLocales,
    opt,
    // [[RelevantExtensionKeys]] slot, which is a constant
    ['nu'],
    localeData
  );
  const dataLocaleData = localeData[removeUnicodeExtensionFromLocale(r.locale)];

  const internalSlots = getInternalSlots(nf);
  internalSlots.locale = r.locale;
  internalSlots.dataLocale = r.dataLocale;
  internalSlots.numberingSystem = r.nu;
  internalSlots.dataLocaleData = dataLocaleData;

  setNumberFormatUnitOptions(nf, options);
  const style = internalSlots.style;

  let mnfdDefault: number;
  let mxfdDefault: number;
  if (style === 'currency') {
    const currency = internalSlots.currency;
    const cDigits = currencyDigits(currency!);
    mnfdDefault = cDigits;
    mxfdDefault = cDigits;
  } else {
    mnfdDefault = 0;
    mxfdDefault = style === 'percent' ? 0 : 3;
  }

  const notation = getOption(
    options,
    'notation',
    'string',
    ['standard', 'scientific', 'engineering', 'compact'],
    'standard'
  );
  internalSlots.notation = notation;

  setNumberFormatDigitOptions(
    internalSlots,
    options,
    mnfdDefault,
    mxfdDefault,
    notation
  );

  const compactDisplay = getOption(
    options,
    'compactDisplay',
    'string',
    ['short', 'long'],
    'short'
  );
  if (notation === 'compact') {
    internalSlots.compactDisplay = compactDisplay;
  }

  const useGrouping = getOption(
    options,
    'useGrouping',
    'boolean',
    undefined,
    true
  );
  internalSlots.useGrouping = useGrouping;

  const signDisplay = getOption(
    options,
    'signDisplay',
    'string',
    ['auto', 'never', 'always', 'exceptZero'],
    'auto'
  );
  internalSlots.signDisplay = signDisplay;

  return nf;
}

/**
 * https://tc39.es/ecma402/#sec-formatnumberstring
 */
function partitionNumberPattern(numberFormat: NumberFormat, x: number) {
  const internalSlots = getInternalSlots(numberFormat);
  const {pl, dataLocaleData, numberingSystem} = internalSlots;
  const symbols =
    dataLocaleData.numbers.symbols[numberingSystem] ||
    dataLocaleData.numbers.symbols[dataLocaleData.numbers.nu[0]];

  let magnitude = 0;
  let exponent = 0;
  let n: string;

  if (isNaN(x)) {
    n = symbols.nan;
  } else if (!isFinite(x)) {
    n = symbols.infinity;
  } else {
    if (internalSlots.style === 'percent') {
      x *= 100;
    }
    [exponent, magnitude] = computeExponent(numberFormat, x);
    // Preserve more precision by doing multiplication when exponent is negative.
    x = exponent < 0 ? x * 10 ** -exponent : x / 10 ** exponent;
    const formatNumberResult = formatNumericToString(internalSlots, x);
    n = formatNumberResult.formattedString;
    x = formatNumberResult.roundedNumber;
  }

  // Based on https://tc39.es/ecma402/#sec-getnumberformatpattern
  // We need to do this before `x` is rounded.
  let sign: -1 | 0 | 1;
  const signDisplay = internalSlots.signDisplay;
  switch (signDisplay) {
    case 'never':
      sign = 0;
      break;
    case 'auto':
      if (objectIs(x, 0) || x > 0 || isNaN(x)) {
        sign = 0;
      } else {
        sign = -1;
      }
      break;
    case 'always':
      if (objectIs(x, 0) || x > 0 || isNaN(x)) {
        sign = 1;
      } else {
        sign = -1;
      }
      break;
    default:
      // x === 0 -> x is 0 or x is -0
      if (x === 0 || isNaN(x)) {
        sign = 0;
      } else if (x > 0) {
        sign = 1;
      } else {
        sign = -1;
      }
  }

  return formatToParts(
    {roundedNumber: x, formattedString: n, exponent, magnitude, sign},
    internalSlots.dataLocaleData,
    pl,
    internalSlots
  );
}

function formatNumericToParts(numberFormat: NumberFormat, x: number) {
  return partitionNumberPattern(numberFormat, x);
}

/**
 * https://tc39.es/ecma402/#sec-intl-numberformat-constructor
 */
export const NumberFormat = function (
  this: NumberFormat,
  locales?: string | string[],
  options?: NumberFormatOptions
) {
  // Cannot use `new.target` bc of IE11 & TS transpiles it to something else
  if (!this || !(this instanceof NumberFormat)) {
    return new NumberFormat(locales, options);
  }

  initializeNumberFormat(this, locales, options);

  const internalSlots = getInternalSlots(this);

  const dataLocale = internalSlots.dataLocale;
  const dataLocaleData = NumberFormat.localeData[dataLocale];
  invariant(
    dataLocaleData !== undefined,
    `Cannot load locale-dependent data for ${dataLocale}.`
  );

  internalSlots.pl = new Intl.PluralRules(dataLocale, {
    minimumFractionDigits: internalSlots.minimumFractionDigits,
    maximumFractionDigits: internalSlots.maximumFractionDigits,
    minimumIntegerDigits: internalSlots.minimumIntegerDigits,
    minimumSignificantDigits: internalSlots.minimumSignificantDigits,
    maximumSignificantDigits: internalSlots.maximumSignificantDigits,
  } as any);
} as NumberFormatConstructor;

defineProperty(NumberFormat.prototype, 'formatToParts', {
  value: function formatToParts(x: number) {
    return formatNumericToParts(this, toNumeric(x) as number);
  },
});

defineProperty(NumberFormat.prototype, 'resolvedOptions', {
  value: function resolvedOptions() {
    if (typeof this !== 'object' || !(this instanceof NumberFormat)) {
      throw TypeError(
        'Method Intl.NumberFormat.prototype.resolvedOptions called on incompatible receiver'
      );
    }
    const internalSlots = getInternalSlots(this);
    const ro: Record<string, unknown> = {};
    for (const key of RESOLVED_OPTIONS_KEYS) {
      const value = internalSlots[key];
      if (value !== undefined) {
        ro[key] = value;
      }
    }
    return ro as any;
  },
});

const formatDescriptor = {
  enumerable: false,
  configurable: true,
  get() {
    if (typeof this !== 'object' || !(this instanceof NumberFormat)) {
      throw TypeError(
        'Intl.NumberFormat format property accessor called on incompatible receiver'
      );
    }
    const internalSlots = getInternalSlots(this);
    // eslint-disable-next-line @typescript-eslint/no-this-alias
    const numberFormat = this;
    let boundFormat = internalSlots.boundFormat;
    if (boundFormat === undefined) {
      // https://tc39.es/proposal-unified-intl-numberformat/section11/numberformat_diff_out.html#sec-number-format-functions
      boundFormat = (value?: number) => {
        // TODO: check bigint
        const x = toNumeric(value) as number;
        return numberFormat
          .formatToParts(x)
          .map(x => x.value)
          .join('');
      };
      try {
        // https://github.com/tc39/test262/blob/master/test/intl402/NumberFormat/prototype/format/format-function-name.js
        Object.defineProperty(boundFormat, 'name', {
          configurable: true,
          enumerable: false,
          writable: false,
          value: '',
        });
      } catch (e) {
        // In older browser (e.g Chrome 36 like polyfill.io)
        // TypeError: Cannot redefine property: name
      }
      internalSlots.boundFormat = boundFormat;
    }
    return boundFormat;
  },
} as const;
try {
  // https://github.com/tc39/test262/blob/master/test/intl402/NumberFormat/prototype/format/name.js
  Object.defineProperty(formatDescriptor.get, 'name', {
    configurable: true,
    enumerable: false,
    writable: false,
    value: 'get format',
  });
} catch (e) {
  // In older browser (e.g Chrome 36 like polyfill.io)
  // TypeError: Cannot redefine property: name
}

Object.defineProperty(NumberFormat.prototype, 'format', formatDescriptor);

// Static properties
defineProperty(NumberFormat, 'supportedLocalesOf', {
  value: function supportedLocalesOf(
    locales: string | string[],
    options?: Pick<NumberFormatOptions, 'localeMatcher'>
  ) {
    return supportedLocales(
      NumberFormat.availableLocales,
      ((Intl as any).getCanonicalLocales as typeof getCanonicalLocales)(
        locales
      ),
      options
    );
  },
});

NumberFormat.__addLocaleData = function __addLocaleData(
  ...data: RawNumberLocaleData[]
) {
  for (const datum of data) {
    const availableLocales: string[] = datum.availableLocales;
    for (const locale of availableLocales) {
      try {
        NumberFormat.localeData[locale] = unpackData(locale, datum);
      } catch (e) {
        // Ignore if we got no data
      }
    }
  }
  NumberFormat.availableLocales = Object.keys(NumberFormat.localeData);
  if (!NumberFormat.__defaultLocale) {
    NumberFormat.__defaultLocale = NumberFormat.availableLocales[0];
  }
};

NumberFormat.__defaultLocale = 'en';
NumberFormat.localeData = {};
NumberFormat.availableLocales = [];
NumberFormat.getDefaultLocale = () => {
  return NumberFormat.__defaultLocale;
};
NumberFormat.polyfilled = true;

/**
 * https://tc39.es/ecma402/#sec-setnumberformatunitoptions
 */
function setNumberFormatUnitOptions(
  nf: NumberFormat,
  options: NumberFormatOptions = Object.create(null)
) {
  const internalSlots = getInternalSlots(nf);
  const style = getOption(
    options,
    'style',
    'string',
    ['decimal', 'percent', 'currency', 'unit'],
    'decimal'
  );
  internalSlots.style = style;
  const currency = getOption(
    options,
    'currency',
    'string',
    undefined,
    undefined
  );
  if (currency !== undefined && !isWellFormedCurrencyCode(currency)) {
    throw RangeError('Malformed currency code');
  }
  if (style === 'currency' && currency === undefined) {
    throw TypeError('currency cannot be undefined');
  }
  const currencyDisplay = getOption(
    options,
    'currencyDisplay',
    'string',
    ['code', 'symbol', 'narrowSymbol', 'name'],
    'symbol'
  );
  const currencySign = getOption(
    options,
    'currencySign',
    'string',
    ['standard', 'accounting'],
    'standard'
  );

  const unit = getOption(options, 'unit', 'string', undefined, undefined);
  if (unit !== undefined && !isWellFormedUnitIdentifier(unit)) {
    throw RangeError('Invalid unit argument for Intl.NumberFormat()');
  }
  if (style === 'unit' && unit === undefined) {
    throw TypeError('unit cannot be undefined');
  }
  const unitDisplay = getOption(
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

/**
 * The abstract operation ComputeExponent computes an exponent (power of ten) by which to scale x
 * according to the number formatting settings. It handles cases such as 999 rounding up to 1000,
 * requiring a different exponent.
 *
 * NOT IN SPEC: it returns [exponent, magnitude].
 */
function computeExponent(
  numberFormat: NumberFormat,
  x: number
): [number, number] {
  if (x === 0) {
    return [0, 0];
  }
  if (x < 0) {
    x = -x;
  }
  const magnitude = getMagnitude(x);
  const exponent = computeExponentForMagnitude(numberFormat, magnitude);
  // Preserve more precision by doing multiplication when exponent is negative.
  x = exponent < 0 ? x * 10 ** -exponent : x / 10 ** exponent;
  const formatNumberResult = formatNumericToString(
    getInternalSlots(numberFormat),
    x
  );
  if (formatNumberResult.roundedNumber === 0) {
    return [exponent, magnitude];
  }
  const newMagnitude = getMagnitude(formatNumberResult.roundedNumber);
  if (newMagnitude === magnitude - exponent) {
    return [exponent, magnitude];
  }
  return [
    computeExponentForMagnitude(numberFormat, magnitude + 1),
    magnitude + 1,
  ];
}

/**
 * The abstract operation ComputeExponentForMagnitude computes an exponent by which to scale a
 * number of the given magnitude (power of ten of the most significant digit) according to the
 * locale and the desired notation (scientific, engineering, or compact).
 */
function computeExponentForMagnitude(
  numberFormat: NumberFormat,
  magnitude: number
): number {
  const internalSlots = getInternalSlots(numberFormat);
  const {notation, dataLocaleData, numberingSystem} = internalSlots;

  switch (notation) {
    case 'standard':
      return 0;
    case 'scientific':
      return magnitude;
    case 'engineering':
      return Math.floor(magnitude / 3) * 3;
    default: {
      // Let exponent be an implementation- and locale-dependent (ILD) integer by which to scale a
      // number of the given magnitude in compact notation for the current locale.
      const {compactDisplay, style, currencyDisplay} = internalSlots;
      let thresholdMap;
      if (style === 'currency' && currencyDisplay !== 'name') {
        const currency =
          dataLocaleData.numbers.currency[numberingSystem] ||
          dataLocaleData.numbers.currency[dataLocaleData.numbers.nu[0]];
        thresholdMap = currency.short;
      } else {
        const decimal =
          dataLocaleData.numbers.decimal[numberingSystem] ||
          dataLocaleData.numbers.decimal[dataLocaleData.numbers.nu[0]];
        thresholdMap = compactDisplay === 'long' ? decimal.long : decimal.short;
      }
      if (!thresholdMap) {
        return 0;
      }
      const num = String(10 ** magnitude) as DecimalFormatNum;
      const thresholds = Object.keys(thresholdMap) as DecimalFormatNum[]; // TODO: this can be pre-processed
      if (num < thresholds[0]) {
        return 0;
      }
      if (num > thresholds[thresholds.length - 1]) {
        return thresholds[thresholds.length - 1].length - 1;
      }
      const i = thresholds.indexOf(num);
      if (i === -1) {
        return 0;
      }
      // See https://unicode.org/reports/tr35/tr35-numbers.html#Compact_Number_Formats
      // Special handling if the pattern is precisely `0`.
      const magnitudeKey = thresholds[i];
      // TODO: do we need to handle plural here?
      const compactPattern = thresholdMap[magnitudeKey].other;
      if (compactPattern === '0') {
        return 0;
      }
      // Example: in zh-TW, `10000000` maps to `0000萬`. So we need to return 8 - 4 = 4 here.
      return (
        magnitudeKey.length -
        thresholdMap[magnitudeKey].other.match(/0+/)![0].length
      );
    }
  }
}

function toNumeric(val: any) {
  if (typeof val === 'bigint') {
    return val;
  }
  return toNumber(val);
}

function toNumber(val: any): number {
  if (val === undefined) {
    return NaN;
  }
  if (val === null) {
    return +0;
  }
  if (typeof val === 'boolean') {
    return val ? 1 : +0;
  }
  if (typeof val === 'number') {
    return val;
  }
  if (typeof val === 'symbol' || typeof val === 'bigint') {
    throw new TypeError('Cannot convert symbol/bigint to number');
  }
  return Number(val);
}

try {
  // IE11 does not have Symbol
  if (typeof Symbol !== 'undefined') {
    Object.defineProperty(NumberFormat.prototype, Symbol.toStringTag, {
      configurable: true,
      enumerable: false,
      writable: false,
      value: 'Object',
    });
  }

  // https://github.com/tc39/test262/blob/master/test/intl402/NumberFormat/length.js
  Object.defineProperty(NumberFormat.prototype.constructor, 'length', {
    configurable: true,
    enumerable: false,
    writable: false,
    value: 0,
  });
  // https://github.com/tc39/test262/blob/master/test/intl402/NumberFormat/supportedLocalesOf/length.js
  Object.defineProperty(NumberFormat.supportedLocalesOf, 'length', {
    configurable: true,
    enumerable: false,
    writable: false,
    value: 1,
  });

  Object.defineProperty(NumberFormat, 'prototype', {
    configurable: false,
    enumerable: false,
    writable: false,
    value: NumberFormat.prototype,
  });
} catch (e) {
  // Meta fix so we're test262-compliant, not important
}

import {Unit} from './units-constants';
import {
  createResolveLocale,
  toObject,
  supportedLocales,
  getCanonicalLocales,
  setInternalSlot,
  setMultiInternalSlots,
  getMultiInternalSlots,
  getOption,
  getInternalSlot,
  SignDisplayPattern,
  InternalSlotToken,
  LDMLPluralRule,
  RawNumberLocaleData,
  DecimalFormatNum,
  setNumberFormatDigitOptions,
  NumberFormatDigitOptions,
  NumberFormatDigitInternalSlots,
  LDMLPluralRuleMap,
  NumberILD,
  NumberLocalePatternData,
  SANCTIONED_UNITS,
  invariant,
  objectIs,
  unpackData,
  NumberLocaleInternalData,
  SignPattern,
  partitionPattern,
  UnifiedNumberFormatOptionsLocaleMatcher,
  UnifiedNumberFormatOptionsStyle,
  UnifiedNumberFormatOptionsCompactDisplay,
  UnifiedNumberFormatOptionsCurrencyDisplay,
  UnifiedNumberFormatOptionsCurrencySign,
  UnifiedNumberFormatOptionsNotation,
  UnifiedNumberFormatOptionsSignDisplay,
  UnifiedNumberFormatOptionsUnitDisplay,
  isWellFormedCurrencyCode,
} from '@formatjs/intl-utils';
import {
  toRawFixed,
  toRawPrecision,
  RawNumberFormatResult,
  getMagnitude,
  repeat,
} from './utils';
import {extractILD, Patterns} from './data';
import * as currencyDigitsData from './currency-digits.json';
import * as ILND from './ilnd-numbers.json';

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

const SHORTENED_SACTION_UNITS = SANCTIONED_UNITS.map(unit =>
  unit.replace(/^(.*?)-/, '')
);

/**
 * This follows https://tc39.es/ecma402/#sec-case-sensitivity-and-case-mapping
 * @param str string to convert
 */
function toLowerCase(str: string): string {
  return str.replace(/([A-Z])/g, (_, c) => c.toLowerCase());
}

/**
 * https://tc39.es/proposal-unified-intl-numberformat/section6/locales-currencies-tz_proposed_out.html#sec-iswellformedunitidentifier
 * @param unit
 */
function isWellFormedUnitIdentifier(unit: string) {
  unit = toLowerCase(unit);
  if (SHORTENED_SACTION_UNITS.indexOf(unit) > -1) {
    return true;
  }
  const units = unit.split('-per-');
  if (units.length !== 2) {
    return false;
  }
  if (
    SHORTENED_SACTION_UNITS.indexOf(units[0]) < 0 ||
    SHORTENED_SACTION_UNITS.indexOf(units[1]) < 0
  ) {
    return false;
  }
  return true;
}

/**
 * Check if a formatting number with unit is supported
 * @public
 * @param unit unit to check
 */
export function isUnitSupported(unit: Unit) {
  try {
    new Intl.NumberFormat(undefined, {
      style: 'unit',
      unit,
    } as any);
  } catch (e) {
    return false;
  }
  return true;
}

/**
 * Chop off the unicode extension from the locale string.
 */
function removeUnicodeExtensionFromLocale(canonicalLocale: string): string {
  const extensionIndex = canonicalLocale.indexOf('-u-');
  return extensionIndex >= 0
    ? canonicalLocale.slice(0, extensionIndex)
    : canonicalLocale;
}

export type UnifiedNumberFormatOptions = Intl.NumberFormatOptions &
  NumberFormatDigitOptions & {
    localeMatcher?: UnifiedNumberFormatOptionsLocaleMatcher;
    style?: UnifiedNumberFormatOptionsStyle;
    compactDisplay?: UnifiedNumberFormatOptionsCompactDisplay;
    currencyDisplay?: UnifiedNumberFormatOptionsCurrencyDisplay;
    currencySign?: UnifiedNumberFormatOptionsCurrencySign;
    notation?: UnifiedNumberFormatOptionsNotation;
    signDisplay?: UnifiedNumberFormatOptionsSignDisplay;
    unit?: Unit;
    unitDisplay?: UnifiedNumberFormatOptionsUnitDisplay;
  };

export type ResolvedUnifiedNumberFormatOptions = Intl.ResolvedNumberFormatOptions &
  Pick<
    UnifiedNumberFormatInternal,
    | 'currencySign'
    | 'unit'
    | 'unitDisplay'
    | 'notation'
    | 'compactDisplay'
    | 'signDisplay'
  >;

export type UnifiedNumberFormatPartTypes =
  | Intl.NumberFormatPartTypes
  | 'exponentSeparator'
  | 'exponentMinusSign'
  | 'exponentInteger'
  | 'compact'
  | 'unit'
  | 'literal';

export interface UnifiedNumberFormatPart {
  type: UnifiedNumberFormatPartTypes;
  value: string;
}

interface UnifiedNumberFormatInternal extends NumberFormatDigitInternalSlots {
  locale: string;
  dataLocale: string;
  style: NonNullable<UnifiedNumberFormatOptions['style']>;
  currency?: string;
  currencyDisplay: NonNullable<UnifiedNumberFormatOptions['currencyDisplay']>;
  unit?: string;
  unitDisplay: NonNullable<UnifiedNumberFormatOptions['unitDisplay']>;
  currencySign: NonNullable<UnifiedNumberFormatOptions['currencySign']>;
  notation: NonNullable<UnifiedNumberFormatOptions['notation']>;
  compactDisplay: NonNullable<UnifiedNumberFormatOptions['compactDisplay']>;
  signDisplay: NonNullable<UnifiedNumberFormatOptions['signDisplay']>;
  useGrouping: boolean;
  patterns: NumberLocalePatternData;
  pl: Intl.PluralRules;
  boundFormat?: Intl.NumberFormat['format'];
  // Locale-dependent formatter data
  ild: NumberILD;
  numberingSystem: string;
}

const __INTERNAL_SLOT_MAP__ = new WeakMap<
  UnifiedNumberFormat,
  UnifiedNumberFormatInternal
>();

function currencyDigits(c: string): number {
  return c in currencyDigitsData ? currencyDigitsData[c as 'ADP'] : 2;
}

function initializeNumberFormat(
  nf: UnifiedNumberFormat,
  locales?: string | string[],
  opts?: UnifiedNumberFormatOptions
) {
  const requestedLocales = getCanonicalLocales(locales);
  const options = opts === undefined ? Object.create(null) : toObject(opts);
  const opt: any = Object.create(null);
  const matcher = getOption(
    options,
    'localeMatcher',
    'string',
    ['best fit', 'lookup'],
    'best fit'
  );
  opt.localeMatcher = matcher;
  const {localeData} = UnifiedNumberFormat;
  const r = createResolveLocale(UnifiedNumberFormat.getDefaultLocale)(
    UnifiedNumberFormat.availableLocales,
    requestedLocales,
    opt,
    // [[RelevantExtensionKeys]] slot, which is a constant
    ['nu'],
    localeData
  );
  const ildData = localeData[removeUnicodeExtensionFromLocale(r.locale)];
  const numberingSystem = r.nu;
  setMultiInternalSlots(__INTERNAL_SLOT_MAP__, nf, {
    locale: r.locale,
    dataLocale: r.dataLocale,
    numberingSystem,
    ild: extractILD(
      ildData.units,
      ildData.currencies,
      ildData.numbers,
      numberingSystem
    ),
  });

  // https://tc39.es/proposal-unified-intl-numberformat/section11/numberformat_proposed_out.html#sec-setnumberformatunitoptions
  setNumberFormatUnitOptions(nf, options);
  const style = getInternalSlot(__INTERNAL_SLOT_MAP__, nf, 'style');
  // ---

  let mnfdDefault: number;
  let mxfdDefault: number;
  if (style === 'currency') {
    const currency = getInternalSlot(__INTERNAL_SLOT_MAP__, nf, 'currency');
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
  setInternalSlot(__INTERNAL_SLOT_MAP__, nf, 'notation', notation);

  setNumberFormatDigitOptions(
    __INTERNAL_SLOT_MAP__,
    nf,
    options,
    mnfdDefault,
    mxfdDefault
  );

  const compactDisplay = getOption(
    options,
    'compactDisplay',
    'string',
    ['short', 'long'],
    'short'
  );
  if (notation === 'compact') {
    setInternalSlot(
      __INTERNAL_SLOT_MAP__,
      nf,
      'compactDisplay',
      compactDisplay
    );
  }

  const useGrouping = getOption(
    options,
    'useGrouping',
    'boolean',
    undefined,
    true
  );
  setInternalSlot(__INTERNAL_SLOT_MAP__, nf, 'useGrouping', useGrouping);
  const signDisplay = getOption(
    options,
    'signDisplay',
    'string',
    ['auto', 'never', 'always', 'exceptZero'],
    'auto'
  );
  setInternalSlot(__INTERNAL_SLOT_MAP__, nf, 'signDisplay', signDisplay);
}

function partitionNumberPattern(numberFormat: UnifiedNumberFormat, x: number) {
  const pl = getInternalSlot(__INTERNAL_SLOT_MAP__, numberFormat, 'pl');
  let exponent = 0;
  const ild = getInternalSlot(__INTERNAL_SLOT_MAP__, numberFormat, 'ild');
  let n: string;
  let formattedX = x;
  if (isNaN(x)) {
    n = ild.symbols.nan;
  } else if (!isFinite(x)) {
    n = ild.symbols.infinity;
  } else {
    if (
      getInternalSlot(__INTERNAL_SLOT_MAP__, numberFormat, 'style') ===
      'percent'
    ) {
      formattedX *= 100;
    }
    exponent = computeExponent(numberFormat, formattedX);
    formattedX /= 10 ** exponent;
    const formatNumberResult = formatNumberToString(numberFormat, formattedX);
    n = formatNumberResult.formattedString;
    formattedX = formatNumberResult.roundedNumber;
  }
  const pattern = getNumberFormatPattern(numberFormat, x, exponent);
  const patternParts = partitionPattern(pattern);
  const results: UnifiedNumberFormatPart[] = [];

  // Unspec'ed stuff
  // This is to deal w/ cases where {number} is in the middle of a unit pattern
  let unitSymbolChunkIndex = 0;
  const notation = getInternalSlot(
    __INTERNAL_SLOT_MAP__,
    numberFormat,
    'notation'
  );

  for (const part of patternParts) {
    switch (part.type) {
      case 'literal':
        results.push(part as UnifiedNumberFormatPart);
        break;
      case InternalSlotToken.number: {
        if (isNaN(formattedX)) {
          results.push({type: 'nan', value: n});
        } else if (formattedX === Infinity || x === -Infinity) {
          results.push({type: 'infinity', value: n});
        } else {
          const {numberingSystem: nu, useGrouping} = getMultiInternalSlots(
            __INTERNAL_SLOT_MAP__,
            numberFormat,
            'numberingSystem',
            'useGrouping',
            'notation'
          );
          if (nu && nu in ILND) {
            // Replace digits
            const replacementTable = ILND[nu as 'latn'];
            let replacedDigits = '';
            for (const digit of n) {
              // digit can be `.` if it's fractional
              replacedDigits += replacementTable[+digit] || digit;
            }
            n = replacedDigits;
          }
          const decimalSepIndex = n.indexOf('.');
          let integer: string;
          let fraction: string | undefined;
          if (decimalSepIndex > 0) {
            integer = n.slice(0, decimalSepIndex);
            fraction = n.slice(decimalSepIndex + 1);
          } else {
            integer = n;
          }
          // For compact, default grouping strategy is min2
          if (
            useGrouping &&
            (notation === 'compact' ? integer.length > 4 : true)
          ) {
            const groupSepSymbol = ild.symbols.group;
            const groups: string[] = [];
            // Assuming that the group separator is always inserted between every 3 digits.
            let i = integer.length - 3;
            for (; i > 0; i -= 3) {
              groups.push(integer.slice(i, i + 3));
            }
            groups.push(integer.slice(0, i + 3));
            while (groups.length > 0) {
              const integerGroup = groups.pop()!;
              results.push({type: 'integer', value: integerGroup});
              if (groups.length > 0) {
                results.push({type: 'group', value: groupSepSymbol});
              }
            }
          } else {
            results.push({type: 'integer', value: integer});
          }
          if (fraction !== undefined) {
            results.push(
              {type: 'decimal', value: ild.symbols.decimal},
              {type: 'fraction', value: fraction}
            );
          }
        }
        break;
      }
      case InternalSlotToken.plusSign:
        results.push({
          type: 'plusSign',
          value: ild.symbols.plusSign,
        });
        break;
      case InternalSlotToken.minusSign:
        results.push({
          type: 'minusSign',
          value: ild.symbols.minusSign,
        });
        break;
      case InternalSlotToken.compactSymbol: {
        const style = getInternalSlot(
          __INTERNAL_SLOT_MAP__,
          numberFormat,
          'style'
        );
        let compactData;
        if (style === 'currency') {
          compactData = ild.currency.compactShort;
        } else {
          compactData = ild.decimal.compactShort;
        }
        if (compactData) {
          results.push({
            type: 'compact',
            value: selectPlural(
              pl,
              x,
              compactData[String(10 ** exponent) as DecimalFormatNum]
            ),
          });
        }
        break;
      }
      case InternalSlotToken.compactName: {
        const style = getInternalSlot(
          __INTERNAL_SLOT_MAP__,
          numberFormat,
          'style'
        );
        const currencyDisplay = getInternalSlot(
          __INTERNAL_SLOT_MAP__,
          numberFormat,
          'currencyDisplay'
        );
        let compactData;
        if (style === 'currency' && currencyDisplay !== 'name') {
          compactData = ild.currency.compactLong || ild.currency.compactShort;
        } else {
          compactData = ild.decimal.compactLong || ild.decimal.compactShort;
        }
        if (compactData) {
          results.push({
            type: 'compact',
            value: selectPlural(
              pl,
              x,
              compactData[String(10 ** exponent) as DecimalFormatNum]
            ),
          });
        }
        break;
      }
      case InternalSlotToken.scientificSeparator:
        results.push({
          type: 'exponentSeparator',
          value: ild.symbols.exponential,
        });
        break;
      case InternalSlotToken.scientificExponent: {
        if (exponent < 0) {
          results.push({
            type: 'exponentMinusSign',
            value: ild.symbols.minusSign,
          });
          exponent = -exponent;
        }
        const exponentResult = toRawFixed(exponent, 0, 0);
        results.push({
          type: 'exponentInteger',
          value: exponentResult.formattedString,
        });
        break;
      }
      case InternalSlotToken.percentSign:
        results.push({
          type: 'percentSign',
          value: ild.symbols.percentSign,
        });
        break;
      case InternalSlotToken.unitSymbol:
      case InternalSlotToken.unitNarrowSymbol:
      case InternalSlotToken.unitName: {
        const style = getInternalSlot(
          __INTERNAL_SLOT_MAP__,
          numberFormat,
          'style'
        );
        if (style === 'unit') {
          const unit = getInternalSlot(
            __INTERNAL_SLOT_MAP__,
            numberFormat,
            'unit'
          );
          const unitSymbols = ild.unitSymbols[unit!];
          const mu = selectPlural(pl, x, unitSymbols[part.type])[
            unitSymbolChunkIndex
          ];
          results.push({type: 'unit', value: mu});
          unitSymbolChunkIndex++;
        }
        break;
      }
      case InternalSlotToken.currencyCode: {
        const currency = getInternalSlot(
          __INTERNAL_SLOT_MAP__,
          numberFormat,
          'currency'
        )!;
        results.push({type: 'currency', value: currency});
        break;
      }
      case InternalSlotToken.currencySymbol: {
        const currency = getInternalSlot(
          __INTERNAL_SLOT_MAP__,
          numberFormat,
          'currency'
        )!;
        results.push({
          type: 'currency',
          value: ild.currencySymbols[currency].currencySymbol || currency,
        });
        break;
      }
      case InternalSlotToken.currencyNarrowSymbol: {
        const currency = getInternalSlot(
          __INTERNAL_SLOT_MAP__,
          numberFormat,
          'currency'
        )!;
        results.push({
          type: 'currency',
          value: ild.currencySymbols[currency].currencyNarrowSymbol || currency,
        });
        break;
      }
      case InternalSlotToken.currencyName: {
        const currency = getInternalSlot(
          __INTERNAL_SLOT_MAP__,
          numberFormat,
          'currency'
        )!;
        const cd = selectPlural(
          pl,
          x,
          ild.currencySymbols[currency].currencyName
        );
        results.push({type: 'currency', value: cd});
        break;
      }
      default:
        throw Error(`unrecognized pattern part "${part.type}" in "${pattern}"`);
    }
  }
  return results;
}

function formatNumericToParts(numberFormat: UnifiedNumberFormat, x: number) {
  return partitionNumberPattern(numberFormat, x);
}

export interface UnifiedNumberFormat {
  resolvedOptions(): ResolvedUnifiedNumberFormatOptions;
  formatToParts(x: number): UnifiedNumberFormatPart[];
  format(x: number): string;
}

export interface UnifiedNumberFormatConstructor {
  new (
    locales?: string | string[],
    options?: UnifiedNumberFormatOptions
  ): UnifiedNumberFormat;
  (
    locales?: string | string[],
    options?: UnifiedNumberFormatOptions
  ): UnifiedNumberFormat;

  __addLocaleData(...data: RawNumberLocaleData[]): void;
  supportedLocalesOf(
    locales: string | string[],
    options?: Pick<UnifiedNumberFormatOptions, 'localeMatcher'>
  ): string[];
  getDefaultLocale(): string;

  __defaultLocale: string;
  localeData: Record<string, NumberLocaleInternalData>;
  availableLocales: string[];
  polyfilled: boolean;
}

export const UnifiedNumberFormat: UnifiedNumberFormatConstructor = function NumberFormat(
  this: UnifiedNumberFormat,
  locales?: string | string[],
  options?: UnifiedNumberFormatOptions
) {
  // Cannot use `new.target` bc of IE11 & TS transpiles it to something else
  if (!this || !(this instanceof UnifiedNumberFormat)) {
    return new UnifiedNumberFormat(locales, options);
  }

  initializeNumberFormat(this, locales, options);

  const ildData =
    UnifiedNumberFormat.localeData[
      removeUnicodeExtensionFromLocale(
        getInternalSlot(__INTERNAL_SLOT_MAP__, this, 'locale')
      )
    ];

  setMultiInternalSlots(__INTERNAL_SLOT_MAP__, this, {
    pl: new Intl.PluralRules(
      locales,
      getMultiInternalSlots(
        __INTERNAL_SLOT_MAP__,
        this,
        'minimumFractionDigits',
        'maximumFractionDigits',
        'minimumIntegerDigits',
        'minimumSignificantDigits',
        'maximumSignificantDigits',
        'roundingType',
        'notation'
      ) as any
    ),
    patterns: new Patterns(
      ildData.units,
      ildData.currencies,
      ildData.numbers,
      getInternalSlot(__INTERNAL_SLOT_MAP__, this, 'numberingSystem'),
      getInternalSlot(__INTERNAL_SLOT_MAP__, this, 'unit'),
      getInternalSlot(__INTERNAL_SLOT_MAP__, this, 'currency'),
      getInternalSlot(__INTERNAL_SLOT_MAP__, this, 'currencySign')
    ),
  });
} as UnifiedNumberFormatConstructor;

/*
  17 ECMAScript Standard Built-in Objects:
    Every built-in Function object, including constructors, that is not
    identified as an anonymous function has a name property whose value
    is a String.

    Unless otherwise specified, the name property of a built-in Function
    object, if it exists, has the attributes { [[Writable]]: false,
    [[Enumerable]]: false, [[Configurable]]: true }.
*/
function defineProperty<T extends object>(
  target: T,
  name: string | symbol,
  {value}: {value: any} & ThisType<any>
) {
  Object.defineProperty(target, name, {
    configurable: true,
    enumerable: false,
    writable: true,
    value,
  });
}

defineProperty(UnifiedNumberFormat.prototype, 'formatToParts', {
  value: function formatToParts(x: number) {
    return formatNumericToParts(this, toNumeric(x) as number);
  },
});

defineProperty(UnifiedNumberFormat.prototype, 'resolvedOptions', {
  value: function resolvedOptions() {
    const slots = getMultiInternalSlots(
      __INTERNAL_SLOT_MAP__,
      this,
      ...RESOLVED_OPTIONS_KEYS
    );
    const ro: Record<string, unknown> = {};
    for (const key of RESOLVED_OPTIONS_KEYS) {
      const value = slots[key];
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
    if (typeof this !== 'object' || !(this instanceof UnifiedNumberFormat)) {
      throw TypeError(
        'Intl.NumberFormat format property accessor called on imcompatible receiver'
      );
    }
    // eslint-disable-next-line @typescript-eslint/no-this-alias
    const numberFormat = this;
    let boundFormat = getInternalSlot(
      __INTERNAL_SLOT_MAP__,
      this,
      'boundFormat'
    );
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
      // https://github.com/tc39/test262/blob/master/test/intl402/NumberFormat/prototype/format/format-function-name.js
      Object.defineProperty(boundFormat, 'name', {
        configurable: true,
        enumerable: false,
        writable: false,
        value: '',
      });
      setInternalSlot(__INTERNAL_SLOT_MAP__, this, 'boundFormat', boundFormat);
    }
    return boundFormat;
  },
} as const;

// https://github.com/tc39/test262/blob/master/test/intl402/NumberFormat/prototype/format/name.js
Object.defineProperty(formatDescriptor.get, 'name', {
  configurable: true,
  enumerable: false,
  writable: false,
  value: 'get format',
});

Object.defineProperty(
  UnifiedNumberFormat.prototype,
  'format',
  formatDescriptor
);

// Static properties
defineProperty(UnifiedNumberFormat, 'supportedLocalesOf', {
  value: function supportedLocalesOf(
    locales: string | string[],
    options?: Pick<UnifiedNumberFormatOptions, 'localeMatcher'>
  ) {
    return supportedLocales(
      UnifiedNumberFormat.availableLocales,
      getCanonicalLocales(locales),
      options
    );
  },
});

UnifiedNumberFormat.__addLocaleData = function __addLocaleData(
  ...data: RawNumberLocaleData[]
) {
  for (const datum of data) {
    const availableLocales: string[] = Object.keys(
      [
        ...datum.availableLocales,
        ...Object.keys(datum.aliases),
        ...Object.keys(datum.parentLocales),
      ].reduce((all: Record<string, true>, k) => {
        all[k] = true;
        return all;
      }, {})
    );
    for (const locale of availableLocales) {
      try {
        UnifiedNumberFormat.localeData[locale] = unpackData(locale, datum);
      } catch (e) {
        // Ignore if we got no data
      }
    }
  }
  UnifiedNumberFormat.availableLocales = Object.keys(
    UnifiedNumberFormat.localeData
  );
  if (!UnifiedNumberFormat.__defaultLocale) {
    UnifiedNumberFormat.__defaultLocale =
      UnifiedNumberFormat.availableLocales[0];
  }
};
UnifiedNumberFormat.__defaultLocale = 'en';
UnifiedNumberFormat.localeData = {};
UnifiedNumberFormat.availableLocales = [];
UnifiedNumberFormat.getDefaultLocale = () => {
  return UnifiedNumberFormat.__defaultLocale;
};
UnifiedNumberFormat.polyfilled = true;

interface FormatNumberResult {
  roundedNumber: number;
  formattedString: string;
}

function setNumberFormatUnitOptions(
  nf: UnifiedNumberFormat,
  options: UnifiedNumberFormatOptions = Object.create(null)
) {
  // https://tc39.es/proposal-unified-intl-numberformat/section11/numberformat_proposed_out.html#sec-setnumberformatunitoptions
  const style = getOption(
    options,
    'style',
    'string',
    ['decimal', 'percent', 'currency', 'unit'],
    'decimal'
  );
  setInternalSlot(__INTERNAL_SLOT_MAP__, nf, 'style', style);
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
  const unitDisplay = getOption(
    options,
    'unitDisplay',
    'string',
    ['short', 'narrow', 'long'],
    'short'
  );

  if (style === 'currency') {
    if (currency === undefined) {
      throw new TypeError('currency cannot be undefined');
    }
    setMultiInternalSlots(__INTERNAL_SLOT_MAP__, nf, {
      currency: currency.toUpperCase(),
      currencyDisplay,
      currencySign,
    });
  } else if (style === 'unit') {
    if (unit === undefined) {
      throw new TypeError('unit cannot be undefined');
    }
    setMultiInternalSlots(__INTERNAL_SLOT_MAP__, nf, {
      unit,
      unitDisplay,
    });
  }
}

// Taking the shortcut here and used the native NumberFormat for formatting numbers.
function formatNumberToString(
  numberFormat: UnifiedNumberFormat,
  x: number
): FormatNumberResult {
  const isNegative = x < 0 || objectIs(x, -0);
  if (isNegative) {
    x = -x;
  }
  const {
    roundingType,
    minimumSignificantDigits,
    maximumSignificantDigits,
    minimumFractionDigits,
    maximumFractionDigits,
    minimumIntegerDigits,
  } = getMultiInternalSlots(
    __INTERNAL_SLOT_MAP__,
    numberFormat,
    'roundingType',
    'minimumFractionDigits',
    'maximumFractionDigits',
    'minimumIntegerDigits',
    'minimumSignificantDigits',
    'maximumSignificantDigits'
  );
  let result: RawNumberFormatResult;
  if (roundingType === 'significantDigits') {
    result = toRawPrecision(
      x,
      minimumSignificantDigits!,
      maximumSignificantDigits!
    );
  } else if (roundingType === 'fractionDigits') {
    result = toRawFixed(x, minimumFractionDigits!, maximumFractionDigits!);
  } else {
    invariant(
      roundingType === 'compactRounding',
      'roundingType must be compactRounding'
    );
    result = toRawPrecision(x, 1, 2);
    if (result.integerDigitsCount > 1) {
      result = toRawFixed(x, 0, 0);
    }
  }
  x = result.roundedNumber;
  let string = result.formattedString;
  const int = result.integerDigitsCount;
  const minInteger = minimumIntegerDigits;
  if (int < minInteger) {
    const forwardZeros = repeat('0', minInteger - int);
    string = forwardZeros + string;
  }
  if (isNegative) {
    x = -x;
  }
  return {roundedNumber: x, formattedString: string};
}

/**
 * The abstract operation ComputeExponent computes an exponent (power of ten) by which to scale x
 * according to the number formatting settings. It handles cases such as 999 rounding up to 1000,
 * requiring a different exponent.
 */
function computeExponent(numberFormat: UnifiedNumberFormat, x: number) {
  if (x === 0) {
    return 0;
  }
  if (x < 0) {
    x = -x;
  }
  const magnitude = getMagnitude(x);
  const exponent = computeExponentForMagnitude(numberFormat, magnitude);
  x = x / 10 ** exponent; // potential IEEE floating point error
  const formatNumberResult = formatNumberToString(numberFormat, x);
  if (formatNumberResult.roundedNumber === 0) {
    return exponent;
  }
  const newMagnitude = getMagnitude(x);
  if (newMagnitude === magnitude - exponent) {
    return exponent;
  }
  return computeExponentForMagnitude(numberFormat, magnitude + 1);
}

/**
 * The abstract operation ComputeExponentForMagnitude computes an exponent by which to scale a
 * number of the given magnitude (power of ten of the most significant digit) according to the
 * locale and the desired notation (scientific, engineering, or compact).
 */
function computeExponentForMagnitude(
  numberFormat: UnifiedNumberFormat,
  magnitude: number
): number {
  const notation = getInternalSlot(
    __INTERNAL_SLOT_MAP__,
    numberFormat,
    'notation'
  );
  const style = getInternalSlot(__INTERNAL_SLOT_MAP__, numberFormat, 'style');
  const ild = getInternalSlot(__INTERNAL_SLOT_MAP__, numberFormat, 'ild');
  switch (notation) {
    case 'standard':
      return 0;
    case 'scientific':
      return magnitude;
    case 'engineering':
      return Math.floor(magnitude / 3) * 3;
    case 'compact': {
      const compactDisplay = getInternalSlot(
        __INTERNAL_SLOT_MAP__,
        numberFormat,
        'compactDisplay'
      );
      const currencyDisplay = getInternalSlot(
        __INTERNAL_SLOT_MAP__,
        numberFormat,
        'currencyDisplay'
      );
      let thresholdMap;
      if (style === 'currency' && currencyDisplay !== 'name') {
        thresholdMap =
          (compactDisplay === 'long'
            ? ild.currency.compactLong
            : ild.currency.compactShort) || ild.currency.compactShort;
      } else {
        thresholdMap =
          compactDisplay === 'long'
            ? ild.decimal.compactLong
            : ild.decimal.compactShort;
      }
      if (!thresholdMap) {
        return 0;
      }
      const num = String(10 ** magnitude) as DecimalFormatNum;
      const thresholds = Object.keys(thresholdMap) as DecimalFormatNum[]; // TODO: this can be pre-processed
      if (!thresholdMap[num]?.other) {
        return 0;
      }
      if (num < thresholds[0]) {
        return 0;
      }
      if (num > thresholds[thresholds.length - 1]) {
        return getMagnitude(+thresholds[thresholds.length - 1]);
      }
      let i = thresholds.indexOf(num);
      for (
        ;
        i > 0 &&
        thresholdMap[thresholds[i - 1]].other === thresholdMap[num].other;
        i--
      );
      return getMagnitude(+thresholds[i]);
    }
  }
}

/**
 * https://tc39.es/proposal-unified-intl-numberformat/section11/numberformat_proposed_out.html#sec-getnumberformatpattern
 *
 * The abstract operation GetNumberFormatPattern considers the resolved unit-related options in the
 * number format object along with the final scaled and rounded number being formatted and returns a
 * pattern, a String value as described in 1.3.3.
 */
function getNumberFormatPattern(
  numberFormat: UnifiedNumberFormat,
  x: number,
  exponent: number
): string {
  const {style, patterns: slots} = getMultiInternalSlots(
    __INTERNAL_SLOT_MAP__,
    numberFormat,
    'style',
    'patterns',
    'signDisplay',
    'notation'
  );
  let patterns: SignDisplayPattern;

  switch (style) {
    case 'percent':
      patterns = slots.percent;
      break;
    case 'unit': {
      const unitDisplay = getInternalSlot(
        __INTERNAL_SLOT_MAP__,
        numberFormat,
        'unitDisplay'
      );
      const unit = getInternalSlot(__INTERNAL_SLOT_MAP__, numberFormat, 'unit');
      patterns = slots.unit[unit!][unitDisplay!];
      break;
    }
    case 'currency': {
      const {currency, currencyDisplay, currencySign} = getMultiInternalSlots(
        __INTERNAL_SLOT_MAP__,
        numberFormat,
        'currency',
        'currencyDisplay',
        'currencySign'
      );
      patterns = slots.currency[currency!][currencyDisplay][currencySign];
      break;
    }
    case 'decimal':
      patterns = slots.decimal;
      break;
  }
  const notation = getInternalSlot(
    __INTERNAL_SLOT_MAP__,
    numberFormat,
    'notation'
  );
  const signDisplay = getInternalSlot(
    __INTERNAL_SLOT_MAP__,
    numberFormat,
    'signDisplay'
  );

  const signDisplayPattern = patterns[signDisplay];
  let signPattern: SignPattern | undefined;
  if (!isNaN(x) && isFinite(x)) {
    if (notation === 'scientific' || notation === 'engineering') {
      signPattern = signDisplayPattern.scientific;
    } else if (exponent !== 0) {
      invariant(notation === 'compact', 'notation must be compact');
      const compactDisplay = getInternalSlot(
        __INTERNAL_SLOT_MAP__,
        numberFormat,
        'compactDisplay'
      );
      const decimalNum = String(10 ** exponent) as '1000';
      if (compactDisplay === 'short' && exponent > 2 && exponent < 15) {
        signPattern = signDisplayPattern.compactShort[decimalNum];
      } else if (exponent > 2 && exponent < 15) {
        invariant(compactDisplay === 'long', 'compactDisplay must be long');
        signPattern = signDisplayPattern.compactLong[decimalNum];
      }
    }
  }

  if (!signPattern) {
    signPattern = signDisplayPattern.standard;
  }

  let pattern: string;
  if (signDisplay === 'never') {
    pattern = signPattern.zeroPattern;
  } else if (signDisplay === 'auto') {
    if (objectIs(x, 0) || x > 0 || isNaN(x)) {
      pattern = signPattern.zeroPattern;
    } else {
      pattern = signPattern.negativePattern;
    }
  } else if (signDisplay === 'always') {
    if (objectIs(x, 0) || x > 0 || isNaN(x)) {
      pattern = signPattern.positivePattern;
    } else {
      pattern = signPattern.negativePattern;
    }
  } else {
    invariant(signDisplay === 'exceptZero', 'signDisplay must be exceptZero');
    if (objectIs(x, 0) || isNaN(x)) {
      pattern = signPattern.zeroPattern;
    } else if (x > 0 || objectIs(x, +0)) {
      pattern = signPattern.positivePattern;
    } else {
      pattern = signPattern.negativePattern;
    }
  }

  return pattern;
}

function selectPlural<T>(
  pl: Intl.PluralRules,
  x: number,
  rules: LDMLPluralRuleMap<T>
): T {
  return rules[pl.select(x) as LDMLPluralRule] || rules.other;
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
    Object.defineProperty(UnifiedNumberFormat.prototype, Symbol.toStringTag, {
      configurable: true,
      enumerable: false,
      writable: false,
      value: 'Object',
    });
  }

  // https://github.com/tc39/test262/blob/master/test/intl402/NumberFormat/length.js
  Object.defineProperty(UnifiedNumberFormat.prototype.constructor, 'length', {
    configurable: true,
    enumerable: false,
    writable: false,
    value: 0,
  });
  // https://github.com/tc39/test262/blob/master/test/intl402/NumberFormat/supportedLocalesOf/length.js
  Object.defineProperty(UnifiedNumberFormat.supportedLocalesOf, 'length', {
    configurable: true,
    enumerable: false,
    writable: false,
    value: 1,
  });

  Object.defineProperty(UnifiedNumberFormat, 'prototype', {
    configurable: false,
    enumerable: false,
    writable: false,
    value: UnifiedNumberFormat.prototype,
  });
} catch (e) {
  // Meta fix so we're test262-compliant, not important
}

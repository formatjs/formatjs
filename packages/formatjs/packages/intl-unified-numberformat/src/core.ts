import {Unit} from './units-constants';
import {
  createResolveLocale,
  toObject,
  UnifiedNumberFormatLocaleData,
  supportedLocales,
  getCanonicalLocales,
  getNumberOption,
  unpackData,
  setInternalSlot,
  setMultiInternalSlots,
  getMultiInternalSlots,
  getOption,
  getInternalSlot,
  NumberInternalSlots,
  SignDisplayPattern,
  NotationPattern,
  defaultNumberOption,
  SignPattern,
  InternalSlotToken,
  LDMLPluralRule,
} from '@formatjs/intl-utils';
import {merge, repeat} from 'lodash';
import {toRawFixed, toRawPrecision, RawNumberFormatResult} from './utils';

function generateContinuousILND(startChar: string): string[] {
  const startCharCode = startChar.charCodeAt(0);
  const arr = new Array<string>(10);
  for (let i = 0; i < 10; i++) {
    arr[i] = String.fromCharCode(startCharCode + i);
  }
  return arr;
}

// https://tc39.es/proposal-unified-intl-numberformat/section11/numberformat_proposed_out.html#table-numbering-system-digits
const ILND: Record<string, string[]> = (function() {
  return {
    arab: generateContinuousILND('\u0660'),
    arabext: generateContinuousILND('\u06f0'),
    bali: generateContinuousILND('\u1b50'),
    beng: generateContinuousILND('\u09e6'),
    deva: generateContinuousILND('\u0966'),
    fullwide: generateContinuousILND('\uff10'),
    gujr: generateContinuousILND('\u0ae6'),
    guru: generateContinuousILND('\u0a66'),
    khmr: generateContinuousILND('\u17e0'),
    knda: generateContinuousILND('\u0ce6'),
    laoo: generateContinuousILND('\u0ed0'),
    latn: generateContinuousILND('\u0030'),
    limb: generateContinuousILND('\u1946'),
    mlym: generateContinuousILND('\u0d66'),
    mong: generateContinuousILND('\u1810'),
    mymr: generateContinuousILND('\u1040'),
    orya: generateContinuousILND('\u0b66'),
    tamldec: generateContinuousILND('\u0be6'),
    telu: generateContinuousILND('\u0c66'),
    thai: generateContinuousILND('\u0e50'),
    tibt: generateContinuousILND('\u0f20'),
    hanidec: [
      '\u3007',
      '\u4e00',
      '\u4e8c',
      '\u4e09',
      '\u56db',
      '\u4e94',
      '\u516d',
      '\u4e03',
      '\u516b',
      '\u4e5d',
    ],
  };
})();

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

export interface UnifiedNumberFormatOptions extends Intl.NumberFormatOptions {
  style?: 'decimal' | 'percent' | 'currency' | 'unit';
  compactDisplay?: 'short' | 'long';
  currencyDisplay?: 'symbol' | 'code' | 'name' | 'narrowSymbol';
  currencySign?: 'standard' | 'accounting';
  notation?: 'standard' | 'scientific' | 'engineering' | 'compact';
  signDisplay?: 'auto' | 'always' | 'never' | 'exceptZero';
  unit?: Unit;
  unitDisplay?: 'long' | 'short' | 'narrow';
  minimumIntegerDigits?: number;
  minimumFractionDigits?: number;
  maximumFractionDigits?: number;
  minimumSignificantDigits?: number;
  maximumSignificantDigits?: number;
}

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
  | 'unit';

export interface UnifiedNumberFormatPart {
  type: UnifiedNumberFormatPartTypes;
  value: string;
}

interface UnifiedNumberFormatInternal {
  locale: string;
  dataLocale: string;
  style: NonNullable<UnifiedNumberFormatOptions['style']>;
  currency?: string;
  currencyDisplay: NonNullable<UnifiedNumberFormatOptions['currencyDisplay']>;
  unit?: string;
  unitDisplay: NonNullable<UnifiedNumberFormatOptions['unitDisplay']>;
  currencySign: NonNullable<UnifiedNumberFormatOptions['currencySign']>;
  roundingType: 'significantDigits' | 'fractionDigits' | 'compactRounding';
  notation: NonNullable<UnifiedNumberFormatOptions['notation']>;
  compactDisplay: NonNullable<UnifiedNumberFormatOptions['compactDisplay']>;
  signDisplay: NonNullable<UnifiedNumberFormatOptions['signDisplay']>;
  useGrouping: boolean;
  minimumIntegerDigits: number;
  minimumFractionDigits: number;
  maximumFractionDigits: number;
  minimumSignificantDigits?: number;
  maximumSignificantDigits?: number;
  // Locale-dependent formatter data
  ildData: NumberInternalSlots;
  numberingSystem?: string;
}

const __INTERNAL_SLOT_MAP__ = new WeakMap<
  UnifiedNumberFormat,
  UnifiedNumberFormatInternal
>();

export class UnifiedNumberFormat
  implements Omit<Intl.NumberFormat, 'formatToParts'> {
  // private nf: Intl.NumberFormat;
  private pl: Intl.PluralRules;
  // private unitPattern?: UnitData;
  // private currencyNarrowSymbol?: string;
  constructor(
    locales?: string | string[],
    options: UnifiedNumberFormatOptions = {}
  ) {
    options = options === undefined ? Object.create(null) : toObject(options);
    // TODO
    const {...coreOpts} = options;

    // https://tc39.es/proposal-unified-intl-numberformat/section11/numberformat_proposed_out.html#sec-initializenumberformat
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
    const requestedLocales = getCanonicalLocales(locales);
    const r = createResolveLocale(UnifiedNumberFormat.getDefaultLocale)(
      UnifiedNumberFormat.availableLocales,
      requestedLocales,
      opt,
      UnifiedNumberFormat.relevantExtensionKeys,
      localeData
    );
    setMultiInternalSlots(__INTERNAL_SLOT_MAP__, this, {
      locale: r.locale,
      dataLocale: r.dataLocale,
      numberingSystem: r.nu,
      ildData: localeData[r.locale],
    });

    // https://tc39.es/proposal-unified-intl-numberformat/section11/numberformat_proposed_out.html#sec-setnumberformatunitoptions
    const style = getOption(
      options,
      'style',
      'string',
      ['decimal', 'percent', 'currency', 'unit'],
      'decimal'
    );
    const currency = getOption(
      options,
      'currency',
      'string',
      undefined,
      undefined
    );
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
    const unitDisplay = getOption(
      options,
      'unitDisplay',
      'string',
      ['short', 'narrow', 'long'],
      'short'
    );
    if (style === 'currency') {
      if (currency === undefined) {
        throw TypeError('Currency code is required with currency style.');
      }
      // TODO: coerce and validate currency code
    } else if (style === 'unit') {
      if (unit === undefined) {
        throw TypeError('Invalid unit argument for Intl.NumberFormat()');
      }
      // TODO: validate unit
    }
    setMultiInternalSlots(__INTERNAL_SLOT_MAP__, this, {
      style,
      currency,
      currencyDisplay,
      currencySign,
      unit,
      unitDisplay,
    });
    // ---

    let mnfdDefault: number;
    let mxfdDefault: number;
    if (style === 'currency') {
      // TODO: return minor currency units value
      const currencyDigits = (_currency: string) => 2;
      let cDigits = currency ? currencyDigits(currency) : 2;
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
    setInternalSlot(__INTERNAL_SLOT_MAP__, this, 'notation', notation);

    // https://tc39.es/proposal-unified-intl-numberformat/section11/numberformat_proposed_out.html#sec-setnfdigitoptions
    let mnid = getNumberOption(options, 'minimumIntegerDigits', 1, 21, 1);
    let mnfd = options.minimumFractionDigits;
    let mxfd = options.maximumFractionDigits;
    let mnsd = options.minimumSignificantDigits;
    let mxsd = options.maximumSignificantDigits;
    setInternalSlot(__INTERNAL_SLOT_MAP__, this, 'minimumIntegerDigits', mnid);
    if (mnsd !== undefined || mxsd !== undefined) {
      mnsd = defaultNumberOption(mnsd, 1, 21, 1);
      setMultiInternalSlots(__INTERNAL_SLOT_MAP__, this, {
        roundingType: 'significantDigits',
        minimumSignificantDigits: mnsd,
        maximumSignificantDigits: defaultNumberOption(mxsd, mnsd, 21, 21),
      });
    } else if (mnfd !== undefined || mxfd !== undefined) {
      mnfd = defaultNumberOption(mnfd, 0, 20, mnfdDefault);
      let mxfdActualDefault = Math.max(mnfd, mxfdDefault);
      setMultiInternalSlots(__INTERNAL_SLOT_MAP__, this, {
        roundingType: 'fractionDigits',
        minimumFractionDigits: mnfd,
        maximumFractionDigits: defaultNumberOption(
          mxfd,
          mnfd,
          20,
          mxfdActualDefault
        ),
      });
    } else if (notation === 'compact') {
      setInternalSlot(
        __INTERNAL_SLOT_MAP__,
        this,
        'roundingType',
        'compactRounding'
      );
    } else {
      setMultiInternalSlots(__INTERNAL_SLOT_MAP__, this, {
        roundingType: 'fractionDigits',
        minimumFractionDigits: mnfdDefault,
        maximumFractionDigits: mxfdDefault,
      });
    }
    // ---

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
        this,
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
    const signDisplay = getOption(
      options,
      'signDisplay',
      'string',
      ['auto', 'never', 'always', 'exceptZero'],
      'auto'
    );
    setMultiInternalSlots(__INTERNAL_SLOT_MAP__, this, {
      useGrouping,
      signDisplay,
    });

    this.pl = new Intl.PluralRules(locales);
  }

  format(num: number) {
    return this.formatToParts(num)
      .map(x => x.value)
      .join('');
  }

  formatToParts(num: number): UnifiedNumberFormatPart[] {
    // https://tc39.es/proposal-unified-intl-numberformat/section11/numberformat_proposed_out.html#sec-partitionnumberpattern
    let exponent = 0;
    const ildData = getInternalSlot(__INTERNAL_SLOT_MAP__, this, 'ildData');
    let n: string;
    if (isNaN(exponent)) {
      n = ildData.ild.symbols.nan;
    } else if (num === +Infinity || num === -Infinity) {
      n = ildData.ild.symbols.infinity;
    } else {
      if (getInternalSlot(__INTERNAL_SLOT_MAP__, this, 'style') === 'percent') {
        num *= 100;
      }
      let exponent = computeExponent(this, num);
      num = num * Math.pow(10, -exponent);
      let formatNumberResult = formatNumberToString(this, num);
      n = formatNumberResult.formattedString;
      num = formatNumberResult.roundedNumber;
    }
    let pattern = getNumberFormatPattern(this, num, exponent);
    let patternParts = pattern.split(/({\w+})/).filter(x => x);
    let results: UnifiedNumberFormatPart[] = [];
    for (const part of patternParts) {
      if (part[0] !== '{') {
        results.push({type: 'literal', value: part});
      } else {
        let p = part.substr(1, part.length - 2);
        switch (p) {
          case InternalSlotToken.number: {
            if (isNaN(num)) {
              results.push({type: 'nan', value: n});
            } else if (num === Infinity || num === -Infinity) {
              results.push({type: 'infinity', value: n});
            } else {
              const {numberingSystem: nu, useGrouping} = getMultiInternalSlots(
                __INTERNAL_SLOT_MAP__,
                this,
                'numberingSystem',
                'useGrouping'
              );
              if (nu && ILND.hasOwnProperty(nu)) {
                // Replace digits
                const replacementTable = ILND[nu];
                let replacedDigits = '';
                for (let digit of n) {
                  replacedDigits += replacementTable[+digit];
                }
                n = replacedDigits;
              } else {
                // From spec:
                // Else use an implementation dependent algorithm to map n to the appropriate
                // representation of n in the given numbering system.
              }
              let decimalSepIndex = n.indexOf('.');
              let integer: string;
              let fraction: string | undefined;
              if (decimalSepIndex > 0) {
                integer = n.substr(0, decimalSepIndex);
                fraction = n.substr(decimalSepIndex + 1);
              } else {
                integer = n;
              }
              if (useGrouping) {
                // TODO
                // let groupSepSymbol = ildData.ild.symbols.group;
                // // Let groups be a List whose elements are, in left to right order, the substrings
                // // defined by ILND set of locations within the integer.
                // let groups: string[] = [];
              } else {
                results.push({type: 'integer', value: integer});
              }
              if (fraction !== undefined) {
                results.push(
                  {type: 'decimal', value: ildData.ild.symbols.decimal},
                  {type: 'fraction', value: fraction}
                );
              }
            }
            break;
          }
          case InternalSlotToken.plusSign:
            results.push({
              type: 'plusSign',
              value: ildData.ild.symbols.plusSign,
            });
            break;
          case InternalSlotToken.minusSign:
            results.push({
              type: 'minusSign',
              value: ildData.ild.symbols.minusSign,
            });
            break;
          case InternalSlotToken.compactSymbol:
          case InternalSlotToken.compactName:
            // TODO
            throw Error('not implemented');
          case InternalSlotToken.scientificSeparator:
            results.push({
              type: 'exponentSeparator',
              value: ildData.ild.symbols.exponential,
            });
            break;
          case InternalSlotToken.scientificExponent: {
            if (exponent < 0) {
              results.push({
                type: 'exponentMinusSign',
                value: ildData.ild.symbols.minusSign,
              });
              exponent = -exponent;
            }
            let exponentResult = toRawFixed(exponent, 0, 0);
            results.push({
              type: 'exponentInteger',
              value: exponentResult.formattedString,
            });
            break;
          }
          case InternalSlotToken.percentSign:
            results.push({
              type: 'percentSign',
              value: ildData.ild.symbols.percentSign,
            });
            break;
          case InternalSlotToken.unitSymbol:
          case InternalSlotToken.unitNarrowSymbol:
          case InternalSlotToken.unitName: {
            const style = getInternalSlot(__INTERNAL_SLOT_MAP__, this, 'style');
            if (style === 'unit') {
              const unit = getInternalSlot(__INTERNAL_SLOT_MAP__, this, 'unit');
              const unitSymbols = ildData.ild.unitSymbols[unit!];
              let mu = selectPlural(
                this.pl,
                num,
                unitSymbols[p] || unitSymbols[InternalSlotToken.unitSymbol]
              );
              results.push({type: 'unit', value: mu});
            }
            break;
          }
          case InternalSlotToken.currencyCode:
          case InternalSlotToken.currencySymbol:
          case InternalSlotToken.currencyNarrowSymbol:
          case InternalSlotToken.currencyName: {
            const style = getInternalSlot(__INTERNAL_SLOT_MAP__, this, 'style');
            if (style === 'currency') {
              const currency = getInternalSlot(
                __INTERNAL_SLOT_MAP__,
                this,
                'currency'
              )!;
              let cd: string | undefined;
              if (p === InternalSlotToken.currencyCode) {
                cd = currency;
              } else if (p === InternalSlotToken.currencyName) {
                cd = selectPlural(
                  this.pl,
                  num,
                  ildData.ild.currencySymbols[currency].currencyName
                );
              } else {
                cd = ildData.ild.currencySymbols[currency][p];
              }
              results.push({type: 'unit', value: cd || currency});
            }
            break;
          }
          default:
            throw Error('impossible');
        }
      }
    }
    return results;
  }

  resolvedOptions(): ResolvedUnifiedNumberFormatOptions {
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
  }

  public static supportedLocalesOf(
    locales: string | string[],
    options?: Pick<UnifiedNumberFormatOptions, 'localeMatcher'>
  ) {
    return supportedLocales(
      UnifiedNumberFormat.availableLocales,
      getCanonicalLocales(locales),
      options as {localeMatcher: 'best fit' | 'lookup'}
    );
  }

  public static __addLocaleData(...data: UnifiedNumberFormatLocaleData[]) {
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
      availableLocales.forEach(locale => {
        try {
          UnifiedNumberFormat.localeData[locale] = unpackData(
            locale,
            datum,
            (all, d) => merge({}, all, d)
          );
        } catch (e) {
          // If we can't unpack this data, ignore the locale
        }
      });
    }
    UnifiedNumberFormat.availableLocales = Object.keys(
      UnifiedNumberFormat.localeData
    );
    if (!UnifiedNumberFormat.__defaultLocale) {
      UnifiedNumberFormat.__defaultLocale =
        UnifiedNumberFormat.availableLocales[0];
    }
  }
  static localeData: UnifiedNumberFormatLocaleData['data'] = {};
  private static availableLocales: string[] = [];
  private static __defaultLocale = 'en';
  private static getDefaultLocale() {
    return UnifiedNumberFormat.__defaultLocale;
  }
  // private static relevantExtensionKeys = ['nu'];
  private static relevantExtensionKeys = [];
  public static polyfilled = true;
}

interface FormatNumberResult {
  roundedNumber: number;
  formattedString: string;
}

// Taking the shortcut here and used the native NumberFormat for formatting numbers.
function formatNumberToString(
  numberFormat: UnifiedNumberFormat,
  x: number
): FormatNumberResult {
  let isNegative = x < 0 || 1 / x === -Infinity;
  if (isNegative) {
    x = -x;
  }
  const intlObject = getMultiInternalSlots(
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
  if (intlObject.roundingType === 'significantDigits') {
    result = toRawPrecision(
      x,
      intlObject.minimumSignificantDigits!,
      intlObject.maximumSignificantDigits!
    );
  } else if (intlObject.roundingType === 'fractionDigits') {
    result = toRawFixed(
      x,
      intlObject.minimumFractionDigits,
      intlObject.maximumFractionDigits
    );
  } else {
    result = toRawFixed(x, 0, 0);
    if (result.integerDigitsCount === 1) {
      result = toRawPrecision(x, 1, 2);
    }
  }
  x = result.roundedNumber;
  let string = result.formattedString;
  let int = result.integerDigitsCount;
  let minInteger = intlObject.minimumIntegerDigits;
  if (int < minInteger) {
    let forwardZeros = repeat('0', minInteger - int);
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
  let magnitude = Math.floor(Math.log(x) / Math.log(10));
  let exponent = computeExponentForMagnitude(numberFormat, magnitude);
  x = x * Math.pow(10, -exponent);
  const formatNumberResult = formatNumberToString(numberFormat, x);
  if (formatNumberResult.roundedNumber === 0) {
    return exponent;
  }
  let newMagnitude = Math.floor(Math.log(x) / Math.log(10));
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
  switch (notation) {
    case 'standard':
      return 0;
    case 'scientific':
      return magnitude;
    case 'engineering':
      return Math.floor(magnitude / 3) * 3;
    case 'compact': {
      // TODO: implement this
      // TODO: verify if we can dedup ild.{decimal,currency}.compactShort.
      throw Error('`compact` is not implemented yet.');
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
  const {style, ildData, signDisplay, notation} = getMultiInternalSlots(
    __INTERNAL_SLOT_MAP__,
    numberFormat,
    'style',
    'ildData',
    'signDisplay',
    'notation'
  );
  let patterns: SignDisplayPattern;

  switch (style) {
    case 'percent':
      patterns = ildData.patterns.percent;
      break;
    case 'unit': {
      const unitDisplay = getInternalSlot(
        __INTERNAL_SLOT_MAP__,
        numberFormat,
        'unitDisplay'
      );
      patterns = ildData.patterns.unit[unitDisplay!];
      break;
    }
    case 'currency': {
      // ??? something is wrong
      throw Error('not implemented');
      // const {currency, currencySign, currencyDisplay} = getMultiInternalSlots(
      //   __INTERNAL_SLOT_MAP__,
      //   numberFormat,
      //   'currency',
      //   'currencySign',
      //   'currencyDisplay'
      // );
      // patterns = ildData.patterns.currency[currencySign!];
    }
    case 'decimal':
      patterns = ildData.patterns.decimal;
      break;
  }

  let displayNotation: keyof NotationPattern = 'standard';
  if (notation === 'scientific' || notation === 'engineering') {
    displayNotation = 'scientific';
  } else if (exponent !== 0) {
    // Assert: notation is "compact".
    let compactDisplay = getInternalSlot(
      __INTERNAL_SLOT_MAP__,
      numberFormat,
      'compactDisplay'
    )!;
    displayNotation =
      compactDisplay === 'short' ? 'compactShort' : 'compactLong';
  }

  let sign: keyof SignPattern;
  if (!isNaN(x) && (x < 0 || 1 / x === -Infinity)) {
    sign = 'negativePattern';
  } else if (x === 0) {
    sign = 'zeroPattern';
  } else {
    sign = 'positivePattern';
  }
  return patterns[signDisplay][displayNotation][sign];
}

function selectPlural(
  pl: Intl.PluralRules,
  x: number,
  rules: string | Record<LDMLPluralRule, string>
): string {
  return typeof rules === 'string'
    ? rules
    : rules[pl.select(x) === 'one' ? 'one' : 'other'];
}

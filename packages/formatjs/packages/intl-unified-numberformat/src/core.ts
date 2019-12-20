import {Unit} from './units-constants';
import {
  createResolveLocale,
  toObject,
  UnifiedNumberFormatLocaleData,
  supportedLocales,
  getCanonicalLocales,
  unpackData,
  setInternalSlot,
  setMultiInternalSlots,
  getMultiInternalSlots,
  getOption,
  getInternalSlot,
  NumberInternalSlots,
  SignDisplayPattern,
  NotationPattern,
  SignPattern,
  InternalSlotToken,
  LDMLPluralRule,
  RawNumberLocaleData,
  DecimalFormatNum,
  setNumberFormatDigitOptions,
  NumberFormatDigitOptions,
  NumberFormatDigitInternalSlots,
  LDMLPluralRuleMap,
} from '@formatjs/intl-utils';
import {
  toRawFixed,
  toRawPrecision,
  RawNumberFormatResult,
  logBase10,
  repeat,
} from './utils';
import {ILND, rawDataToInternalSlots} from './data';
import * as currencyDigitsData from './currency-digits.json';

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

export type UnifiedNumberFormatOptions = Intl.NumberFormatOptions &
  NumberFormatDigitOptions & {
    style?: 'decimal' | 'percent' | 'currency' | 'unit';
    compactDisplay?: 'short' | 'long';
    currencyDisplay?: 'symbol' | 'code' | 'name' | 'narrowSymbol';
    currencySign?: 'standard' | 'accounting';
    notation?: 'standard' | 'scientific' | 'engineering' | 'compact';
    signDisplay?: 'auto' | 'always' | 'never' | 'exceptZero';
    unit?: Unit;
    unitDisplay?: 'long' | 'short' | 'narrow';
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
  | 'unit';

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
  // Locale-dependent formatter data
  ildData: NumberInternalSlots;
  numberingSystem: string;
}

const __INTERNAL_SLOT_MAP__ = new WeakMap<
  UnifiedNumberFormat,
  UnifiedNumberFormatInternal
>();

function currencyDigits(c: string): number {
  return c in currencyDigitsData ? currencyDigitsData[c as 'ADP'] : 2;
}

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
    const ildData = localeData[r.locale];
    setMultiInternalSlots(__INTERNAL_SLOT_MAP__, this, {
      locale: r.locale,
      dataLocale: r.dataLocale,
      numberingSystem: r.nu || ildData.nu[0],
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
      if (!currency || !ildData.ild.currencySymbols[currency.toUpperCase()]) {
        throw TypeError('Currency code is required with currency style.');
      }
    } else if (style === 'unit') {
      if (!unit || !ildData.ild.unitSymbols[unit.toLowerCase()]) {
        throw TypeError('Invalid unit argument for Intl.NumberFormat()');
      }
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
      // `currency` is checked above.
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
    setInternalSlot(__INTERNAL_SLOT_MAP__, this, 'notation', notation);

    setNumberFormatDigitOptions(
      __INTERNAL_SLOT_MAP__,
      this,
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

  formatToParts(x: number): UnifiedNumberFormatPart[] {
    // https://tc39.es/proposal-unified-intl-numberformat/section11/numberformat_proposed_out.html#sec-partitionnumberpattern
    let exponent = 0;
    const ildData = getInternalSlot(__INTERNAL_SLOT_MAP__, this, 'ildData');
    let n: string;
    if (isNaN(x)) {
      n = ildData.ild.symbols.nan;
    } else if (!isFinite(x)) {
      n = ildData.ild.symbols.infinity;
    } else {
      if (getInternalSlot(__INTERNAL_SLOT_MAP__, this, 'style') === 'percent') {
        x *= 100;
      }
      exponent = computeExponent(this, x);
      x /= 10 ** exponent;
      const formatNumberResult = formatNumberToString(this, x);
      n = formatNumberResult.formattedString;
      x = formatNumberResult.roundedNumber;
    }
    const pattern = getNumberFormatPattern(this, x, exponent);
    const patternParts = pattern.split(/({\w+})/).filter(Boolean);
    const results: UnifiedNumberFormatPart[] = [];
    for (const part of patternParts) {
      if (part[0] !== '{') {
        results.push({type: 'literal', value: part});
      } else {
        const p = part.slice(1, -1);
        switch (p) {
          case InternalSlotToken.number: {
            if (isNaN(x)) {
              results.push({type: 'nan', value: n});
            } else if (x === Infinity || x === -Infinity) {
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
              if (useGrouping) {
                const groupSepSymbol = ildData.ild.symbols.group;
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
            const compactData =
              ildData.ild.decimal[
                p === 'compactName' ? 'compactLong' : 'compactShort'
              ];
            if (compactData) {
              results.push({
                type: 'compact',
                value: selectPlural(
                  this.pl,
                  x,
                  compactData[String(10 ** exponent) as DecimalFormatNum]
                ),
              });
            }
            break;
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
              const mu = selectPlural(
                this.pl,
                x,
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
            const currency = getInternalSlot(
              __INTERNAL_SLOT_MAP__,
              this,
              'currency'
            )!;
            let cd: string;
            if (p === InternalSlotToken.currencyCode) {
              cd = currency;
            } else if (p === InternalSlotToken.currencyName) {
              // TODO: make plural work with scientific notation
              cd = selectPlural(
                this.pl,
                x,
                ildData.ild.currencySymbols[currency].currencyName
              );
            } else {
              cd = ildData.ild.currencySymbols[currency][p];
            }
            results.push({type: 'currency', value: cd});
            break;
          }
          default:
            throw Error(`unrecognized pattern part "${p}" in "${pattern}"`);
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

  public static __addLocaleData(...data: RawNumberLocaleData[]) {
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
          const {units, currencies, numbers} = unpackData(locale, datum);
          UnifiedNumberFormat.localeData[locale] = rawDataToInternalSlots(
            units!,
            currencies!,
            numbers!,
            'latn'
          );
        } catch (e) {
          // Ignore if we don't have data
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
  const isNegative = x < 0 || x === -0;
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
      intlObject.minimumFractionDigits!,
      intlObject.maximumFractionDigits!
    );
  } else {
    result = toRawFixed(x, 0, 0);
    if (result.integerDigitsCount === 1) {
      result = toRawPrecision(x, 1, 2);
    }
  }
  x = result.roundedNumber;
  let string = result.formattedString;
  const int = result.integerDigitsCount;
  const minInteger = intlObject.minimumIntegerDigits;
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
  const magnitude = logBase10(x);
  const exponent = computeExponentForMagnitude(numberFormat, magnitude);
  x = x / 10 ** exponent; // potential IEEE floating point error
  const formatNumberResult = formatNumberToString(numberFormat, x);
  if (formatNumberResult.roundedNumber === 0) {
    return exponent;
  }
  const newMagnitude = logBase10(x);
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
  const ildData = getInternalSlot(
    __INTERNAL_SLOT_MAP__,
    numberFormat,
    'ildData'
  );
  switch (notation) {
    case 'standard':
      return 0;
    case 'scientific':
      return magnitude;
    case 'engineering':
      return Math.floor(magnitude / 3) * 3;
    case 'compact': {
      const symbols =
        style === 'decimal' ? ildData.ild.decimal : ildData.ild.currency;
      const thresholdMap = symbols.compactLong || symbols.compactShort;
      if (!thresholdMap) {
        return 0;
      }
      // Going back from 100 trillion to 1 thousand, find the first magnitude threshold that's right below
      // out magnitude
      return (
        Object.keys(thresholdMap)
          // TODO: this can be pre-processed
          .map(t => logBase10(+t))
          .reverse()
          .find(m => magnitude > m) || 0
      );
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
      const unit = getInternalSlot(__INTERNAL_SLOT_MAP__, numberFormat, 'unit');
      patterns = ildData.patterns.unit[unit!][unitDisplay!];
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
      patterns =
        ildData.patterns.currency[currency!][currencyDisplay][currencySign];
      break;
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
    const compactDisplay = getInternalSlot(
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
  rules: string | LDMLPluralRuleMap<string>
): string {
  return typeof rules === 'string'
    ? rules
    : rules[pl.select(x) as LDMLPluralRule] || rules.other || '';
}

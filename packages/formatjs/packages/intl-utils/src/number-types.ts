import {LDMLPluralRule} from './plural-rules-types';
import {LocaleData} from './types';

export type NumberFormatNotation =
  | 'standard'
  | 'scientific'
  | 'engineering'
  | 'compact';

export type NumberFormatRoundingType =
  | 'significantDigits'
  | 'fractionDigits'
  | 'compactRounding';

export interface NumberFormatDigitOptions {
  minimumIntegerDigits?: number;
  minimumFractionDigits?: number;
  maximumFractionDigits?: number;
  minimumSignificantDigits?: number;
  maximumSignificantDigits?: number;
}

export interface NumberFormatDigitInternalSlots {
  minimumIntegerDigits: number;
  minimumSignificantDigits?: number;
  maximumSignificantDigits?: number;
  roundingType: NumberFormatRoundingType;
  // These two properties are only used when `roundingType` is "fractionDigits".
  minimumFractionDigits?: number;
  maximumFractionDigits?: number;
  notation?: NumberFormatNotation;
}

export enum InternalSlotToken {
  // To prevent collision with {0} in CLDR
  compactName = 'compactName',
  compactSymbol = 'compactSymbol',
  currencyCode = 'currencyCode',
  currencyName = 'currencyName',
  currencyNarrowSymbol = 'currencyNarrowSymbol',
  currencySymbol = 'currencySymbol',
  minusSign = 'minusSign',
  number = 'number',
  percentSign = 'percentSign',
  plusSign = 'plusSign',
  scientificExponent = 'scientificExponent',
  scientificSeparator = 'scientificSeparator',
  unitName = 'unitName',
  unitNarrowSymbol = 'unitNarrowSymbol',
  unitSymbol = 'unitSymbol',
}

export interface SignPattern {
  positivePattern: string;
  zeroPattern: string;
  negativePattern: string;
}

export type CompactSignPattern = Record<DecimalFormatNum, SignPattern>;

export interface NotationPattern {
  standard: SignPattern;
  scientific: SignPattern;
  compactShort: CompactSignPattern;
  compactLong: CompactSignPattern;
}

export interface SignDisplayPattern {
  auto: NotationPattern;
  always: NotationPattern;
  never: NotationPattern;
  exceptZero: NotationPattern;
}

export interface CurrencySignPattern {
  standard: SignDisplayPattern;
  accounting: SignDisplayPattern;
}

export interface CurrencyPattern {
  code: CurrencySignPattern;
  symbol: CurrencySignPattern;
  narrowSymbol: CurrencySignPattern;
  name: CurrencySignPattern;
}

export interface UnitPattern {
  narrow: SignDisplayPattern;
  short: SignDisplayPattern;
  long: SignDisplayPattern;
}

export interface NumberILD {
  decimal: {
    // string when there's only 1 plural from
    compactShort?: Record<DecimalFormatNum, LDMLPluralRuleMap<string>>;
    // string when there's only 1 plural from
    compactLong?: Record<DecimalFormatNum, LDMLPluralRuleMap<string>>;
  };
  currency: {
    // string when there's only 1 plural from
    compactShort?: Record<DecimalFormatNum, LDMLPluralRuleMap<string>>;
    // string when there's only 1 plural from
    compactLong?: Record<DecimalFormatNum, LDMLPluralRuleMap<string>>;
  };
  symbols: {
    decimal: string;
    group: string;
    list: string;
    percentSign: string;
    plusSign: string;
    minusSign: string;
    exponential: string;
    superscriptingExponent: string;
    perMille: string;
    infinity: string;
    nan: string;
    timeSeparator: string;
  };
  currencySymbols: Record<
    string,
    {
      currencySymbol: string;
      currencyNarrowSymbol: string;
      currencyName: LDMLPluralRuleMap<string>;
    }
  >;
  unitSymbols: Record<
    string,
    {
      unitSymbol: LDMLPluralRuleMap<string[]>;
      unitNarrowSymbol: LDMLPluralRuleMap<string[]>;
      unitName: LDMLPluralRuleMap<string[]>;
    }
  >;
}

export interface NumberLocalePatternData {
  decimal: SignDisplayPattern;
  percent: SignDisplayPattern;
  currency: Record<string, CurrencyPattern>;
  unit: Record<string, UnitPattern>;
}
// https://github.com/tc39/proposal-unified-intl-numberformat/issues/26#issuecomment-467711707
export interface NumberInternalSlots {
  nu: string[];
  patterns: NumberLocalePatternData;
  ild: NumberILD;
}

export type NumberLocaleData = LocaleData<NumberInternalSlots>;

// All fields are optional due to de-duping
export type RawNumberLocaleData = LocaleData<NumberLocaleInternalData>;

export interface NumberLocaleInternalData {
  units: Record<string, UnitData>;
  currencies: Record<string, CurrencyData>;
  numbers: RawNumberData;
  // Bc of relevantExtensionKeys in the spec
  nu: string[];
}

export interface UnitData {
  displayName: string;
  long: LDMLPluralRuleMap<RawUnitPattern>;
  short: LDMLPluralRuleMap<RawUnitPattern>;
  narrow: LDMLPluralRuleMap<RawUnitPattern>;
}

export interface RawUnitPattern {
  pattern: string;
  // An array bc {0} can be in the middle,
  // e.g: celsius in https://github.com/unicode-cldr/cldr-units-full/blob/master/main/ja/units.json
  symbol: string[];
}

export interface CurrencyData {
  displayName: LDMLPluralRuleMap<string>;
  symbol: string;
  narrow: string;
}

export type DecimalFormatNum =
  | '1000'
  | '10000'
  | '100000'
  | '1000000'
  | '10000000'
  | '100000000'
  | '1000000000'
  | '10000000000'
  | '100000000000'
  | '1000000000000'
  | '10000000000000'
  | '100000000000000';
export type NumberingSystem = string;

/**
 * We only care about insertBetween bc we assume
 * `currencyMatch` & `surroundingMatch` are all the same
 *
 * @export
 * @interface CurrencySpacingData
 */
export interface CurrencySpacingData {
  beforeInsertBetween: string;
  afterInsertBetween: string;
}

export interface RawCurrencyData {
  currencySpacing: CurrencySpacingData;
  standard: string;
  accounting: string;
  short?: Record<DecimalFormatNum, LDMLPluralRuleMap<string>>;
  // IMPORTANT: We're making the assumption here that currency unitPattern
  // are the same for all LDMLPluralRule
  unitPattern: string;
}

export interface SymbolsData {
  decimal: string;
  group: string;
  list: string;
  percentSign: string;
  plusSign: string;
  minusSign: string;
  exponential: string;
  superscriptingExponent: string;
  perMille: string;
  infinity: string;
  nan: string;
  timeSeparator: string;
}

export interface RawNumberData {
  nu: string[];
  // numberingSystem -> pattern
  symbols: Record<NumberingSystem, SymbolsData>;
  // numberingSystem -> pattern
  decimal: Record<
    NumberingSystem,
    {
      long: Record<DecimalFormatNum, LDMLPluralRuleMap<string>>;
      short: Record<DecimalFormatNum, LDMLPluralRuleMap<string>>;
    }
  >;
  percent: Record<NumberingSystem, string>;
  currency: Record<NumberingSystem, RawCurrencyData>;
}

export type LDMLPluralRuleMap<T> = Omit<
  Partial<Record<LDMLPluralRule, T>>,
  'other'
> & {
  other: T;
};

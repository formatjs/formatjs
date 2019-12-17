import {LDMLPluralRule} from './plural-rules-types';
import {LocaleData} from './types';

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

export interface NotationPattern {
  standard: SignPattern;
  scientific: SignPattern;
  compactShort: SignPattern;
  compactLong: SignPattern;
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
    compactShort?: Record<
      DecimalFormatNum,
      string | Record<LDMLPluralRule, string>
    >;
    // string when there's only 1 plural from
    compactLong?: Record<
      DecimalFormatNum,
      string | Record<LDMLPluralRule, string>
    >;
  };
  currency: {
    // string when there's only 1 plural from
    compactShort?: Record<
      DecimalFormatNum,
      string | Record<LDMLPluralRule, string>
    >;
    // string when there's only 1 plural from
    compactLong?: Record<
      DecimalFormatNum,
      string | Record<LDMLPluralRule, string>
    >;
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
      currencyNarrowSymbol?: string;
      // string when there's only 1 plural from
      currencyName: string | Record<LDMLPluralRule, string>;
    }
  >;
  unitSymbols: Record<
    string,
    {
      // string when there's only 1 plural form
      unitSymbol: string | Record<LDMLPluralRule, string>;
      // string when there's only 1 plural from
      unitNarrowSymbol?: string | Record<LDMLPluralRule, string>;
      // string when there's only 1 plural from
      unitName: string | Record<LDMLPluralRule, string>;
    }
  >;
}

export interface NumberLocalePatternData {
  decimal: SignDisplayPattern;
  percent: SignDisplayPattern;
  currency: CurrencyPattern;
  unit: UnitPattern;
}
export interface NumberInternalSlots {
  nu: string[];
  patterns: NumberLocalePatternData;
  ild: NumberILD;
}

export type NumberLocaleData = LocaleData<NumberInternalSlots>;

export type RawNumberLocaleData = LocaleData<{
  units: Record<string, UnitData>;
  currencies: Record<string, CurrencyData>;
  numbers: RawNumberData;
}>;

export interface UnitData {
  displayName: string;
  long: string | Record<LDMLPluralRule, string>;
  short: string | Record<LDMLPluralRule, string>;
  narrow?: string | Record<LDMLPluralRule, string>;
}

export interface CurrencyData {
  displayName: string | Record<LDMLPluralRule, string>;
  symbol: string;
  narrow?: string;
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
  | '1000000000000';
export type NumberingSystem = string;

export interface CurrencySpacing {
  currencyMatch: string;
  surroundingMatch: string;
  insertBetween: string;
}

export interface RawCurrencyData {
  currencySpacing: {
    beforeCurrency: CurrencySpacing;
    afterCurrency: CurrencySpacing;
  };
  standard: string;
  accounting: string;
  short?: Record<DecimalFormatNum, string | Record<LDMLPluralRule, string>>;
  unitPattern: string | Record<LDMLPluralRule, string>;
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
      long: Record<DecimalFormatNum, string | Record<LDMLPluralRule, string>>;
      short: Record<DecimalFormatNum, string | Record<LDMLPluralRule, string>>;
    }
  >;
  // numberingSystem -> pattern
  scientific: Record<NumberingSystem, string>;
  percent: Record<NumberingSystem, string>;
  currency: Record<NumberingSystem, RawCurrencyData>;
}

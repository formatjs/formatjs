import {LDMLPluralRule} from './plural-rules-types';
import {LocaleData} from './types';

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
    compactShort?: Record<string, Record<LDMLPluralRule, string>>;
    compactLong?: Record<string, Record<LDMLPluralRule, string>>;
  };
  currency: {
    compactShort?: Record<string, Record<LDMLPluralRule, string>>;
    compactLong?: Record<string, Record<LDMLPluralRule, string>>;
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
      currencyName: Record<LDMLPluralRule, string>;
    }
  >;
  unitSymbols: Record<
    string,
    {
      unitSymbol: Record<LDMLPluralRule, string>;
      unitNarrowSymbol: Record<LDMLPluralRule, string>;
      unitName: Record<LDMLPluralRule, string>;
    }
  >;
}

export interface NumberLocalePatternData {
  decimal: SignDisplayPattern;
  percent: SignDisplayPattern;
  currency: CurrencySignPattern;
  unit: UnitPattern;
}
export interface NumberInternalSlots {
  nu: string[];
  patterns: NumberLocalePatternData;
  ild: NumberILD;
}

export type NumberLocaleData = LocaleData<NumberInternalSlots>;

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
    compactShort?: Record<string, string | Record<LDMLPluralRule, string>>;
    // string when there's only 1 plural from
    compactLong?: Record<string, string | Record<LDMLPluralRule, string>>;
  };
  currency: {
    // string when there's only 1 plural from
    compactShort?: Record<string, string | Record<LDMLPluralRule, string>>;
    // string when there's only 1 plural from
    compactLong?: Record<string, string | Record<LDMLPluralRule, string>>;
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
  currency: CurrencySignPattern;
  unit: UnitPattern;
}
export interface NumberInternalSlots {
  nu: string[];
  patterns: NumberLocalePatternData;
  ild: NumberILD;
}

export type NumberLocaleData = LocaleData<NumberInternalSlots>;

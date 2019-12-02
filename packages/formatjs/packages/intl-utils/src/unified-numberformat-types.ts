import {LocaleData} from './types';

export type UnifiedNumberFormatLocaleData = LocaleData<{
  /** unit name -> data mapping */
  units?: Record<string, UnitData>;
  // `narrowSymbol` is the only data we need.
  /** currency ISO code -> currency data mapping */
  currencies?: Record<string, Pick<CurrencyData, 'narrowSymbol'>>;
}>;

interface UnitPattern {
  one?: string;
  other?: string;
}

export interface UnitData {
  displayName: string;
  long: UnitPattern;
  short?: UnitPattern;
  narrow?: UnitPattern;
}

interface CurrencyPattern {
  one?: string;
  other: string;
}

// Data about the currency itself, NOT how to format a number to currency.
// See: https://unicode.org/reports/tr35/tr35-numbers.html#Currencies
export interface CurrencyData {
  displayName: CurrencyPattern;
  symbol: string;
  narrowSymbol?: string;
  variantSymbol?: string;
}

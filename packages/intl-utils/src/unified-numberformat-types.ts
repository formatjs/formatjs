import {LocaleData} from './types';
import {NumberInternalSlots} from './number-types';

export type UnifiedNumberFormatLocaleData = LocaleData<NumberInternalSlots>;

export type UnifiedNumberFormatOptionsLocaleMatcher = 'lookup' | 'best fit';
export type UnifiedNumberFormatOptionsStyle =
  | 'decimal'
  | 'percent'
  | 'currency'
  | 'unit';
export type UnifiedNumberFormatOptionsCompactDisplay = 'short' | 'long';
export type UnifiedNumberFormatOptionsCurrencyDisplay =
  | 'symbol'
  | 'code'
  | 'name'
  | 'narrowSymbol';
export type UnifiedNumberFormatOptionsCurrencySign = 'standard' | 'accounting';
export type UnifiedNumberFormatOptionsNotation =
  | 'standard'
  | 'scientific'
  | 'engineering'
  | 'compact';
export type UnifiedNumberFormatOptionsSignDisplay =
  | 'auto'
  | 'always'
  | 'never'
  | 'exceptZero';
export type UnifiedNumberFormatOptionsUnitDisplay = 'long' | 'short' | 'narrow';

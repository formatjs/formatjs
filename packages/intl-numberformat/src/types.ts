import {
  NumberFormatDigitOptions,
  NumberFormatDigitInternalSlots,
  NumberFormatNotation,
  NumberFormatLocaleInternalData,
  RawNumberLocaleData,
} from '@formatjs/intl-utils';

// Public --------------------------------------------------------------------------------------------------------------

export interface NumberFormat {
  resolvedOptions(): ResolvedNumberFormatOptions;
  formatToParts(x: number): NumberFormatPart[];
  format(x: number): string;
}

export interface NumberFormatConstructor {
  new (
    locales?: string | string[],
    options?: NumberFormatOptions
  ): NumberFormat;
  (locales?: string | string[], options?: NumberFormatOptions): NumberFormat;

  __addLocaleData(...data: RawNumberLocaleData[]): void;
  supportedLocalesOf(
    locales: string | string[],
    options?: Pick<NumberFormatOptions, 'localeMatcher'>
  ): string[];
  getDefaultLocale(): string;

  __defaultLocale: string;
  localeData: Record<string, NumberFormatLocaleInternalData>;
  availableLocales: string[];
  polyfilled: boolean;
}

export type NumberFormatOptionsLocaleMatcher = 'lookup' | 'best fit';
export type NumberFormatOptionsStyle =
  | 'decimal'
  | 'percent'
  | 'currency'
  | 'unit';
export type NumberFormatOptionsCompactDisplay = 'short' | 'long';
export type NumberFormatOptionsCurrencyDisplay =
  | 'symbol'
  | 'code'
  | 'name'
  | 'narrowSymbol';
export type NumberFormatOptionsCurrencySign = 'standard' | 'accounting';
export type NumberFormatOptionsNotation = NumberFormatNotation;
export type NumberFormatOptionsSignDisplay =
  | 'auto'
  | 'always'
  | 'never'
  | 'exceptZero';
export type NumberFormatOptionsUnitDisplay = 'long' | 'short' | 'narrow';

export type NumberFormatOptions = Intl.NumberFormatOptions &
  NumberFormatDigitOptions & {
    localeMatcher?: NumberFormatOptionsLocaleMatcher;
    style?: NumberFormatOptionsStyle;
    compactDisplay?: NumberFormatOptionsCompactDisplay;
    currencyDisplay?: NumberFormatOptionsCurrencyDisplay;
    currencySign?: NumberFormatOptionsCurrencySign;
    notation?: NumberFormatOptionsNotation;
    signDisplay?: NumberFormatOptionsSignDisplay;
    unit?: string;
    unitDisplay?: NumberFormatOptionsUnitDisplay;
    numberingSystem?: string;
  };

export type ResolvedNumberFormatOptions = Intl.ResolvedNumberFormatOptions &
  Pick<
    NumberFormatInternal,
    | 'currencySign'
    | 'unit'
    | 'unitDisplay'
    | 'notation'
    | 'compactDisplay'
    | 'signDisplay'
  >;

export type NumberFormatPartTypes =
  | Intl.NumberFormatPartTypes
  | 'exponentSeparator'
  | 'exponentMinusSign'
  | 'exponentInteger'
  | 'compact'
  | 'unit'
  | 'literal';

export interface NumberFormatPart {
  type: NumberFormatPartTypes;
  value: string;
}

// Internal slots ------------------------------------------------------------------------------------------------------

export interface NumberFormatInternal extends NumberFormatDigitInternalSlots {
  locale: string;
  dataLocale: string;
  style: NumberFormatOptionsStyle;
  currency?: string;
  currencyDisplay: NumberFormatOptionsCurrencyDisplay;
  unit?: string;
  unitDisplay: NumberFormatOptionsUnitDisplay;
  currencySign: NumberFormatOptionsCurrencySign;
  notation: NumberFormatOptionsNotation;
  compactDisplay: NumberFormatOptionsCompactDisplay;
  signDisplay: NumberFormatOptionsSignDisplay;
  useGrouping: boolean;
  pl: Intl.PluralRules;
  boundFormat?: Intl.NumberFormat['format'];
  numberingSystem: string;
  // Locale-dependent formatter data
  dataLocaleData: NumberFormatLocaleInternalData;
}

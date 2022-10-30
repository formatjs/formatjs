import {
  NumberFormatLocaleInternalData,
  RawNumberLocaleData,
  ResolvedNumberFormatOptions,
  NumberFormatOptions,
  NumberFormatPart,
  NumberRangeToParts,
} from '@formatjs/ecma402-abstract'

// Public --------------------------------------------------------------------------------------------------------------

export interface NumberFormat {
  resolvedOptions(): ResolvedNumberFormatOptions
  formatToParts(x: number): NumberFormatPart[]
  format(x: number): string
  formatRange(start: number, end: number): string
  formatRangeToParts(start: number, end: number): NumberRangeToParts[]
}

export interface NumberFormatConstructor {
  new (locales?: string | string[], options?: NumberFormatOptions): NumberFormat
  (locales?: string | string[], options?: NumberFormatOptions): NumberFormat

  __addLocaleData(...data: RawNumberLocaleData[]): void
  __addUnitData(
    locale: string,
    unitsData: RawNumberLocaleData['data']['units']
  ): void
  supportedLocalesOf(
    locales: string | string[],
    options?: Pick<NumberFormatOptions, 'localeMatcher'>
  ): string[]
  getDefaultLocale(): string

  __defaultLocale: string
  localeData: Record<string, NumberFormatLocaleInternalData | undefined>
  availableLocales: Set<string>
  polyfilled: boolean
}

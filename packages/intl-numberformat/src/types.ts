import {
  type NumberFormatLocaleInternalData,
  type NumberFormatOptions,
  type NumberFormatPart,
  type NumberRangeToParts,
  type RawNumberLocaleData,
  type ResolvedNumberFormatOptions,
} from '@formatjs/ecma402-abstract'
import type Decimal from 'decimal.js'

// Public --------------------------------------------------------------------------------------------------------------

export interface NumberFormat {
  resolvedOptions(): ResolvedNumberFormatOptions
  formatToParts(x: number | bigint | Decimal | string): NumberFormatPart[]
  format(x: number | bigint | Decimal | string): string
  formatRange(
    start: number | bigint | Decimal | string,
    end: number | bigint | Decimal | string
  ): string
  formatRangeToParts(
    start: number | bigint | Decimal | string,
    end: number | bigint | Decimal | string
  ): NumberRangeToParts[]
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

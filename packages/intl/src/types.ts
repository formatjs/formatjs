import {
  IntlMessageFormat,
  Formats,
  FormatXMLElementFn,
  FormatError,
  PrimitiveType,
  Options as IntlMessageFormatOptions,
} from 'intl-messageformat'
import {DateTimeFormat} from '@formatjs/ecma402-abstract'
import {MessageFormatElement} from '@formatjs/icu-messageformat-parser'
import IntlListFormat, {
  IntlListFormatOptions,
  Part,
} from '@formatjs/intl-listformat'
import {DisplayNames, DisplayNamesOptions} from '@formatjs/intl-displaynames'
import {
  MissingTranslationError,
  MessageFormatError,
  MissingDataError,
  InvalidConfigError,
  UnsupportedFormatterError,
} from './error'
import {DEFAULT_INTL_CONFIG} from './utils'
import {NumberFormatOptions} from '@formatjs/ecma402-abstract'

declare global {
  namespace FormatjsIntl {
    interface Message {}
    interface IntlConfig {}
    interface Formats {}
  }
}

type MessageIds = FormatjsIntl.Message extends {ids: string}
  ? FormatjsIntl.Message['ids']
  : string

type Locale = FormatjsIntl.IntlConfig extends {locale: string}
  ? FormatjsIntl.IntlConfig['locale']
  : string

export type OnErrorFn = (
  err:
    | MissingTranslationError
    | MessageFormatError
    | MissingDataError
    | InvalidConfigError
    | UnsupportedFormatterError
    | FormatError
) => void

export type OnWarnFn = (warning: string) => void

/**
 * Config for intl object.
 * Generic type T is the type of potential rich text element. For example:
 * With React, T would be React.ReactNode
 */
export interface ResolvedIntlConfig<T = string> {
  locale: Locale
  timeZone?: string
  fallbackOnEmptyString?: boolean
  formats: CustomFormats
  messages:
    | Record<MessageIds, string>
    | Record<MessageIds, MessageFormatElement[]>
  defaultLocale: string
  defaultFormats: CustomFormats
  defaultRichTextElements?: Record<string, FormatXMLElementFn<T>>
  onError: OnErrorFn
  onWarn?: OnWarnFn
}

export interface CustomFormats extends Partial<Formats> {
  relative?: Record<string, Intl.RelativeTimeFormatOptions>
}

export interface CustomFormatConfig<Source = string> {
  format?: Source extends keyof FormatjsIntl.Formats
    ? FormatjsIntl.Formats[Source]
    : string
}

export type FormatDateOptions = Omit<
  Intl.DateTimeFormatOptions,
  'localeMatcher'
> &
  CustomFormatConfig<'date'>
export type FormatNumberOptions = Omit<NumberFormatOptions, 'localeMatcher'> &
  CustomFormatConfig<'number'>
export type FormatRelativeTimeOptions = Omit<
  Intl.RelativeTimeFormatOptions,
  'localeMatcher'
> &
  CustomFormatConfig<'time'>
export type FormatPluralOptions = Omit<
  Intl.PluralRulesOptions,
  'localeMatcher'
> &
  CustomFormatConfig

export type FormatListOptions = Omit<IntlListFormatOptions, 'localeMatcher'>

export type FormatDisplayNameOptions = Omit<
  DisplayNamesOptions,
  'localeMatcher'
>

export interface IntlFormatters<T = any, R = T> {
  formatDateTimeRange(
    from: Parameters<DateTimeFormat['formatRange']>[0],
    to: Parameters<DateTimeFormat['formatRange']>[1],
    opts?: FormatDateOptions
  ): string
  formatDate(
    value: Parameters<Intl.DateTimeFormat['format']>[0] | string,
    opts?: FormatDateOptions
  ): string
  formatTime(
    value: Parameters<Intl.DateTimeFormat['format']>[0] | string,
    opts?: FormatDateOptions
  ): string
  formatDateToParts(
    value: Parameters<Intl.DateTimeFormat['format']>[0] | string,
    opts?: FormatDateOptions
  ): Intl.DateTimeFormatPart[]
  formatTimeToParts(
    value: Parameters<Intl.DateTimeFormat['format']>[0] | string,
    opts?: FormatDateOptions
  ): Intl.DateTimeFormatPart[]
  formatRelativeTime(
    value: Parameters<Intl.RelativeTimeFormat['format']>[0],
    unit?: Parameters<Intl.RelativeTimeFormat['format']>[1],
    opts?: FormatRelativeTimeOptions
  ): string
  formatNumber(
    value: Parameters<Intl.NumberFormat['format']>[0],
    opts?: FormatNumberOptions
  ): string
  formatNumberToParts(
    value: Parameters<Intl.NumberFormat['format']>[0],
    opts?: FormatNumberOptions
  ): Intl.NumberFormatPart[]
  formatPlural(
    value: Parameters<Intl.PluralRules['select']>[0],
    opts?: FormatPluralOptions
  ): ReturnType<Intl.PluralRules['select']>
  formatMessage(
    descriptor: MessageDescriptor,
    values?: Record<string, PrimitiveType | FormatXMLElementFn<string, string>>,
    opts?: IntlMessageFormatOptions
  ): string
  formatMessage(
    descriptor: MessageDescriptor,
    values?: Record<string, PrimitiveType | T | FormatXMLElementFn<T, R>>,
    opts?: IntlMessageFormatOptions
  ): R
  $t(
    descriptor: MessageDescriptor,
    values?: Record<string, PrimitiveType | FormatXMLElementFn<string, string>>,
    opts?: IntlMessageFormatOptions
  ): string
  $t(
    descriptor: MessageDescriptor,
    values?: Record<string, PrimitiveType | T | FormatXMLElementFn<T, R>>,
    opts?: IntlMessageFormatOptions
  ): R
  formatList(values: ReadonlyArray<string>, opts?: FormatListOptions): string
  formatList(
    values: ReadonlyArray<string | T>,
    opts?: FormatListOptions
  ): T | string | Array<string | T>
  formatListToParts(
    values: ReadonlyArray<string | T>,
    opts?: FormatListOptions
  ): Part[]
  formatDisplayName(
    value: Parameters<DisplayNames['of']>[0],
    opts: FormatDisplayNameOptions
  ): string | undefined
}

export interface Formatters {
  getDateTimeFormat(
    ...args: ConstructorParameters<typeof Intl.DateTimeFormat>
  ): DateTimeFormat
  getNumberFormat(
    locales?: string | string[],
    opts?: NumberFormatOptions
  ): Intl.NumberFormat
  getMessageFormat(
    ...args: ConstructorParameters<typeof IntlMessageFormat>
  ): IntlMessageFormat
  getRelativeTimeFormat(
    ...args: ConstructorParameters<typeof Intl.RelativeTimeFormat>
  ): Intl.RelativeTimeFormat
  getPluralRules(
    ...args: ConstructorParameters<typeof Intl.PluralRules>
  ): Intl.PluralRules
  getListFormat(
    ...args: ConstructorParameters<typeof IntlListFormat>
  ): IntlListFormat
  getDisplayNames(
    ...args: ConstructorParameters<typeof DisplayNames>
  ): DisplayNames
}

export interface IntlShape<T = string>
  extends ResolvedIntlConfig<T>,
    IntlFormatters {
  formatters: Formatters
}

export interface IntlCache {
  dateTime: Record<string, DateTimeFormat>
  number: Record<string, Intl.NumberFormat>
  message: Record<string, IntlMessageFormat>
  relativeTime: Record<string, Intl.RelativeTimeFormat>
  pluralRules: Record<string, Intl.PluralRules>
  list: Record<string, IntlListFormat>
  displayNames: Record<string, DisplayNames>
}

export interface MessageDescriptor {
  id?: MessageIds
  description?: string | object
  defaultMessage?: string | MessageFormatElement[]
}

export type IntlConfig<T = string> = Omit<
  ResolvedIntlConfig<T>,
  keyof typeof DEFAULT_INTL_CONFIG
> &
  Partial<typeof DEFAULT_INTL_CONFIG>

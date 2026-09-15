import type {
  MessageValues,
  MessageValuesOf,
  TypedMessageDescriptor,
  TypedMessageArguments,
  UntypedMessageDescriptor,
  RegisteredMessageId,
  RegisteredMessageValues,
  UnregisteredMessageDescriptor,
} from '#packages/intl/typed-message.js'
// Keep public duration types usable without native Intl.DurationFormat declarations.
import type {
  DurationFormat,
  DurationFormatOptions,
  DurationFormatPart,
  DurationInput,
} from '#packages/ecma402-abstract/types/duration.js'
import {type MessageFormatElement} from '@formatjs/icu-messageformat-parser'

import {type NumberFormatOptions} from '#packages/ecma402-abstract/types/number.js'
import type {FormatError, IntlMessageFormat} from 'intl-messageformat'
import {
  type Formats,
  type FormatXMLElementFn,
  type Options as IntlMessageFormatOptions,
  type PrimitiveType,
} from 'intl-messageformat'
import type {
  InvalidConfigError,
  MessageFormatError,
  MissingDataError,
  MissingTranslationError,
  UnsupportedFormatterError,
} from '#packages/intl/error.js'
import type {DEFAULT_INTL_CONFIG} from '#packages/intl/utils.js'

export interface Part<T = string> {
  type: 'element' | 'literal'
  value: T
}

// Note: FormatjsIntl is defined as a global namespace so the library user can
// override the default types of Message.ids (e.g. as string literal unions from extracted strings)
// or IntlConfig.locale (e.g. to a list of supported locales).
declare global {
  namespace FormatjsIntl {
    interface Message {}
    interface MessageArguments {}
    interface IntlConfig {}
    interface Formats {}
  }
}

type MessageIds = FormatjsIntl.Message extends {ids: infer T}
  ? T extends string
    ? T
    : string
  : string

type Locale = FormatjsIntl.IntlConfig extends {locale: infer T}
  ? T extends string
    ? T
    : string
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
  duration?: Record<string, DurationFormatOptions>
  relative?: Record<string, Intl.RelativeTimeFormatOptions>
  dateTimeRange?: Record<string, Intl.DateTimeFormatOptions>
}

export interface CustomFormatConfig<Source = string> {
  format?: Source extends keyof FormatjsIntl.Formats
    ? FormatjsIntl.Formats[Source]
    : string
}

export type FormatDateTimeRangeOptions = Omit<
  Intl.DateTimeFormatOptions,
  'localeMatcher'
> &
  CustomFormatConfig<'dateTimeRange'>

export type FormatDateOptions = Omit<
  Intl.DateTimeFormatOptions,
  'localeMatcher'
> &
  CustomFormatConfig<'date'>
export type FormatTimeOptions = Omit<
  Intl.DateTimeFormatOptions,
  'localeMatcher'
> &
  CustomFormatConfig<'time'>
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

export type FormatDurationOptions = Omit<
  DurationFormatOptions,
  'localeMatcher'
> &
  CustomFormatConfig<'duration'>

export type FormatListOptions = Omit<Intl.ListFormatOptions, 'localeMatcher'>

export type FormatDisplayNameOptions = Omit<
  Intl.DisplayNamesOptions,
  'localeMatcher'
>

/** A string-output formatter shared by core and framework integrations. */
export interface TextMessageFormatter {
  <V extends MessageValues = never>(
    this: void,
    descriptor: [V] extends [never] ? never : UntypedMessageDescriptor,
    ...args: TypedMessageArguments<NoInfer<V>>
  ): string
  <D extends TypedMessageDescriptor<MessageValues>>(
    this: void,
    descriptor: D,
    ...args: TypedMessageArguments<MessageValuesOf<NoInfer<D>>>
  ): string
  <const K extends RegisteredMessageId>(
    this: void,
    descriptor: UntypedMessageDescriptor & {id: K},
    ...args: TypedMessageArguments<RegisteredMessageValues<NoInfer<K>>>
  ): string
  <
    V = never,
    const D extends
      | UntypedMessageDescriptor
      | TypedMessageDescriptor<Record<string, never>> =
      | UntypedMessageDescriptor
      | TypedMessageDescriptor<Record<string, never>>,
  >(
    this: void,
    descriptor: [V] extends [never]
      ? D & UnregisteredMessageDescriptor<D>
      : never,
    values?: never,
    opts?: IntlMessageFormatOptions
  ): string
  <
    V = never,
    const D extends UntypedMessageDescriptor = UntypedMessageDescriptor,
  >(
    this: void,
    descriptor: [V] extends [never]
      ? D & UnregisteredMessageDescriptor<NoInfer<D>>
      : never,
    values?: Record<string, PrimitiveType | FormatXMLElementFn<string, string>>,
    opts?: IntlMessageFormatOptions
  ): string
}

/**
 * `TBase` is the type constraints of the rich text element in the formatted output.
 * For example, with React, `TBase` should be `React.ReactNode`.
 */
export interface IntlFormatters<TBase = unknown> {
  formatDateTimeRange(
    this: void,
    from: Parameters<Intl.DateTimeFormat['formatRange']>[0] | string,
    to: Parameters<Intl.DateTimeFormat['formatRange']>[1] | string,
    opts?: FormatDateTimeRangeOptions
  ): string
  formatDate(
    this: void,
    value: Parameters<Intl.DateTimeFormat['format']>[0] | string,
    opts?: FormatDateOptions
  ): string
  formatTime(
    this: void,
    value: Parameters<Intl.DateTimeFormat['format']>[0] | string,
    opts?: FormatTimeOptions
  ): string
  formatDateToParts(
    this: void,
    value: Parameters<Intl.DateTimeFormat['format']>[0] | string,
    opts?: FormatDateOptions
  ): Intl.DateTimeFormatPart[]
  formatTimeToParts(
    this: void,
    value: Parameters<Intl.DateTimeFormat['format']>[0] | string,
    opts?: FormatDateOptions
  ): Intl.DateTimeFormatPart[]
  formatDuration(
    this: void,
    value: DurationInput,
    opts?: FormatDurationOptions
  ): string
  formatDurationToParts(
    this: void,
    value: DurationInput,
    opts?: FormatDurationOptions
  ): DurationFormatPart[]
  formatRelativeTime(
    this: void,
    value: Parameters<Intl.RelativeTimeFormat['format']>[0],
    unit?: Parameters<Intl.RelativeTimeFormat['format']>[1],
    opts?: FormatRelativeTimeOptions
  ): string
  formatNumber(
    this: void,
    value: Parameters<Intl.NumberFormat['format']>[0],
    opts?: FormatNumberOptions
  ): string
  formatNumberToParts(
    this: void,
    value: Parameters<Intl.NumberFormat['format']>[0],
    opts?: FormatNumberOptions
  ): Intl.NumberFormatPart[]
  formatPlural(
    this: void,
    value: Parameters<Intl.PluralRules['select']>[0],
    opts?: FormatPluralOptions
  ): ReturnType<Intl.PluralRules['select']>
  formatMessage<V extends MessageValues = never, T extends TBase = TBase>(
    this: void,
    descriptor: [V] extends [never] ? never : UntypedMessageDescriptor,
    ...args: TypedMessageArguments<NoInfer<V>, string, T>
  ): string
  formatMessage<V extends MessageValues = never, T extends TBase = TBase>(
    this: void,
    descriptor: [V] extends [never] ? never : UntypedMessageDescriptor,
    ...args: TypedMessageArguments<NoInfer<V>, T>
  ): string | T | Array<string | T>
  formatMessage<D extends TypedMessageDescriptor<MessageValues>>(
    this: void,
    descriptor: D,
    ...args: TypedMessageArguments<MessageValuesOf<NoInfer<D>>, string, TBase>
  ): string
  formatMessage<D extends TypedMessageDescriptor<MessageValues>>(
    this: void,
    descriptor: D,
    ...args: TypedMessageArguments<MessageValuesOf<NoInfer<D>>, TBase>
  ): string | TBase | Array<string | TBase>
  formatMessage<const K extends RegisteredMessageId>(
    this: void,
    descriptor: UntypedMessageDescriptor & {id: K},
    ...args: TypedMessageArguments<
      RegisteredMessageValues<NoInfer<K>>,
      string,
      TBase
    >
  ): string
  formatMessage<const K extends RegisteredMessageId>(
    this: void,
    descriptor: UntypedMessageDescriptor & {id: K},
    ...args: TypedMessageArguments<RegisteredMessageValues<NoInfer<K>>, TBase>
  ): string | TBase | Array<string | TBase>
  formatMessage<
    V = never,
    const D extends
      | UntypedMessageDescriptor
      | TypedMessageDescriptor<Record<string, never>> =
      | UntypedMessageDescriptor
      | TypedMessageDescriptor<Record<string, never>>,
  >(
    this: void,
    descriptor: [V] extends [never]
      ? D & UnregisteredMessageDescriptor<D>
      : never,
    values?: never,
    opts?: IntlMessageFormatOptions
  ): string
  formatMessage<
    V = never,
    const D extends UntypedMessageDescriptor = UntypedMessageDescriptor,
  >(
    this: void,
    descriptor: [V] extends [never]
      ? D & UnregisteredMessageDescriptor<NoInfer<D>>
      : never,
    values?: Record<string, PrimitiveType | FormatXMLElementFn<string, string>>,
    opts?: IntlMessageFormatOptions
  ): string
  formatMessage<
    V = never,
    const D extends UntypedMessageDescriptor = UntypedMessageDescriptor,
  >(
    this: void,
    descriptor: [V] extends [never]
      ? D & UnregisteredMessageDescriptor<NoInfer<D>>
      : never,
    values?: Record<string, PrimitiveType | TBase | FormatXMLElementFn<TBase>>,
    opts?: IntlMessageFormatOptions
  ): string | TBase | Array<string | TBase>
  $t<V extends MessageValues = never, T extends TBase = TBase>(
    this: void,
    descriptor: [V] extends [never] ? never : UntypedMessageDescriptor,
    ...args: TypedMessageArguments<NoInfer<V>, string, T>
  ): string
  $t<V extends MessageValues = never, T extends TBase = TBase>(
    this: void,
    descriptor: [V] extends [never] ? never : UntypedMessageDescriptor,
    ...args: TypedMessageArguments<NoInfer<V>, T>
  ): string | T | Array<string | T>
  $t<D extends TypedMessageDescriptor<MessageValues>>(
    this: void,
    descriptor: D,
    ...args: TypedMessageArguments<MessageValuesOf<NoInfer<D>>, string, TBase>
  ): string
  $t<D extends TypedMessageDescriptor<MessageValues>>(
    this: void,
    descriptor: D,
    ...args: TypedMessageArguments<MessageValuesOf<NoInfer<D>>, TBase>
  ): string | TBase | Array<string | TBase>
  $t<const K extends RegisteredMessageId>(
    this: void,
    descriptor: UntypedMessageDescriptor & {id: K},
    ...args: TypedMessageArguments<
      RegisteredMessageValues<NoInfer<K>>,
      string,
      TBase
    >
  ): string
  $t<const K extends RegisteredMessageId>(
    this: void,
    descriptor: UntypedMessageDescriptor & {id: K},
    ...args: TypedMessageArguments<RegisteredMessageValues<NoInfer<K>>, TBase>
  ): string | TBase | Array<string | TBase>
  $t<
    V = never,
    const D extends
      | UntypedMessageDescriptor
      | TypedMessageDescriptor<Record<string, never>> =
      | UntypedMessageDescriptor
      | TypedMessageDescriptor<Record<string, never>>,
  >(
    this: void,
    descriptor: [V] extends [never]
      ? D & UnregisteredMessageDescriptor<D>
      : never,
    values?: never,
    opts?: IntlMessageFormatOptions
  ): string
  $t<
    V = never,
    const D extends UntypedMessageDescriptor = UntypedMessageDescriptor,
  >(
    this: void,
    descriptor: [V] extends [never]
      ? D & UnregisteredMessageDescriptor<NoInfer<D>>
      : never,
    values?: Record<string, PrimitiveType | FormatXMLElementFn<string, string>>,
    opts?: IntlMessageFormatOptions
  ): string
  $t<
    V = never,
    const D extends UntypedMessageDescriptor = UntypedMessageDescriptor,
  >(
    this: void,
    descriptor: [V] extends [never]
      ? D & UnregisteredMessageDescriptor<NoInfer<D>>
      : never,
    values?: Record<string, PrimitiveType | TBase | FormatXMLElementFn<TBase>>,
    opts?: IntlMessageFormatOptions
  ): string | TBase | (TBase | string)[]
  formatList(
    this: void,
    values: Iterable<string>,
    opts?: FormatListOptions
  ): string
  formatList<T extends TBase>(
    this: void,
    values: Iterable<string | T>,
    opts?: FormatListOptions
  ): T | string | (string | T)[]
  formatListToParts<T extends TBase>(
    this: void,
    values: Iterable<string | T>,
    opts?: FormatListOptions
  ): Part[]
  formatDisplayName(
    this: void,
    value: Parameters<Intl.DisplayNames['of']>[0],
    opts: FormatDisplayNameOptions
  ): string | undefined
}

export interface Formatters {
  getDateTimeFormat(
    this: void,
    ...args: ConstructorParameters<typeof Intl.DateTimeFormat>
  ): Intl.DateTimeFormat
  getNumberFormat(
    this: void,
    locales?: string | string[],
    opts?: NumberFormatOptions
  ): Intl.NumberFormat
  getMessageFormat(
    this: void,
    ...args: ConstructorParameters<typeof IntlMessageFormat>
  ): IntlMessageFormat
  getDurationFormat(
    this: void,
    locales?: string | string[],
    opts?: DurationFormatOptions
  ): DurationFormat
  getRelativeTimeFormat(
    this: void,
    ...args: ConstructorParameters<typeof Intl.RelativeTimeFormat>
  ): Intl.RelativeTimeFormat
  getPluralRules(
    this: void,
    ...args: ConstructorParameters<typeof Intl.PluralRules>
  ): Intl.PluralRules
  getListFormat(
    this: void,
    ...args: ConstructorParameters<typeof Intl.ListFormat>
  ): Intl.ListFormat
  getDisplayNames(
    this: void,
    ...args: ConstructorParameters<typeof Intl.DisplayNames>
  ): Intl.DisplayNames
}

export interface IntlShape<T = string>
  extends ResolvedIntlConfig<T>, IntlFormatters<T> {
  formatters: Formatters
}

export interface IntlCache {
  dateTime: Record<string, Intl.DateTimeFormat>
  number: Record<string, Intl.NumberFormat>
  message: Record<string, IntlMessageFormat>
  duration: Record<string, DurationFormat>
  relativeTime: Record<string, Intl.RelativeTimeFormat>
  pluralRules: Record<string, Intl.PluralRules>
  list: Record<string, Intl.ListFormat>
  displayNames: Record<string, Intl.DisplayNames>
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

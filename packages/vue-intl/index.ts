import {MessageDescriptor} from '@formatjs/intl'
export * from './plugin'
export * from './provider'
export {intlKey} from './injection-key'
export {
  IntlShape,
  IntlConfig,
  ResolvedIntlConfig,
  createIntlCache,
  MessageDescriptor,
  IntlCache,
  Formatters,
  IntlFormatters,
  FormatDisplayNameOptions,
  FormatListOptions,
  FormatPluralOptions,
  FormatRelativeTimeOptions,
  FormatNumberOptions,
  FormatDateOptions,
  CustomFormatConfig,
  CustomFormats,
  UnsupportedFormatterError,
  InvalidConfigError,
  MissingDataError,
  MessageFormatError,
  MissingTranslationError,
  IntlErrorCode,
  IntlError,
} from '@formatjs/intl'
export function defineMessages<
  K extends keyof any,
  T = MessageDescriptor,
  U extends Record<K, T> = Record<K, T>
>(msgs: U): U {
  return msgs
}

export function defineMessage<T>(msg: T): T {
  return msg
}
export type {MessageFormatElement} from '@formatjs/icu-messageformat-parser'

import {
  IntlFormatters as CoreIntlFormatters,
  MessageDescriptor,
} from '@formatjs/intl'
export * from './plugin.js'
export * from './provider.js'
export {intlKey} from './injection-key.js'
export {
  IntlShape,
  IntlConfig,
  ResolvedIntlConfig,
  createIntlCache,
  MessageDescriptor,
  IntlCache,
  Formatters,
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
import {VNode} from 'vue'

export type IntlFormatters = CoreIntlFormatters<VNode>

export function defineMessages<
  K extends keyof any,
  T = MessageDescriptor,
  U extends Record<K, T> = Record<K, T>,
>(msgs: U): U {
  return msgs
}

export function defineMessage<T>(msg: T): T {
  return msg
}
export type {MessageFormatElement} from '@formatjs/icu-messageformat-parser'

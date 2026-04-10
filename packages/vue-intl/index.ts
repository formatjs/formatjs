import {
  type IntlFormatters as CoreIntlFormatters,
  type MessageDescriptor,
} from '@formatjs/intl'
export * from '#packages/vue-intl/plugin.js'
export * from '#packages/vue-intl/provider.js'
export {intlKey} from '#packages/vue-intl/injection-key.js'
export {
  type IntlShape,
  type IntlConfig,
  type ResolvedIntlConfig,
  createIntlCache,
  type MessageDescriptor,
  type IntlCache,
  type Formatters,
  type FormatDisplayNameOptions,
  type FormatListOptions,
  type FormatPluralOptions,
  type FormatRelativeTimeOptions,
  type FormatNumberOptions,
  type FormatDateOptions,
  type CustomFormatConfig,
  type CustomFormats,
  UnsupportedFormatterError,
  InvalidConfigError,
  MissingDataError,
  MessageFormatError,
  MissingTranslationError,
  IntlErrorCode,
  IntlError,
} from '@formatjs/intl'
import {type VNode} from 'vue'

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

import {type IntlFormatters as CoreIntlFormatters} from '@formatjs/intl'
export * from '#packages/vue-intl/plugin.js'
export * from '#packages/vue-intl/provider.js'
export {intlKey} from '#packages/vue-intl/injection-key.js'
export {
  defineMessage,
  defineMessages,
  type MessageDescriptor,
  type TypedMessageDescriptor,
  type MessageValues,
  type MessageValuesOf,
  type MessageValue,
  type MessageTag,
  type MessageArgumentsFromCatalog,
  type IntlShape,
  type IntlConfig,
  type ResolvedIntlConfig,
  createIntlCache,
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

export type {MessageFormatElement} from '@formatjs/icu-messageformat-parser'

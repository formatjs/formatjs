import {type IntlFormatters as CoreIntlFormatters} from '@formatjs/intl'
export * from '#packages/svelte-intl/provider.js'
export {intlKey} from '#packages/svelte-intl/context-key.js'
export {
  defineMessage,
  defineMessages,
  type MessageDescriptor,
  type FormattedText,
  type MessageTextOutput,
  type TypedMessageDescriptor,
  type MessageValues,
  type MessageValuesOf,
  type MessageValue,
  type MessageTag,
  type NoMessageValues,
  type MessageArgumentsFromCatalog,
  type IntlShape,
  type IntlConfig,
  type ResolvedIntlConfig,
  createIntl,
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

export type IntlFormatters = CoreIntlFormatters<string>

export type {MessageFormatElement} from '@formatjs/icu-messageformat-parser'

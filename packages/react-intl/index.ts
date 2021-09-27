/*
 * Copyright 2015, Yahoo Inc.
 * Copyrights licensed under the New BSD License.
 * See the accompanying LICENSE file for terms.
 */
import * as React from 'react'
import {
  createFormattedComponent,
  createFormattedDateTimePartsComponent,
} from './src/components/createFormattedComponent'
import {
  MessageDescriptor,
  CustomFormatConfig,
  FormatDateOptions,
} from '@formatjs/intl'
import {IntlListFormatOptions} from '@formatjs/intl-listformat'
import {DisplayNamesOptions} from '@formatjs/intl-displaynames'
import {NumberFormatOptions} from '@formatjs/ecma402-abstract'
export {IntlConfig, ResolvedIntlConfig, IntlShape} from './src/types'
export {
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
  IntlErrorCode as ReactIntlErrorCode,
  IntlError as ReactIntlError,
} from '@formatjs/intl'

export function defineMessages<
  K extends keyof any,
  T = MessageDescriptor,
  U extends Record<K, T> = Record<K, T>
>(msgs: U): U {
  return msgs
}

export function defineMessage<T extends MessageDescriptor>(msg: T): T {
  return msg
}
export {
  default as injectIntl,
  Provider as RawIntlProvider,
  Context as IntlContext,
  WithIntlProps,
  WrappedComponentProps,
} from './src/components/injectIntl'
export {default as useIntl} from './src/components/useIntl'
export {default as IntlProvider, createIntl} from './src/components/provider'
// IMPORTANT: Explicit here to prevent api-extractor from outputing `import('./src/types').CustomFormatConfig`
export const FormattedDate: React.FC<
  Intl.DateTimeFormatOptions &
    CustomFormatConfig & {
      value: string | number | Date | undefined
    }
> = createFormattedComponent('formatDate')
export const FormattedTime: React.FC<
  Intl.DateTimeFormatOptions &
    CustomFormatConfig & {
      value: string | number | Date | undefined
    }
> = createFormattedComponent('formatTime')
// @ts-ignore issue w/ TS Intl types
export const FormattedNumber: React.FC<
  NumberFormatOptions &
    CustomFormatConfig & {
      value: number | bigint
    }
> = createFormattedComponent('formatNumber')
export const FormattedList: React.FC<
  IntlListFormatOptions & {
    value: readonly React.ReactNode[]
  }
> = createFormattedComponent('formatList')
export const FormattedDisplayName: React.FC<
  DisplayNamesOptions & {
    value: string | number | Record<string, unknown>
  }
> = createFormattedComponent('formatDisplayName')
export const FormattedDateParts: React.FC<
  FormatDateOptions & {
    value: Parameters<Intl.DateTimeFormat['format']>[0] | string
    children(val: Intl.DateTimeFormatPart[]): React.ReactElement | null
  }
> = createFormattedDateTimePartsComponent('formatDate')
export const FormattedTimeParts: React.FC<
  FormatDateOptions & {
    value: Parameters<Intl.DateTimeFormat['format']>[0] | string
    children(val: Intl.DateTimeFormatPart[]): React.ReactElement | null
  }
> = createFormattedDateTimePartsComponent('formatTime')

export {
  FormattedNumberParts,
  FormattedListParts,
} from './src/components/createFormattedComponent'
export {default as FormattedRelativeTime} from './src/components/relative'
export {default as FormattedPlural} from './src/components/plural'
export {default as FormattedMessage} from './src/components/message'
export {default as FormattedDateTimeRange} from './src/components/dateTimeRange'
export type {MessageFormatElement} from '@formatjs/icu-messageformat-parser'

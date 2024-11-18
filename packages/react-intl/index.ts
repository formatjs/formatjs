/*
 * Copyright 2015, Yahoo Inc.
 * Copyrights licensed under the New BSD License.
 * See the accompanying LICENSE file for terms.
 */
import {
  CustomFormatConfig,
  FormatDateOptions,
  MessageDescriptor,
} from '@formatjs/intl'
import * as React from 'react'
import {
  createFormattedComponent,
  createFormattedDateTimePartsComponent,
} from './src/components/createFormattedComponent'
import {createIntl} from './src/components/createIntl'
import FormattedDateTimeRange from './src/components/dateTimeRange'
import injectIntl, {
  Context as IntlContext,
  Provider as RawIntlProvider,
  WithIntlProps,
  WrappedComponentProps,
} from './src/components/injectIntl'
import FormattedMessage from './src/components/message'
import FormattedPlural from './src/components/plural'
import IntlProvider from './src/components/provider'
import FormattedRelativeTime from './src/components/relative'
import useIntl from './src/components/useIntl'
export {
  createIntlCache,
  CustomFormatConfig,
  CustomFormats,
  FormatDateOptions,
  FormatDisplayNameOptions,
  FormatListOptions,
  FormatNumberOptions,
  FormatPluralOptions,
  FormatRelativeTimeOptions,
  Formatters,
  IntlCache,
  IntlFormatters,
  InvalidConfigError,
  MessageDescriptor,
  MessageFormatError,
  MissingDataError,
  MissingTranslationError,
  IntlError as ReactIntlError,
  IntlErrorCode as ReactIntlErrorCode,
  UnsupportedFormatterError,
} from '@formatjs/intl'
export {IntlConfig, IntlShape, ResolvedIntlConfig} from './src/types'
export {
  createIntl,
  FormattedDateTimeRange,
  FormattedMessage,
  FormattedPlural,
  FormattedRelativeTime,
  injectIntl,
  IntlContext,
  IntlProvider,
  RawIntlProvider,
  useIntl,
  WithIntlProps,
  WrappedComponentProps,
}

export function defineMessages<
  K extends keyof any,
  T = MessageDescriptor,
  U extends Record<K, T> = Record<K, T>,
>(msgs: U): U {
  return msgs
}

export function defineMessage<T extends MessageDescriptor>(msg: T): T {
  return msg
}
// IMPORTANT: Explicit here to prevent api-extractor from outputing `import('./src/types').CustomFormatConfig`
export const FormattedDate: React.FC<
  Intl.DateTimeFormatOptions &
    CustomFormatConfig & {
      value: string | number | Date | undefined
      children?(formattedDate: string): React.ReactElement | null
    }
> = createFormattedComponent('formatDate')
export const FormattedTime: React.FC<
  Intl.DateTimeFormatOptions &
    CustomFormatConfig & {
      value: string | number | Date | undefined
      children?(formattedTime: string): React.ReactElement | null
    }
> = createFormattedComponent('formatTime')
export const FormattedNumber: React.FC<
  Omit<Intl.NumberFormatOptions, 'localeMatcher'> &
    CustomFormatConfig<'number'> & {
      value: number
      children?(formattedNumber: string): React.ReactElement | null
    }
> = createFormattedComponent('formatNumber')
export const FormattedList: React.FC<
  Intl.ListFormatOptions & {
    value: readonly React.ReactNode[]
  }
> = createFormattedComponent('formatList')
export const FormattedDisplayName: React.FC<
  Intl.DisplayNamesOptions & {
    value: string
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

export type {MessageFormatElement} from '@formatjs/icu-messageformat-parser'
export type {PrimitiveType} from 'intl-messageformat'
export {
  FormattedListParts,
  FormattedNumberParts,
} from './src/components/createFormattedComponent'

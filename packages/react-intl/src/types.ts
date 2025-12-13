/*
 * Copyright 2015, Yahoo Inc.
 * Copyrights licensed under the New BSD License.
 * See the accompanying LICENSE file for terms.
 */
import {
  ResolvedIntlConfig as CoreResolvedIntlConfig,
  Formatters,
  IntlFormatters,
  MessageDescriptor,
} from '@formatjs/intl'
import {
  FormatXMLElementFn,
  Options as IntlMessageFormatOptions,
  PrimitiveType,
} from 'intl-messageformat'
import * as React from 'react'
import {DEFAULT_INTL_CONFIG} from './utils'
export type IntlConfig = Omit<
  ResolvedIntlConfig,
  keyof typeof DEFAULT_INTL_CONFIG
> &
  Partial<typeof DEFAULT_INTL_CONFIG>

export interface ResolvedIntlConfig extends CoreResolvedIntlConfig<React.ReactNode> {
  textComponent?: React.ComponentType | keyof React.JSX.IntrinsicElements
  wrapRichTextChunksInFragment?: boolean
}

export interface IntlShape
  extends ResolvedIntlConfig, IntlFormatters<React.ReactNode> {
  formatMessage(
    this: void,
    descriptor: MessageDescriptor,
    values?: Record<string, PrimitiveType | FormatXMLElementFn<string, string>>,
    opts?: IntlMessageFormatOptions
  ): string
  formatMessage(
    this: void,
    descriptor: MessageDescriptor,
    values?: Record<
      string,
      | React.ReactNode
      | PrimitiveType
      | FormatXMLElementFn<string, React.ReactNode>
    >,
    opts?: IntlMessageFormatOptions
  ): Array<React.ReactNode>

  formatters: Formatters
}

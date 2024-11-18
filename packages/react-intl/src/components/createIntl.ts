/*
 * Copyright 2015, Yahoo Inc.
 * Copyrights licensed under the New BSD License.
 * See the accompanying LICENSE file for terms.
 */

import {
  CreateIntlFn,
  FormatMessageFn,
  createIntl as coreCreateIntl,
  formatMessage as coreFormatMessage,
} from '@formatjs/intl'
import {
  FormatXMLElementFn,
  PrimitiveType,
  isFormatXMLElementFn,
} from 'intl-messageformat'
import * as React from 'react'
import type {IntlConfig, IntlShape, ResolvedIntlConfig} from '../types'
import {DEFAULT_INTL_CONFIG, assignUniqueKeysToParts} from '../utils'

function assignUniqueKeysToFormatXMLElementFnArgument<
  T extends Record<
    string,
    | PrimitiveType
    | React.ReactNode
    | FormatXMLElementFn<React.ReactNode, React.ReactNode>
  > = Record<
    string,
    | PrimitiveType
    | React.ReactNode
    | FormatXMLElementFn<React.ReactNode, React.ReactNode>
  >,
>(values?: T): T | undefined {
  if (!values) {
    return values
  }
  return Object.keys(values).reduce((acc: T, k) => {
    const v = values[k]
    ;(acc as any)[k] = isFormatXMLElementFn<React.ReactNode>(v)
      ? assignUniqueKeysToParts(v)
      : v
    return acc
  }, {} as T)
}

const formatMessage: FormatMessageFn<React.ReactNode> = (
  config,
  formatters,
  descriptor,
  rawValues,
  ...rest
) => {
  const values = assignUniqueKeysToFormatXMLElementFnArgument(rawValues)
  const chunks = coreFormatMessage(
    config,
    formatters,
    descriptor,
    values as any,
    ...rest
  )
  if (Array.isArray(chunks)) {
    return React.Children.toArray(chunks)
  }
  return chunks as any
}

/**
 * Create intl object
 * @param config intl config
 * @param cache cache for formatter instances to prevent memory leak
 */
export const createIntl: CreateIntlFn<
  React.ReactNode,
  IntlConfig,
  IntlShape
> = (
  {defaultRichTextElements: rawDefaultRichTextElements, ...config},
  cache
) => {
  const defaultRichTextElements = assignUniqueKeysToFormatXMLElementFnArgument(
    rawDefaultRichTextElements
  )
  const coreIntl = coreCreateIntl<React.ReactNode>(
    {
      ...DEFAULT_INTL_CONFIG,
      ...config,
      defaultRichTextElements,
    },
    cache
  )

  const resolvedConfig: ResolvedIntlConfig = {
    locale: coreIntl.locale,
    timeZone: coreIntl.timeZone,
    fallbackOnEmptyString: coreIntl.fallbackOnEmptyString,
    formats: coreIntl.formats,
    defaultLocale: coreIntl.defaultLocale,
    defaultFormats: coreIntl.defaultFormats,
    messages: coreIntl.messages,
    onError: coreIntl.onError,
    defaultRichTextElements,
  }

  return {
    ...coreIntl,
    formatMessage: formatMessage.bind(
      null,
      resolvedConfig,
      coreIntl.formatters
    ),
    $t: formatMessage.bind(null, resolvedConfig, coreIntl.formatters),
  } as any
}

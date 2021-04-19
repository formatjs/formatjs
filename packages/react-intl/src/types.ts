/*
 * Copyright 2015, Yahoo Inc.
 * Copyrights licensed under the New BSD License.
 * See the accompanying LICENSE file for terms.
 */
import * as React from 'react'
import {
  ResolvedIntlConfig as CoreResolvedIntlConfig,
  IntlFormatters,
  Formatters,
} from '@formatjs/intl'
import {DEFAULT_INTL_CONFIG} from './utils'
export type IntlConfig = Omit<
  ResolvedIntlConfig,
  keyof typeof DEFAULT_INTL_CONFIG
> &
  Partial<typeof DEFAULT_INTL_CONFIG>

export interface ResolvedIntlConfig
  extends CoreResolvedIntlConfig<React.ReactNode> {
  textComponent?: React.ComponentType | keyof React.ReactHTML
  wrapRichTextChunksInFragment?: boolean
}

export interface IntlShape
  extends ResolvedIntlConfig,
    IntlFormatters<React.ReactNode> {
  formatters: Formatters
}

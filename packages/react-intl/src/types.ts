/*
 * Copyright 2015, Yahoo Inc.
 * Copyrights licensed under the New BSD License.
 * See the accompanying LICENSE file for terms.
 */
import * as React from 'react';
import {
  IntlConfig as CoreIntlConfig,
  IntlFormatters,
  Formatters,
} from '@formatjs/intl';
export interface IntlConfig extends CoreIntlConfig<React.ReactNode> {
  textComponent?: React.ComponentType | keyof React.ReactHTML;
  wrapRichTextChunksInFragment?: boolean;
}

export interface IntlShape extends IntlConfig, IntlFormatters<React.ReactNode> {
  formatters: Formatters;
}

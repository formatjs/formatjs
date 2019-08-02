/*
 * Copyright 2015, Yahoo Inc.
 * Copyrights licensed under the New BSD License.
 * See the accompanying LICENSE file for terms.
 */

export * from './types';
import {parse} from 'intl-messageformat-parser';
import {IntlMessageFormat} from 'intl-messageformat/core';
IntlMessageFormat.__parse = parse;
export {
  createIntl,
  defineMessages,
  FormattedDate,
  FormattedHTMLMessage,
  FormattedMessage,
  FormattedNumber,
  FormattedPlural,
  FormattedRelativeTime,
  FormattedTime,
  injectIntl,
  IntlContext,
  IntlProvider,
  RawIntlProvider,
  useIntl,
  WithIntlProps,
  WrappedComponentProps,
} from './core';

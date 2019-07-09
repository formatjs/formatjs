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
  defineMessages,
  FormattedDate,
  FormattedHTMLMessage,
  FormattedMessage,
  FormattedNumber,
  FormattedPlural,
  FormattedRelativeTime,
  FormattedTime,
  generateIntlContext,
  injectIntl,
  IntlContext,
  IntlProvider,
  useIntl,
  WithIntlProps,
  WrappedComponentProps,
} from './core';

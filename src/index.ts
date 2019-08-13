/*
 * Copyright 2015, Yahoo Inc.
 * Copyrights licensed under the New BSD License.
 * See the accompanying LICENSE file for terms.
 */

export * from './types';
export {default as defineMessages} from './define-messages';
import createFormattedComponent from './components/createFormattedComponent';
export {
  default as injectIntl,
  Provider as RawIntlProvider,
  Context as IntlContext,
  WithIntlProps,
  WrappedComponentProps,
} from './components/injectIntl';
export {default as useIntl} from './components/useIntl';
export {default as IntlProvider, createIntl} from './components/provider';
export const FormattedDate = createFormattedComponent('formatDate');
export const FormattedTime = createFormattedComponent('formatTime');
export const FormattedNumber = createFormattedComponent('formatNumber');
export {default as FormattedRelativeTime} from './components/relative';
export {default as FormattedPlural} from './components/plural';
export {default as FormattedMessage} from './components/message';
export {default as FormattedHTMLMessage} from './components/html-message';
export {createIntlCache} from './utils';

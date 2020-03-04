/*
 * Copyright 2015, Yahoo Inc.
 * Copyrights licensed under the New BSD License.
 * See the accompanying LICENSE file for terms.
 */
import * as React from 'react';
export * from './types';
export function defineMessages<T, U extends Record<string, T>>(msgs: U): U {
  return msgs;
}
import {
  createFormattedComponent,
  createFormattedDateTimePartsComponent,
} from './components/createFormattedComponent';
import {CustomFormatConfig} from './types';
import {UnifiedNumberFormatOptions} from '@formatjs/intl-unified-numberformat';
import {IntlListFormatOptions} from '@formatjs/intl-listformat';
import {DisplayNamesOptions} from '@formatjs/intl-displaynames/lib';
export {
  default as injectIntl,
  Provider as RawIntlProvider,
  Context as IntlContext,
  WithIntlProps,
  WrappedComponentProps,
} from './components/injectIntl';
export {default as useIntl} from './components/useIntl';
export {default as IntlProvider, createIntl} from './components/provider';
// IMPORTANT: Explicit here to prevent api-extractor from outputing `import('./types').CustomFormatConfig`
export const FormattedDate: React.FC<Intl.DateTimeFormatOptions &
  CustomFormatConfig & {
    value: string | number | Date | undefined;
  }> = createFormattedComponent('formatDate');
export const FormattedTime: React.FC<Intl.DateTimeFormatOptions &
  CustomFormatConfig & {
    value: string | number | Date | undefined;
  }> = createFormattedComponent('formatTime');
export const FormattedNumber: React.FC<UnifiedNumberFormatOptions &
  CustomFormatConfig & {
    value: number;
  }> = createFormattedComponent('formatNumber');
export const FormattedList: React.FC<IntlListFormatOptions & {
  value: React.ReactNode[];
}> = createFormattedComponent('formatList');
export const FormattedDisplayName: React.FC<DisplayNamesOptions & {
  value: string | number | object;
}> = createFormattedComponent('formatDisplayName');
export const FormattedDateParts = createFormattedDateTimePartsComponent(
  'formatDate'
);
export const FormattedTimeParts = createFormattedDateTimePartsComponent(
  'formatTime'
);
export {FormattedNumberParts} from './components/createFormattedComponent';
export {default as FormattedRelativeTime} from './components/relative';
export {default as FormattedPlural} from './components/plural';
export {default as FormattedMessage} from './components/message';
export {default as FormattedHTMLMessage} from './components/html-message';
export {createIntlCache} from './utils';

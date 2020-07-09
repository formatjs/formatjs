/*
 * Copyright 2015, Yahoo Inc.
 * Copyrights licensed under the New BSD License.
 * See the accompanying LICENSE file for terms.
 */
import * as React from 'react';
export * from './src/types';
export function defineMessages<T, U extends Record<string, T>>(msgs: U): U {
  return msgs;
}
export function defineMessage<T>(msg: T): T {
  return msg;
}
import {
  createFormattedComponent,
  createFormattedDateTimePartsComponent,
} from './src/components/createFormattedComponent';
import {CustomFormatConfig, FormatDateOptions} from './src/types';
import {NumberFormatOptions} from '@formatjs/intl-numberformat';
import {IntlListFormatOptions} from '@formatjs/intl-listformat';
import {DisplayNamesOptions} from '@formatjs/intl-displaynames';
import {DateTimeFormatOptions} from '@formatjs/intl-datetimeformat';
export {
  default as injectIntl,
  Provider as RawIntlProvider,
  Context as IntlContext,
  WithIntlProps,
  WrappedComponentProps,
} from './src/components/injectIntl';
export {default as useIntl} from './src/components/useIntl';
export {default as IntlProvider, createIntl} from './src/components/provider';
// IMPORTANT: Explicit here to prevent api-extractor from outputing `import('./src/types').CustomFormatConfig`
export const FormattedDate: React.FC<
  DateTimeFormatOptions &
    CustomFormatConfig & {
      value: string | number | Date | undefined;
    }
> = createFormattedComponent('formatDate');
export const FormattedTime: React.FC<
  DateTimeFormatOptions &
    CustomFormatConfig & {
      value: string | number | Date | undefined;
    }
> = createFormattedComponent('formatTime');
export const FormattedNumber: React.FC<
  NumberFormatOptions &
    CustomFormatConfig & {
      value: number;
    }
> = createFormattedComponent('formatNumber');
export const FormattedList: React.FC<
  IntlListFormatOptions & {
    value: React.ReactNode[];
  }
> = createFormattedComponent('formatList');
export const FormattedDisplayName: React.FC<
  DisplayNamesOptions & {
    value: string | number | object;
  }
> = createFormattedComponent('formatDisplayName');
export const FormattedDateParts: React.FC<
  FormatDateOptions & {
    value: Parameters<Intl.DateTimeFormat['format']>[0] | string;
    children(val: Intl.DateTimeFormatPart[]): React.ReactElement | null;
  }
> = createFormattedDateTimePartsComponent('formatDate');
export const FormattedTimeParts: React.FC<
  FormatDateOptions & {
    value: Parameters<Intl.DateTimeFormat['format']>[0] | string;
    children(val: Intl.DateTimeFormatPart[]): React.ReactElement | null;
  }
> = createFormattedDateTimePartsComponent('formatTime');

export {FormattedNumberParts} from './src/components/createFormattedComponent';
export {default as FormattedRelativeTime} from './src/components/relative';
export {default as FormattedPlural} from './src/components/plural';
export {default as FormattedMessage} from './src/components/message';
export {createIntlCache} from './src/utils';
export * from './src/error';

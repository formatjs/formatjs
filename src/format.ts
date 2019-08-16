/*
 * Copyright 2015, Yahoo Inc.
 * Copyrights licensed under the New BSD License.
 * See the accompanying LICENSE file for terms.
 */

import * as React from 'react';
// Since rollup cannot deal with namespace being a function,
// this is to interop with TypeScript since `invariant`
// does not export a default
// https://github.com/rollup/rollup/issues/1267
import * as invariant_ from 'invariant';
const invariant: typeof invariant_ = (invariant_ as any).default || invariant_;

import {
  Formatters,
  IntlConfig,
  FormatRelativeTimeOptions,
  CustomFormats,
  MessageDescriptor,
  IntlFormatters,
} from './types';

import {createError, escape, filterProps} from './utils';
import {IntlRelativeTimeFormatOptions} from '@formatjs/intl-relativetimeformat';
import {LiteralElement, TYPE} from 'intl-messageformat-parser';
import {FormatXMLElementFn, PrimitiveType} from 'intl-messageformat';

const DATE_TIME_FORMAT_OPTIONS: Array<keyof Intl.DateTimeFormatOptions> = [
  'localeMatcher',
  'formatMatcher',

  'timeZone',
  'hour12',

  'weekday',
  'era',
  'year',
  'month',
  'day',
  'hour',
  'minute',
  'second',
  'timeZoneName',
];
const NUMBER_FORMAT_OPTIONS: Array<keyof Intl.NumberFormatOptions> = [
  'localeMatcher',

  'style',
  'currency',
  'currencyDisplay',
  'useGrouping',

  'minimumIntegerDigits',
  'minimumFractionDigits',
  'maximumFractionDigits',
  'minimumSignificantDigits',
  'maximumSignificantDigits',
];
const RELATIVE_FORMAT_OPTIONS: Array<keyof IntlRelativeTimeFormatOptions> = [
  'numeric',
  'style',
];
const PLURAL_FORMAT_OPTIONS: Array<keyof Intl.PluralRulesOptions> = [
  'localeMatcher',
  'type',
];

function getNamedFormat<T extends keyof CustomFormats>(
  formats: CustomFormats,
  type: T,
  name: string,
  onError: (err: string) => void
) {
  const formatType = formats && formats[type];
  let format;
  if (formatType) {
    format = formatType[name];
  }
  if (format) {
    return format;
  }

  onError(createError(`No ${type} format named: ${name}`));
}

/**
 * Escape a raw msg when we run in prod mode
 * https://github.com/formatjs/formatjs/blob/master/packages/intl-messageformat-parser/src/parser.pegjs#L155
 */
function escapeUnformattedMessage(msg: string): string {
  return msg.replace(/'\{(.*?)\}'/g, `{$1}`);
}

export function formatDate(
  {
    locale,
    formats,
    onError,
    timeZone,
  }: Pick<IntlConfig, 'locale' | 'formats' | 'onError' | 'timeZone'>,
  state: Formatters,
  ...[value, options = {}]: Parameters<IntlFormatters['formatDate']>
) {
  const {format} = options;
  let defaults = {
    ...(timeZone && {timeZone}),
    ...(format && getNamedFormat(formats!, 'date', format, onError)),
  };
  let filteredOptions = filterProps(
    options,
    DATE_TIME_FORMAT_OPTIONS,
    defaults
  );
  const date = typeof value === 'string' ? new Date(value || 0) : value;
  try {
    return state.getDateTimeFormat(locale, filteredOptions).format(date);
  } catch (e) {
    onError(createError('Error formatting date.', e));
  }

  return String(date);
}

export function formatTime(
  {
    locale,
    formats,
    onError,
    timeZone,
  }: Pick<IntlConfig, 'locale' | 'formats' | 'onError' | 'timeZone'>,
  state: Formatters,
  ...[value, options = {}]: Parameters<IntlFormatters['formatTime']>
) {
  const {format} = options;
  let defaults = {
    ...(timeZone && {timeZone}),
    ...(format && getNamedFormat(formats!, 'time', format, onError)),
  };
  let filteredOptions = filterProps(
    options,
    DATE_TIME_FORMAT_OPTIONS,
    defaults
  );

  if (
    !filteredOptions.hour &&
    !filteredOptions.minute &&
    !filteredOptions.second
  ) {
    // Add default formatting options if hour, minute, or second isn't defined.
    filteredOptions = {...filteredOptions, hour: 'numeric', minute: 'numeric'};
  }

  const date = typeof value === 'string' ? new Date(value || 0) : value;

  try {
    return state.getDateTimeFormat(locale, filteredOptions).format(date);
  } catch (e) {
    onError(createError('Error formatting time.', e));
  }

  return String(date);
}

export function formatRelativeTime(
  {
    locale,
    formats,
    onError,
  }: Pick<IntlConfig, 'locale' | 'formats' | 'onError'>,
  state: Formatters,
  ...[value, unit = 'second', options = {}]: Parameters<
    IntlFormatters['formatRelativeTime']
  >
) {
  const {format} = options;

  let defaults =
    (!!format && getNamedFormat(formats!, 'relative', format, onError)) || {};
  let filteredOptions = filterProps(
    options,
    RELATIVE_FORMAT_OPTIONS,
    defaults as FormatRelativeTimeOptions
  );
  try {
    return state
      .getRelativeTimeFormat(locale, filteredOptions)
      .format(value, unit);
  } catch (e) {
    onError(createError('Error formatting relative time.', e));
  }

  return String(value);
}

export function formatNumber(
  {
    locale,
    formats,
    onError,
  }: Pick<IntlConfig, 'locale' | 'formats' | 'onError'>,
  state: Formatters,
  ...[value, options = {}]: Parameters<IntlFormatters['formatNumber']>
) {
  const {format} = options;
  let defaults =
    (format && getNamedFormat(formats!, 'number', format, onError)) || {};
  let filteredOptions = filterProps(options, NUMBER_FORMAT_OPTIONS, defaults);

  try {
    return state.getNumberFormat(locale, filteredOptions).format(value);
  } catch (e) {
    onError(createError('Error formatting number.', e));
  }

  return String(value);
}

export function formatPlural(
  {locale, onError}: Pick<IntlConfig, 'locale' | 'onError'>,
  state: Formatters,
  ...[value, options = {}]: Parameters<IntlFormatters['formatPlural']>
) {
  let filteredOptions = filterProps(options, PLURAL_FORMAT_OPTIONS);

  try {
    return state.getPluralRules(locale, filteredOptions).select(value);
  } catch (e) {
    onError(createError('Error formatting plural.', e));
  }

  return 'other';
}

export function formatMessage(
  {
    locale,
    formats,
    messages,
    defaultLocale,
    defaultFormats,
    onError,
  }: Pick<
    IntlConfig,
    | 'locale'
    | 'formats'
    | 'messages'
    | 'defaultLocale'
    | 'defaultFormats'
    | 'onError'
  >,
  state: Formatters,
  messageDescriptor?: MessageDescriptor,
  values?: Record<string, PrimitiveType>
): string;
export function formatMessage(
  {
    locale,
    formats,
    messages,
    defaultLocale,
    defaultFormats,
    onError,
  }: Pick<
    IntlConfig,
    | 'locale'
    | 'formats'
    | 'messages'
    | 'defaultLocale'
    | 'defaultFormats'
    | 'onError'
  >,
  state: Formatters,
  messageDescriptor: MessageDescriptor = {id: ''},
  values: Record<
    string,
    PrimitiveType | React.ReactElement | FormatXMLElementFn
  > = {}
): string | React.ReactNodeArray {
  const {id, defaultMessage} = messageDescriptor;

  // `id` is a required field of a Message Descriptor.
  invariant(id, '[React Intl] An `id` must be provided to format a message.');

  const message = messages && messages[id];
  const hasValues = Object.keys(values).length > 0;

  // Avoid expensive message formatting for simple messages without values. In
  // development messages will always be formatted in case of missing values.
  if (!hasValues && process.env.NODE_ENV === 'production') {
    const val = message || defaultMessage || id;
    if (typeof val === 'string') {
      return escapeUnformattedMessage(val);
    }
    invariant(
      val.length === 1 && val[0].type === TYPE.literal,
      'Message has placeholders but no values was provided'
    );
    return (val[0] as LiteralElement).value;
  }

  let formattedMessageParts: Array<string | object> = [];

  if (message) {
    try {
      let formatter = state.getMessageFormat(message, locale, formats, {
        formatters: state,
      });

      formattedMessageParts = formatter.formatXMLMessage(values);
    } catch (e) {
      onError(
        createError(
          `Error formatting message: "${id}" for locale: "${locale}"` +
            (defaultMessage ? ', using default message as fallback.' : ''),
          e
        )
      );
    }
  } else {
    // This prevents warnings from littering the console in development
    // when no `messages` are passed into the <IntlProvider> for the
    // default locale, and a default message is in the source.
    if (
      !defaultMessage ||
      (locale && locale.toLowerCase() !== defaultLocale.toLowerCase())
    ) {
      onError(
        createError(
          `Missing message: "${id}" for locale: "${locale}"` +
            (defaultMessage ? ', using default message as fallback.' : '')
        )
      );
    }
  }

  if (!formattedMessageParts.length && defaultMessage) {
    try {
      let formatter = state.getMessageFormat(
        defaultMessage,
        defaultLocale,
        defaultFormats
      );

      formattedMessageParts = formatter.formatXMLMessage(values);
    } catch (e) {
      onError(
        createError(`Error formatting the default message for: "${id}"`, e)
      );
    }
  }

  if (!formattedMessageParts.length) {
    onError(
      createError(
        `Cannot format message: "${id}", ` +
          `using message ${
            message || defaultMessage ? 'source' : 'id'
          } as fallback.`
      )
    );
    if (typeof message === 'string') {
      return message || defaultMessage || id;
    }
    return defaultMessage || id;
  }
  if (
    formattedMessageParts.length === 1 &&
    typeof formattedMessageParts[0] === 'string'
  ) {
    return (formattedMessageParts[0] as string) || defaultMessage || id;
  }
  return formattedMessageParts;
}

export function formatHTMLMessage(
  config: Pick<
    IntlConfig,
    | 'locale'
    | 'formats'
    | 'messages'
    | 'defaultLocale'
    | 'defaultFormats'
    | 'onError'
  >,
  state: Formatters,
  messageDescriptor: MessageDescriptor = {id: ''},
  rawValues: Record<string, PrimitiveType> = {}
) {
  // Process all the values before they are used when formatting the ICU
  // Message string. Since the formatted message might be injected via
  // `innerHTML`, all String-based values need to be HTML-escaped.
  let escapedValues = Object.keys(rawValues).reduce(
    (escaped: Record<string, any>, name) => {
      let value = rawValues[name];
      escaped[name] = typeof value === 'string' ? escape(value) : value;
      return escaped;
    },
    {}
  );

  return formatMessage(config, state, messageDescriptor, escapedValues);
}

export const formatters = {
  formatNumber,
  formatDate,
  formatTime,
  formatMessage,
  formatPlural,
  formatHTMLMessage,
  formatRelativeTime,
};

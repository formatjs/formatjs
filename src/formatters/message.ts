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

import {Formatters, IntlConfig, MessageDescriptor} from '../types';

import {createError, escape} from '../utils';
import {LiteralElement, TYPE} from 'intl-messageformat-parser';
import {FormatXMLElementFn, PrimitiveType} from 'intl-messageformat';

/**
 * Escape a raw msg when we run in prod mode
 * https://github.com/formatjs/formatjs/blob/master/packages/intl-messageformat-parser/src/parser.pegjs#L155
 */
function escapeUnformattedMessage(msg: string): string {
  return msg.replace(/'\{(.*?)\}'/g, `{$1}`);
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

      formattedMessageParts = formatter.formatHTMLMessage(values);
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

      formattedMessageParts = formatter.formatHTMLMessage(values);
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

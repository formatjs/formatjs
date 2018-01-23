/*
 * Copyright 2015, Yahoo Inc.
 * Copyrights licensed under the New BSD License.
 * See the accompanying LICENSE file for terms.
 */

import invariant from 'invariant';
import IntlRelativeFormat from 'intl-relativeformat';

import {
  dateTimeFormatPropTypes,
  numberFormatPropTypes,
  relativeFormatPropTypes,
  pluralFormatPropTypes,
} from './types';

import {escape, filterProps} from './utils';

const DATE_TIME_FORMAT_OPTIONS = Object.keys(dateTimeFormatPropTypes);
const NUMBER_FORMAT_OPTIONS = Object.keys(numberFormatPropTypes);
const RELATIVE_FORMAT_OPTIONS = Object.keys(relativeFormatPropTypes);
const PLURAL_FORMAT_OPTIONS = Object.keys(pluralFormatPropTypes);

const RELATIVE_FORMAT_THRESHOLDS = {
  second: 60, // seconds to minute
  minute: 60, // minutes to hour
  hour: 24, // hours to day
  day: 30, // days to month
  month: 12, // months to year
};


function updateRelativeFormatThresholds(newThresholds) {
  const {thresholds} = IntlRelativeFormat;
  ({
    second: thresholds.second,
    minute: thresholds.minute,
    hour: thresholds.hour,
    day: thresholds.day,
    month: thresholds.month,
  } = newThresholds);
}

function getNamedFormat(formats, type, name) {
  let format = formats && formats[type] && formats[type][name];
  if (format) {
    return format;
  }

  if (process.env.NODE_ENV !== 'production') {
    console.error(`[React Intl] No ${type} format named: ${name}`);
  }
}

export function convertDigitsToWest(str) {
    const DIGIT_COVERT_MAP = {
                              '١': '1', '٢': '2', '٣': '3', '٤': '4', '٥': '5', '٦': '6', '٧': '7', '٨': '8', '٩': '9',
                              '٠': '0', '०': '0','१': '1', '२': '2', '३': '3', '४': '4', '५': '5', '६': '6', '७': '7',
                              '८': '8', '९': '9', '১': '1', '২': '2', '৩': '3', '৪': '4', '৫': '5', '৬': '6', '৭': '7',
                              '৮': '8', '৯': '9', '۴': '4', '۵': '5', '۶': '6'
                          };

    const DIGIT_REGEX = /[١٢٣٤٥٦٧٨٩٠०१२३४५६७८९১২৩৪৫৬৭৮৯۴۵۶]/g;

    return ('' + str).replace(DIGIT_REGEX, match => DIGIT_COVERT_MAP[match]);
}
export function formatDate(config, state, value, options = {}) {
  const {locale, formats, useWestDigits} = config;
  const {format} = options;

  let date = new Date(value);
  let defaults = format && getNamedFormat(formats, 'date', format);
  let filteredOptions = filterProps(
    options,
    DATE_TIME_FORMAT_OPTIONS,
    defaults
  );

  try {
    let result =   state.getDateTimeFormat(locale, filteredOptions).format(date);

    if (useWestDigits) {
        return convertDigitsToWest(result);
    }

    return result;
  } catch (e) {
    if (process.env.NODE_ENV !== 'production') {
      console.error(`[React Intl] Error formatting date.\n${e}`);
    }
  }

  return String(date);
}

export function formatTime(config, state, value, options = {}) {
  const {locale, formats, useWestDigits} = config;
  const {format} = options;

  let date = new Date(value);
  let defaults = format && getNamedFormat(formats, 'time', format);
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

  try {
    let result =  state.getDateTimeFormat(locale, filteredOptions).format(date);

    if (useWestDigits) {
        return convertDigitsToWest(result);
    }

    return result;
  } catch (e) {
    if (process.env.NODE_ENV !== 'production') {
      console.error(`[React Intl] Error formatting time.\n${e}`);
    }
  }

  return String(date);
}

export function formatRelative(config, state, value, options = {}) {
  const {locale, formats, useWestDigits} = config;
  const {format} = options;

  let date = new Date(value);
  let now = new Date(options.now);
  let defaults = format && getNamedFormat(formats, 'relative', format);
  let filteredOptions = filterProps(options, RELATIVE_FORMAT_OPTIONS, defaults);

  // Capture the current threshold values, then temporarily override them with
  // specific values just for this render.
  const oldThresholds = {...IntlRelativeFormat.thresholds};
  updateRelativeFormatThresholds(RELATIVE_FORMAT_THRESHOLDS);

  try {
    let result = state.getRelativeFormat(locale, filteredOptions).format(date, {
      now: isFinite(now) ? now : state.now(),
    });

    if (useWestDigits) {
        return convertDigitsToWest(result);
    }

    return result;
  } catch (e) {
    if (process.env.NODE_ENV !== 'production') {
      console.error(`[React Intl] Error formatting relative time.\n${e}`);
    }
  } finally {
    updateRelativeFormatThresholds(oldThresholds);
  }

  return String(date);
}

export function formatNumber(config, state, value, options = {}) {
  const {locale, formats, useWestDigits} = config;
  const {format} = options;

  let defaults = format && getNamedFormat(formats, 'number', format);
  let filteredOptions = filterProps(options, NUMBER_FORMAT_OPTIONS, defaults);

  try {
      let result = state.getNumberFormat(locale, filteredOptions).format(value);
      if (useWestDigits) {
          return convertDigitsToWest(result);
      }

      return result;
  } catch (e) {
    if (process.env.NODE_ENV !== 'production') {
      console.error(`[React Intl] Error formatting number.\n${e}`);
    }
  }

  return String(value);
}

export function formatPlural(config, state, value, options = {}) {
  const {locale, useWestDigits} = config;

  let filteredOptions = filterProps(options, PLURAL_FORMAT_OPTIONS);

  try {
    let result = state.getPluralFormat(locale, filteredOptions).format(value);
    if (useWestDigits) {
        return convertDigitsToWest(result);
    }

    return result;
  } catch (e) {
    if (process.env.NODE_ENV !== 'production') {
      console.error(`[React Intl] Error formatting plural.\n${e}`);
    }
  }

  return 'other';
}

export function formatMessage(
  config,
  state,
  messageDescriptor = {},
  values = {}
) {
  const {locale, formats, messages, defaultLocale, defaultFormats, useWestDigits} = config;

  const {id, defaultMessage} = messageDescriptor;

  // `id` is a required field of a Message Descriptor.
  invariant(id, '[React Intl] An `id` must be provided to format a message.');

  const message = messages && messages[id];
  const hasValues = Object.keys(values).length > 0;

  // Avoid expensive message formatting for simple messages without values. In
  // development messages will always be formatted in case of missing values.
  if (!hasValues && process.env.NODE_ENV === 'production') {
    return message || defaultMessage || id;
  }

  let formattedMessage;

  if (message) {
    try {
      let formatter = state.getMessageFormat(message, locale, formats);

      formattedMessage = formatter.format(values);
    } catch (e) {
      if (process.env.NODE_ENV !== 'production') {
        console.error(
          `[React Intl] Error formatting message: "${id}" for locale: "${locale}"` +
            (defaultMessage ? ', using default message as fallback.' : '') +
            `\n${e}`
        );
      }
    }
  } else {
    if (process.env.NODE_ENV !== 'production') {
      // This prevents warnings from littering the console in development
      // when no `messages` are passed into the <IntlProvider> for the
      // default locale, and a default message is in the source.
      if (
        !defaultMessage ||
        (locale && locale.toLowerCase() !== defaultLocale.toLowerCase())
      ) {
        console.error(
          `[React Intl] Missing message: "${id}" for locale: "${locale}"` +
            (defaultMessage ? ', using default message as fallback.' : '')
        );
      }
    }
  }

  if (!formattedMessage && defaultMessage) {
    try {
      let formatter = state.getMessageFormat(
        defaultMessage,
        defaultLocale,
        defaultFormats
      );

      formattedMessage = formatter.format(values);
    } catch (e) {
      if (process.env.NODE_ENV !== 'production') {
        console.error(
          `[React Intl] Error formatting the default message for: "${id}"` +
            `\n${e}`
        );
      }
    }
  }

  if (!formattedMessage) {
    if (process.env.NODE_ENV !== 'production') {
      console.error(
        `[React Intl] Cannot format message: "${id}", ` +
          `using message ${message || defaultMessage
            ? 'source'
            : 'id'} as fallback.`
      );
    }
  }

  let result  = formattedMessage || message || defaultMessage || id;

  if (useWestDigits) {
      return convertDigitsToWest(result);
  }

  return result;
}

export function formatHTMLMessage(
  config,
  state,
  messageDescriptor,
  rawValues = {}
) {
  // Process all the values before they are used when formatting the ICU
  // Message string. Since the formatted message might be injected via
  // `innerHTML`, all String-based values need to be HTML-escaped.
  let escapedValues = Object.keys(rawValues).reduce((escaped, name) => {
    let value = rawValues[name];
    escaped[name] = typeof value === 'string' ? escape(value) : value;
    return escaped;
  }, {});

  return formatMessage(config, state, messageDescriptor, escapedValues);
}

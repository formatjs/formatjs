/*
 * Copyright 2015, Yahoo Inc.
 * Copyrights licensed under the New BSD License.
 * See the accompanying LICENSE file for terms.
 */

import {Formatters, IntlConfig, IntlFormatters} from '../types';

import {filterProps, getNamedFormat} from '../utils';
import {ReactIntlError, ReactIntlErrorCode} from '../error';
import {DateTimeFormatOptions} from '@formatjs/intl-datetimeformat';

const DATE_TIME_FORMAT_OPTIONS: Array<keyof DateTimeFormatOptions> = [
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
  'hourCycle',
  // 'dateStyle',
  // 'timeStyle',
  'fractionalSecondDigits',
  'calendar',
  // 'dayPeriod',
  'numberingSystem',
];

export function getFormatter(
  {
    locale,
    formats,
    onError,
    timeZone,
  }: Pick<IntlConfig, 'locale' | 'formats' | 'onError' | 'timeZone'>,
  type: 'date' | 'time',
  getDateTimeFormat: Formatters['getDateTimeFormat'],
  options: Parameters<IntlFormatters['formatDate']>[1] = {}
): Intl.DateTimeFormat {
  const {format} = options;
  const defaults = {
    ...(timeZone && {timeZone}),
    ...(format && getNamedFormat(formats!, type, format, onError)),
  };

  let filteredOptions = filterProps(
    options,
    DATE_TIME_FORMAT_OPTIONS,
    defaults
  );

  if (
    type === 'time' &&
    !filteredOptions.hour &&
    !filteredOptions.minute &&
    !filteredOptions.second
  ) {
    // Add default formatting options if hour, minute, or second isn't defined.
    filteredOptions = {...filteredOptions, hour: 'numeric', minute: 'numeric'};
  }

  return getDateTimeFormat(locale, filteredOptions);
}

export function formatDate(
  config: Pick<IntlConfig, 'locale' | 'formats' | 'onError' | 'timeZone'>,
  getDateTimeFormat: Formatters['getDateTimeFormat'],
  value?: Parameters<IntlFormatters['formatDate']>[0],
  options: Parameters<IntlFormatters['formatDate']>[1] = {}
): string {
  const date = typeof value === 'string' ? new Date(value || 0) : value;
  try {
    return getFormatter(config, 'date', getDateTimeFormat, options).format(
      date
    );
  } catch (e) {
    config.onError(
      new ReactIntlError(
        ReactIntlErrorCode.FORMAT_ERROR,
        'Error formatting date.',
        e
      )
    );
  }

  return String(date);
}

export function formatTime(
  config: Pick<IntlConfig, 'locale' | 'formats' | 'onError' | 'timeZone'>,
  getDateTimeFormat: Formatters['getDateTimeFormat'],
  value?: Parameters<IntlFormatters['formatTime']>[0],
  options: Parameters<IntlFormatters['formatTime']>[1] = {}
): string {
  const date = typeof value === 'string' ? new Date(value || 0) : value;

  try {
    return getFormatter(config, 'time', getDateTimeFormat, options).format(
      date
    );
  } catch (e) {
    config.onError(
      new ReactIntlError(
        ReactIntlErrorCode.FORMAT_ERROR,
        'Error formatting time.',
        e
      )
    );
  }

  return String(date);
}

export function formatDateToParts(
  config: Pick<IntlConfig, 'locale' | 'formats' | 'onError' | 'timeZone'>,
  getDateTimeFormat: Formatters['getDateTimeFormat'],
  value?: Parameters<IntlFormatters['formatDate']>[0],
  options: Parameters<IntlFormatters['formatDate']>[1] = {}
): Intl.DateTimeFormatPart[] {
  const date = typeof value === 'string' ? new Date(value || 0) : value;
  try {
    return getFormatter(
      config,
      'date',
      getDateTimeFormat,
      options
    ).formatToParts(date);
  } catch (e) {
    config.onError(
      new ReactIntlError(
        ReactIntlErrorCode.FORMAT_ERROR,
        'Error formatting date.',
        e
      )
    );
  }

  return [];
}

export function formatTimeToParts(
  config: Pick<IntlConfig, 'locale' | 'formats' | 'onError' | 'timeZone'>,
  getDateTimeFormat: Formatters['getDateTimeFormat'],
  value?: Parameters<IntlFormatters['formatTime']>[0],
  options: Parameters<IntlFormatters['formatTime']>[1] = {}
): Intl.DateTimeFormatPart[] {
  const date = typeof value === 'string' ? new Date(value || 0) : value;

  try {
    return getFormatter(
      config,
      'time',
      getDateTimeFormat,
      options
    ).formatToParts(date);
  } catch (e) {
    config.onError(
      new ReactIntlError(
        ReactIntlErrorCode.FORMAT_ERROR,
        'Error formatting time.',
        e
      )
    );
  }

  return [];
}

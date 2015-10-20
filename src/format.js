/*
 * Copyright 2015, Yahoo Inc.
 * Copyrights licensed under the New BSD License.
 * See the accompanying LICENSE file for terms.
 */

import invariant from 'invariant';

import {
    dateTimeFormatPropTypes,
    numberFormatPropTypes,
    relativeFormatPropTypes,
    pluralFormatPropTypes,
} from './types';

import {escape} from './utils';

const DATE_TIME_FORMAT_OPTIONS = Object.keys(dateTimeFormatPropTypes);
const NUMBER_FORMAT_OPTIONS    = Object.keys(numberFormatPropTypes);
const RELATIVE_FORMAT_OPTIONS  = Object.keys(relativeFormatPropTypes);
const PLURAL_FORMAT_OPTIONS    = Object.keys(pluralFormatPropTypes);

function filterFormatOptions(whitelist, obj, defaults = {}) {
    return whitelist.reduce((opts, name) => {
        if (obj.hasOwnProperty(name)) {
            opts[name] = obj[name];
        } else if (defaults.hasOwnProperty(name)) {
            opts[name] = defaults[name];
        }

        return opts;
    }, {});
}

function getNamedFormat(formats, type, name) {
    let format = formats && formats[type] && formats[type][name];
    if (format) {
        return format;
    }

    if (process.env.NODE_ENV !== 'production') {
        console.error(
            `[React Intl] No ${type} format named: ${name}`
        );
    }
}

export function formatDate(config, state, value, options = {}) {
    const {locale, formats} = config;
    const {format}          = options;

    let date     = new Date(value);
    let defaults = format && getNamedFormat(formats, 'date', format);

    let filteredOptions = filterFormatOptions(
        DATE_TIME_FORMAT_OPTIONS,
        options, defaults
    );

    return state.getDateTimeFormat(locale, filteredOptions).format(date);
}

export function formatTime(config, state, value, options = {}) {
    const {locale, formats} = config;
    const {format}          = options;

    let date     = new Date(value);
    let defaults = format && getNamedFormat(formats, 'time', format);

    let filteredOptions = filterFormatOptions(
        DATE_TIME_FORMAT_OPTIONS,
        options, defaults
    );

    return state.getDateTimeFormat(locale, filteredOptions).format(date);
}

export function formatRelative(config, state, value, options = {}) {
    const {locale, formats} = config;
    const {now, format}     = options;

    let date     = new Date(value);
    let defaults = format && getNamedFormat(formats, 'relative', format);

    let filteredOptions = filterFormatOptions(
        RELATIVE_FORMAT_OPTIONS,
        options, defaults
    );

    return state.getRelativeFormat(locale, filteredOptions).format(date, {now});
}

export function formatNumber(config, state, value, options = {}) {
    const {locale, formats} = config;
    const {format}          = options;

    let defaults = format && getNamedFormat(formats, 'number', format);

    let filteredOptions = filterFormatOptions(
        NUMBER_FORMAT_OPTIONS,
        options, defaults
    );

    return state.getNumberFormat(locale, filteredOptions).format(value);
}

export function formatPlural(config, state, value, options = {}) {
    const {locale} = config;

    let filteredOptions = filterFormatOptions(PLURAL_FORMAT_OPTIONS, options);

    return state.getPluralFormat(locale, filteredOptions).format(value);
}

export function formatMessage(config, state, messageDescriptor, values = {}) {
    const {
        locale,
        formats,
        messages,
        defaultLocale,
        defaultFormats,
    } = config;

    const {
        id,
        defaultMessage,
    } = messageDescriptor;

    invariant(id, '[React Intl] An `id` must be provided to format a message.');

    let message = messages && messages[id];

    if (!(message || defaultMessage)) {
        if (process.env.NODE_ENV !== 'production') {
            console.error(
                `[React Intl] Cannot format message. ` +
                `Missing message: "${id}" for locale: "${locale}", ` +
                `and no default message was provided.`
            );
        }

        return id;
    }

    let formattedMessage;

    if (message) {
        try {
            let formatter = state.getMessageFormat(
                message, locale, formats
            );

            formattedMessage = formatter.format(values);
        } catch (e) {
            if (process.env.NODE_ENV !== 'production') {
                console.error(
                    `[React Intl] Error formatting message: "${id}"\n${e}`
                );
            }
        }
    }

    if (!formattedMessage && defaultMessage) {
        try {
            let formatter = state.getMessageFormat(
                defaultMessage, defaultLocale, defaultFormats
            );

            formattedMessage = formatter.format(values);
        } catch (e) {
            if (process.env.NODE_ENV !== 'production') {
                console.error(
                    `[React Intl] Error formatting the default message for: ` +
                    `"${id}"\n${e}`
                );
            }
        }
    }

    if (!formattedMessage) {
        if (process.env.NODE_ENV !== 'production') {
            console.warn(
                `[React Intl] Using source fallback for message: "${id}"`
            );
        }
    }

    return formattedMessage || message || defaultMessage || id;
}

export function formatHTMLMessage(config, state, messageDescriptor, rawValues = {}) {
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

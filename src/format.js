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
    let format;

    try {
        format = formats[type][name];
    } finally {
        if (!format) {
            // TODO: warn in dev.
        }
    }

    return format;
}

function getMessage(messages, id) {
    if (messages) {
        return messages[id];
    }

    // TODO: warn in dev when message is missing.
}

export function formatDate(intl, value, options = {}) {
    let date     = new Date(value);
    let {format} = options;
    let defaults = format && getNamedFormat(intl.formats, 'date', format);

    let filteredOptions = filterFormatOptions(
        DATE_TIME_FORMAT_OPTIONS,
        options, defaults
    );

    return intl.getDateTimeFormat(intl.locale, filteredOptions).format(date);
}

export function formatTime(intl, value, options = {}) {
    let date     = new Date(value);
    let {format} = options;
    let defaults = format && getNamedFormat(intl.formats, 'time', format);

    let filteredOptions = filterFormatOptions(
        DATE_TIME_FORMAT_OPTIONS,
        options, defaults
    );

    return intl.getDateTimeFormat(intl.locale, filteredOptions).format(date);
}

export function formatRelative(intl, value, options = {}) {
    let date     = new Date(value);
    let {now}    = options;
    let {format} = options;
    let defaults = format && getNamedFormat(intl.formats, 'relative', format);

    let filteredOptions = filterFormatOptions(
        RELATIVE_FORMAT_OPTIONS,
        options, defaults
    );

    return intl.getRelativeFormat(intl.locale, filteredOptions).format(date, {now});
}

export function formatNumber(intl, value, options = {}) {
    let {format} = options;
    let defaults = format && getNamedFormat(intl.formats, 'number', format);

    let filteredOptions = filterFormatOptions(
        NUMBER_FORMAT_OPTIONS,
        options, defaults
    );

    return intl.getNumberFormat(intl.locale, filteredOptions).format(value);
}

export function formatPlural(intl, value, options = {}) {
    let filteredOptions = filterFormatOptions(PLURAL_FORMAT_OPTIONS, options);
    return intl.getPluralFormat(intl.locale, filteredOptions).format(value);
}

export function formatMessage(intl, messageDescriptor, values = {}) {
    let {
        locale,
        formats,
        messages,
        defaultLocale,
        defaultFormats,
    } = intl;

    let {
        id,
        defaultMessage,
    } = messageDescriptor;

    let message = getMessage(messages, id);

    if (!(message || defaultMessage)) {
        // TODO: warn in dev.
        return id;
    }

    let formattedMessage;

    if (message) {
        try {
            let formatter = intl.getMessageFormat(
                message, locale, formats
            );

            formattedMessage = formatter.format(values);
        } catch (e) {
            // TODO: warn in dev.
        }
    }

    if (!formattedMessage && defaultMessage) {
        try {
            let formatter = intl.getMessageFormat(
                defaultMessage, defaultLocale, defaultFormats
            );

            formattedMessage = formatter.format(values);
        } catch (e) {
            // TODO: warn in dev.
        }
    }

    // TODO: Should the string first be trimmed? This will support strings
    // defined using template literals.
    return formattedMessage || message || defaultMessage || id;
}

export function formatHTMLMessage(intl, messageDescriptor, rawValues = {}) {
    // Process all the values before they are used when formatting the ICU
    // Message string. Since the formatted message might be injected via
    // `innerHTML`, all String-based values need to be HTML-escaped.
    let escapedValues = Object.keys(rawValues).reduce((escaped, name) => {
        let value = rawValues[name];
        escaped[name] = typeof value === 'string' ? escape(value) : value;
        return escaped;
    }, {});

    return formatMessage(intl, messageDescriptor, escapedValues);
}

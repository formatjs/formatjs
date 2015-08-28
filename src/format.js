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

export function formatDate(intl, localeData, value, options = {}) {
    const {locale, formats} = localeData;
    const {format}          = options;

    let date     = new Date(value);
    let defaults = format && getNamedFormat(formats, 'date', format);

    let filteredOptions = filterFormatOptions(
        DATE_TIME_FORMAT_OPTIONS,
        options, defaults
    );

    return intl.getDateTimeFormat(locale, filteredOptions).format(date);
}

export function formatTime(intl, localeData, value, options = {}) {
    const {locale, formats} = localeData;
    const {format}          = options;

    let date     = new Date(value);
    let defaults = format && getNamedFormat(formats, 'time', format);

    let filteredOptions = filterFormatOptions(
        DATE_TIME_FORMAT_OPTIONS,
        options, defaults
    );

    return intl.getDateTimeFormat(locale, filteredOptions).format(date);
}

export function formatRelative(intl, localeData, value, options = {}) {
    const {locale, formats} = localeData;
    const {now, format}     = options;

    let date     = new Date(value);
    let defaults = format && getNamedFormat(formats, 'relative', format);

    let filteredOptions = filterFormatOptions(
        RELATIVE_FORMAT_OPTIONS,
        options, defaults
    );

    return intl.getRelativeFormat(locale, filteredOptions).format(date, {now});
}

export function formatNumber(intl, localeData, value, options = {}) {
    const {locale, formats} = localeData;
    const {format}          = options;

    let defaults = format && getNamedFormat(formats, 'number', format);

    let filteredOptions = filterFormatOptions(
        NUMBER_FORMAT_OPTIONS,
        options, defaults
    );

    return intl.getNumberFormat(locale, filteredOptions).format(value);
}

export function formatPlural(intl, localeData, value, options = {}) {
    const {locale} = localeData;
    let filteredOptions = filterFormatOptions(PLURAL_FORMAT_OPTIONS, options);
    return intl.getPluralFormat(locale, filteredOptions).format(value);
}

export function formatMessage(intl, localeData, messageDescriptor, values = {}) {
    const {
        locale,
        formats,
        messages,
        defaultLocale,
        defaultFormats,
    } = localeData;

    const {
        id,
        defaultMessage,
    } = messageDescriptor;

    // TODO: What should we do when the message descriptor doesn't have an `id`?
    // Should we return some placeholder value, not care, or throw?

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
            let formatter = intl.getMessageFormat(
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
            let formatter = intl.getMessageFormat(
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

    // TODO: Should the string first be trimmed? This will support strings
    // defined using template literals. <pre> rendering would be the counter.
    return formattedMessage || message || defaultMessage || id;
}

export function formatHTMLMessage(intl, localeData, messageDescriptor, rawValues = {}) {
    // Process all the values before they are used when formatting the ICU
    // Message string. Since the formatted message might be injected via
    // `innerHTML`, all String-based values need to be HTML-escaped.
    let escapedValues = Object.keys(rawValues).reduce((escaped, name) => {
        let value = rawValues[name];
        escaped[name] = typeof value === 'string' ? escape(value) : value;
        return escaped;
    }, {});

    return formatMessage(intl, localeData, messageDescriptor, escapedValues);
}

/*
Copyright (c) 2014, Yahoo! Inc. All rights reserved.
Copyrights licensed under the New BSD License.
See the accompanying LICENSE file for terms.
*/

/* jshint esnext: true */

import IntlMessageFormat from 'intl-messageformat';

export {
    cache,
    getDateTimeFormat,
    getNumberFormat,
    getMessageFormat
};

// -----------------------------------------------------------------------------

// Cache to hold `DateTimeFormat`, `NumberFormat`, and `IntlMessageFormat`
// instances for reuse.
var cache = {
    dateTimeFormats: {},
    numberFormats  : {},
    messageFormats : {}
};

function getDateTimeFormat(locales, options) {
    options || (options = {});

    var cacheId = getCacheId([locales, options]),
        format  = cache.dateTimeFormats[cacheId];

    if (!format) {
        format = new Intl.DateTimeFormat(locales, options);

        if (cacheId) {
            cache.dateTimeFormats[cacheId] = format;
        }
    }

    return format;
}

function getNumberFormat(locales, options) {
    options || (options = {});

    var cacheId = getCacheId([locales, options]),
        format  = cache.numberFormats[cacheId];

    if (!format) {
        format = new Intl.NumberFormat(locales, options);

        if (cacheId) {
            cache.numberFormats[cacheId] = format;
        }
    }

    return format;
}

function getMessageFormat(message, locales, options) {
    options || (options = {});

    var cacheId = getCacheId([message, locales, options]),
        format  = cache.messageFormats[cacheId];

    if (!format) {
        format = new IntlMessageFormat(message, locales, options);

        if (cacheId) {
            cache.messageFormats[cacheId] = format;
        }
    }

    return format;
}

// -- Utilities ----------------------------------------------------------------

function getCacheId(inputs) {
    // When JSON is not available in the runtime, we will not create a cache id.
    if (!JSON) { return; }

    var cacheId = [];

    var i, len, input;

    for (i = 0, len = inputs.length; i < len; i += 1) {
        input = inputs[i];

        if (input && typeof input === 'object') {
            cacheId.push(orderedProps(input));
        } else {
            cacheId.push(input);
        }
    }

    return JSON.stringify(cacheId);
}

function orderedProps(obj) {
    var props = [],
        keys  = [];

    var key, i, len, prop;

    for (key in obj) {
        if (obj.hasOwnProperty(key)) {
            keys.push(key);
        }
    }

    var orderedKeys = keys.sort();

    for (i = 0, len = orderedKeys.length; i < len; i += 1) {
        key  = orderedKeys[i];
        prop = {};

        prop[key] = obj[key];
        props[i]  = prop;
    }

    return props;
}

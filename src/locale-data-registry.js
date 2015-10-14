/*
 * Copyright 2015, Yahoo Inc.
 * Copyrights licensed under the New BSD License.
 * See the accompanying LICENSE file for terms.
 */

import {__addLocaleData as addIMFLocaleData} from 'intl-messageformat';
import {__addLocaleData as addIRFLocaleData} from 'intl-relativeformat';

const registeredLocales = Object.create(null);

export function addLocaleData(data = []) {
    let locales = Array.isArray(data) ? data : [data];

    locales.forEach((localeData) => {
        addIMFLocaleData(localeData);
        addIRFLocaleData(localeData);

        let {locale} = localeData;
        registeredLocales[locale.toLowerCase()] = locale;
    });
}

export function hasLocaleData(locale) {
    return !!registeredLocales[locale.toLowerCase()];
}

/*
 * Copyright 2015, Yahoo Inc.
 * Copyrights licensed under the New BSD License.
 * See the accompanying LICENSE file for terms.
 */

import IntlRelativeFormat from 'intl-relativeformat';

export function addLocaleData(data = []) {
  let locales = Array.isArray(data) ? data : [data];

  IntlRelativeFormat.__addLocaleData(...locales.filter(l => !!l.locale))
}

export function hasLocaleData(locale) {
  let localeParts = (locale || '').split('-');

  while (localeParts.length > 0) {
    if (hasIMFAndIRFLocaleData(localeParts.join('-'))) {
      return true;
    }

    localeParts.pop();
  }

  return false;
}

function hasIMFAndIRFLocaleData(locale) {
  let normalizedLocale = locale && locale.toLowerCase();

  return !!(
    IntlRelativeFormat.__localeData__[normalizedLocale]
  );
}

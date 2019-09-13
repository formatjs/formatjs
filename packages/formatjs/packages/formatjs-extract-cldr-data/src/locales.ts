/*
 * Copyright 2015, Yahoo Inc.
 * Copyrights licensed under the New BSD License.
 * See the accompanying LICENSE file for terms.
 */
// These are the exceptions to the default algorithm for determining a locale's
// parent locale.
import * as AVAILABLE_LOCALES from 'cldr-core/availableLocales.json';

export function getAllLocales() {
  return AVAILABLE_LOCALES.availableLocales.full.sort();
}

export function getAllLanguages() {
  return new Set(
    AVAILABLE_LOCALES.availableLocales.full.map(l => l.split('-')[0])
  );
}

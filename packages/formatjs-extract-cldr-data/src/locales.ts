/*
 * Copyright 2015, Yahoo Inc.
 * Copyrights licensed under the New BSD License.
 * See the accompanying LICENSE file for terms.
 */
// These are the exceptions to the default algorithm for determining a locale's
// parent locale.
const AVAILABLE_LOCALES = require('cldr-core/availableLocales.json');

export function getAllLocales() {
  return AVAILABLE_LOCALES.availableLocales.full.sort();
}

export function getAllLanguages(): Set<string> {
  return new Set(
    AVAILABLE_LOCALES.availableLocales.full.map((l: string) => l.split('-')[0])
  );
}

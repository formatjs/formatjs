/*
 * Copyright 2015, Yahoo Inc.
 * Copyrights licensed under the New BSD License.
 * See the accompanying LICENSE file for terms.
 */
'use strict';

// These are the exceptions to the default algorithm for determining a locale's
// parent locale.
import * as PARENT_LOCALES from 'cldr-core/supplemental/parentLocales.json';
import * as AVAILABLE_LOCALES from 'cldr-core/availableLocales.json';
import {resolve, dirname} from 'path';
const PARENT_LOCALES_HASH =
  PARENT_LOCALES.supplemental.parentLocales.parentLocale;
import {Locale} from './types';
import {sync as globSync} from 'glob';

export const dateFieldsLocales = globSync('*/dateFields.json', {
  cwd: resolve(
    dirname(require.resolve('cldr-dates-full/package.json')),
    './main'
  ),
}).map(dirname);

export const unitsLocales = globSync('*/units.json', {
  cwd: resolve(
    dirname(require.resolve('cldr-units-full/package.json')),
    './main'
  ),
}).map(dirname);

// Some locales that have a `pluralRuleFunction` don't have a `dateFields.json`
// file, and visa versa, so this creates a unique collection of all locales in
// the CLDR for which we need data from.
const ALL_LOCALES_HASH: Record<
  Locale,
  Locale
> = AVAILABLE_LOCALES.availableLocales.full
  .sort()
  .reduce(function(hash: Record<Locale, Locale>, locale) {
    locale = locale === 'en-US-POSIX' ? 'en-US' : locale;
    hash[locale.toLowerCase()] = locale;
    return hash;
  }, {});

export function getAllLocales() {
  return Object.keys(ALL_LOCALES_HASH);
}

export function getAllLanguages() {
  return Object.keys(
    AVAILABLE_LOCALES.availableLocales.full.reduce(
      (all: Record<string, boolean>, locale) => {
        all[locale.split('-')[0]] = true;
        return all;
      },
      {}
    )
  );
}

export function getParentLocale(locale: Locale): Locale | undefined {
  try {
    locale = normalizeLocale(locale);
  } catch (e) {}

  // If we don't know about the locale, or if it's the "root" locale, then its
  // parent should be `undefined`.
  if (!locale || locale === 'root') {
    return;
  }

  // First check the exceptions for locales which don't follow the standard
  // hierarchical pattern.
  var parentLocale = PARENT_LOCALES_HASH[locale as 'en-150'];
  if (parentLocale) {
    return parentLocale;
  }

  // Be default, the language tags are hierarchal, therefore we can identify
  // the parent locale by simply popping off the last segment.
  var localeParts = locale.split('-');
  if (localeParts.length > 1) {
    localeParts.pop();
    return localeParts.join('-');
  }

  // When there's nothing left in the hierarchy, the parent is the "root".
  return 'root';
}

export function normalizeLocale(locale: Locale): Locale {
  var normalizedLocale = ALL_LOCALES_HASH[locale.toLowerCase()];
  if (normalizedLocale) {
    return normalizedLocale;
  }

  return locale;
}

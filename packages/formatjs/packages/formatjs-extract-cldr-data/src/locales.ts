/*
 * Copyright 2015, Yahoo Inc.
 * Copyrights licensed under the New BSD License.
 * See the accompanying LICENSE file for terms.
 */
'use strict';

// These are the exceptions to the default algorithm for determining a locale's
// parent locale.
import * as PARENT_LOCALES from 'cldr-core/supplemental/parentLocales.json';
const PARENT_LOCALES_HASH =
  PARENT_LOCALES.supplemental.parentLocales.parentLocale;

import {dateFields} from './dateFields';
import {Locale} from './types';

// Some locales that have a `pluralRuleFunction` don't have a `dateFields.json`
// file, and visa versa, so this creates a unique collection of all locales in
// the CLDR for which we need data from.
const ALL_LOCALES_HASH: Record<Locale, Locale> = Object.keys(
  PARENT_LOCALES_HASH
)
  .concat(Object.keys(dateFields))
  .map(function(locale) {
    if (locale === 'en-US-POSIX') {
      return 'en-US';
    }
    return locale;
  })
  .sort()
  .reduce(function(hash: Record<Locale, Locale>, locale) {
    hash[locale.toLowerCase()] = locale;
    return hash;
  }, {});

export function getAllLocales() {
  return Object.keys(ALL_LOCALES_HASH);
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

export function hasDateFields(locale: Locale): boolean {
  return dateFields.hasOwnProperty(normalizeLocale(locale));
}

export function normalizeLocale(locale: Locale): Locale {
  var normalizedLocale = ALL_LOCALES_HASH[locale.toLowerCase()];
  if (normalizedLocale) {
    return normalizedLocale;
  }

  return locale;
}

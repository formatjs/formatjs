/*
 * Copyright 2015, Yahoo Inc.
 * Copyrights licensed under the New BSD License.
 * See the accompanying LICENSE file for terms.
 */

type IntlConstructor = {
  supportedLocalesOf(locales: string | string[], options?: any): string[];
};

export default function areIntlLocalesSupported(
  locales: string | string[],
  constructorsToCheck?: Array<IntlConstructor>
): boolean {
  if (typeof Intl === 'undefined') {
    return false;
  }

  if (!locales) {
    throw new Error('locales must be supplied.');
  }

  if (!Array.isArray(locales)) {
    locales = [locales];
  }

  // Per https://github.com/formatjs/formatjs/issues/151
  if (!constructorsToCheck) {
    constructorsToCheck = [
      Intl.DateTimeFormat,
      Intl.NumberFormat,
      Intl.PluralRules,
    ];
  }

  const intlConstructors = constructorsToCheck.filter(Boolean);

  if (intlConstructors.length === 0) {
    return false;
  }

  return intlConstructors.every(
    intlConstructor =>
      intlConstructor.supportedLocalesOf(locales).length === locales.length
  );
}

/*
 * Copyright 2015, Yahoo Inc.
 * Copyrights licensed under the New BSD License.
 * See the accompanying LICENSE file for terms.
 */
const DEFAULT_CONSTRUCTORS = [
  Intl.DateTimeFormat,
  Intl.NumberFormat,
  Intl.PluralRules
];
export default function areIntlLocalesSupported(
  locales: string | string[],
  constructorsToCheck = DEFAULT_CONSTRUCTORS
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

  const intlConstructors = constructorsToCheck.filter(Boolean);

  if (intlConstructors.length === 0) {
    return false;
  }

  return intlConstructors.every(
    intlConstructor =>
      intlConstructor.supportedLocalesOf(locales).length === locales.length
  );
}

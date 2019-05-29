/*
 * Copyright 2015, Yahoo Inc.
 * Copyrights licensed under the New BSD License.
 * See the accompanying LICENSE file for terms.
 */
export default function areIntlLocalesSupported(
  locales: string | string[]
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

  const intlConstructors = [
    Intl.Collator,
    Intl.DateTimeFormat,
    Intl.NumberFormat
  ].filter(Boolean);

  if (intlConstructors.length === 0) {
    return false;
  }

  return intlConstructors.every(
    intlConstructor =>
      intlConstructor.supportedLocalesOf(locales).length === locales.length
  );
}

import {BestAvailableLocale} from './BestAvailableLocale';
import {LookupMatcherResult} from '../types/core';
import {UNICODE_EXTENSION_SEQUENCE_REGEX} from './utils';

/**
 * https://tc39.es/ecma402/#sec-bestfitmatcher
 * @param availableLocales
 * @param requestedLocales
 * @param getDefaultLocale
 */
export function BestFitMatcher(
  availableLocales: string[],
  requestedLocales: string[],
  getDefaultLocale: () => string
): LookupMatcherResult {
  const result: LookupMatcherResult = {locale: ''};
  for (const locale of requestedLocales) {
    const noExtensionLocale = locale.replace(
      UNICODE_EXTENSION_SEQUENCE_REGEX,
      ''
    );
    const availableLocale = BestAvailableLocale(
      availableLocales,
      noExtensionLocale
    );
    if (availableLocale) {
      result.locale = availableLocale;
      if (locale !== noExtensionLocale) {
        result.extension = locale.slice(
          noExtensionLocale.length + 1,
          locale.length
        );
      }
      return result;
    }
  }
  result.locale = getDefaultLocale();
  return result;
}

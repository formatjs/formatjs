import {LocaleData} from '../types/core';

export function getLocaleHierarchy(locale: string): string[] {
  const results = [locale];
  const localeParts = locale.split('-');
  for (let i = localeParts.length; i > 1; i--) {
    results.push(localeParts.slice(0, i - 1).join('-'));
  }
  return results;
}

class MissingLocaleDataError extends Error {
  public type = 'MISSING_LOCALE_DATA';
}

export function isMissingLocaleDataError(
  e: Error
): e is MissingLocaleDataError {
  return (e as MissingLocaleDataError).type === 'MISSING_LOCALE_DATA';
}

export function unpackData<T extends Record<string, any>>(
  locale: string,
  localeData: LocaleData<T>,
  /** By default shallow merge the dictionaries. */
  reducer: (all: T, d: T) => T = (all, d) => ({...all, ...d})
): T {
  const localeHierarchy = getLocaleHierarchy(locale);
  const dataToMerge = localeHierarchy
    .map(l => localeData.data[l])
    .filter(Boolean);
  if (!dataToMerge.length) {
    throw new MissingLocaleDataError(
      `Missing locale data for "${locale}", lookup hierarchy: ${localeHierarchy.join(
        ', '
      )}`
    );
  }
  dataToMerge.reverse();
  return dataToMerge.reduce(reducer, {} as T);
}

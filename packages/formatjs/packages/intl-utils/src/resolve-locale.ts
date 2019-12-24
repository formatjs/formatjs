import {getCanonicalLocales} from './get-canonical-locales';
import {invariant} from './invariant';
import {toObject, getOption} from './polyfill-utils';
import {LocaleData} from './types';

interface ResolveLocaleResult {
  locale: string;
  dataLocale: string;
  [k: string]: any;
}

export function createResolveLocale<
  K extends string,
  D extends {[k in K]: any}
>(getDefaultLocale: () => string) {
  const lookupMatcher = createLookupMatcher(getDefaultLocale);
  const bestFitMatcher = createBestFitMatcher(getDefaultLocale);
  /**
   * https://tc39.es/ecma402/#sec-resolvelocale
   */
  return function resolveLocale(
    availableLocales: string[],
    requestedLocales: string[],
    options: {localeMatcher: string; [k: string]: string},
    relevantExtensionKeys: K[],
    localeData: Record<string, D>
  ): ResolveLocaleResult {
    const matcher = options.localeMatcher;
    let r: LookupMatcherResult;
    if (matcher === 'lookup') {
      r = lookupMatcher(availableLocales, requestedLocales);
    } else {
      r = bestFitMatcher(availableLocales, requestedLocales);
    }
    let foundLocale = r.locale;
    const result: ResolveLocaleResult = {locale: '', dataLocale: foundLocale};
    let supportedExtension = '-u';
    for (const key of relevantExtensionKeys) {
      const foundLocaleData = localeData[foundLocale];
      invariant(
        typeof foundLocaleData === 'object' && foundLocaleData !== null,
        `locale data ${key} must be an object`
      );
      const keyLocaleData = foundLocaleData[key];
      invariant(
        Array.isArray(keyLocaleData),
        `keyLocaleData for ${key} must be an array`
      );
      let value = keyLocaleData[0];
      invariant(
        typeof value === 'string' || value === null,
        'value must be string or null'
      );
      let supportedExtensionAddition = '';
      if (r.extension) {
        const requestedValue = unicodeExtensionValue(r.extension, key);
        if (requestedValue !== undefined) {
          if (requestedValue !== '') {
            if (~keyLocaleData.indexOf(requestedValue)) {
              value = requestedValue;
              supportedExtensionAddition = `-${key}-${value}`;
            }
          } else if (~requestedValue.indexOf('true')) {
            value = 'true';
            supportedExtensionAddition = `-${key}`;
          }
        }
      }
      if (key in options) {
        const optionsValue = options[key];
        invariant(
          typeof optionsValue === 'string' ||
            typeof optionsValue === 'undefined' ||
            optionsValue === null,
          'optionsValue must be String, Undefined or Null'
        );
        if (~keyLocaleData.indexOf(optionsValue)) {
          if (optionsValue !== value) {
            value = optionsValue;
            supportedExtensionAddition = '';
          }
        }
      }
      result[key] = value;
      supportedExtension += supportedExtensionAddition;
    }
    if (supportedExtension.length > 2) {
      const privateIndex = foundLocale.indexOf('-x-');
      if (privateIndex === -1) {
        foundLocale = foundLocale + supportedExtension;
      } else {
        const preExtension = foundLocale.slice(0, privateIndex);
        const postExtension = foundLocale.slice(
          privateIndex,
          foundLocale.length
        );
        foundLocale = preExtension + supportedExtension + postExtension;
      }
      foundLocale = getCanonicalLocales(foundLocale)[0];
    }
    result.locale = foundLocale;
    return result;
  };
}

/**
 * https://tc39.es/ecma402/#sec-unicodeextensionvalue
 * @param extension
 * @param key
 */
function unicodeExtensionValue(extension: string, key: string) {
  invariant(key.length === 2, 'key must have 2 elements');
  const size = extension.length;
  let searchValue = `-${key}-`;
  let pos = extension.indexOf(searchValue);
  if (pos !== -1) {
    const start = pos + 4;
    let end = start;
    let k = start;
    let done = false;
    while (!done) {
      const e = extension.indexOf('-', k);
      let len;
      if (e === -1) {
        len = size - k;
      } else {
        len = e - k;
      }
      if (len === 2) {
        done = true;
      } else if (e === -1) {
        end = size;
        done = true;
      } else {
        end = e;
        k = e + 1;
      }
    }
    return extension.slice(start, end);
  }
  searchValue = `-${key}`;
  pos = extension.indexOf(searchValue);
  if (pos !== -1 && pos + 3 === size) {
    return '';
  }
  return undefined;
}

const UNICODE_EXTENSION_SEQUENCE_REGEX = /-u(?:-[0-9a-z]{2,8})+/gi;

/**
 * https://tc39.es/ecma402/#sec-bestavailablelocale
 * @param availableLocales
 * @param locale
 */
function bestAvailableLocale(availableLocales: string[], locale: string) {
  let candidate = locale;
  while (true) {
    if (~availableLocales.indexOf(candidate)) {
      return candidate;
    }
    let pos = candidate.lastIndexOf('-');
    if (!~pos) {
      return undefined;
    }
    if (pos >= 2 && candidate[pos - 2] === '-') {
      pos -= 2;
    }
    candidate = candidate.slice(0, pos);
  }
}

interface LookupMatcherResult {
  locale: string;
  extension?: string;
  nu?: string;
}

function createLookupMatcher(getDefaultLocale: () => string) {
  /**
   * https://tc39.es/ecma402/#sec-lookupmatcher
   */
  return function lookupMatcher(
    availableLocales: string[],
    requestedLocales: string[]
  ): LookupMatcherResult {
    const result: LookupMatcherResult = {locale: ''};
    for (const locale of requestedLocales) {
      const noExtensionLocale = locale.replace(
        UNICODE_EXTENSION_SEQUENCE_REGEX,
        ''
      );
      const availableLocale = bestAvailableLocale(
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
  };
}

function createBestFitMatcher(getDefaultLocale: () => string) {
  return function bestFitMatcher(
    availableLocales: string[],
    requestedLocales: string[]
  ): LookupMatcherResult {
    const result: LookupMatcherResult = {locale: ''};
    for (const locale of requestedLocales) {
      const noExtensionLocale = locale.replace(
        UNICODE_EXTENSION_SEQUENCE_REGEX,
        ''
      );
      const availableLocale = bestAvailableLocale(
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
  };
}

export function getLocaleHierarchy(
  locale: string,
  aliases: Record<string, string>,
  parentLocales: Record<string, string>
): string[] {
  const results = [locale];
  if (aliases[locale as 'zh-CN']) {
    locale = aliases[locale as 'zh-CN'];
    results.push(locale);
  }
  const parentLocale = parentLocales[locale as 'en-150'];
  if (parentLocale) {
    results.push(parentLocale);
  }
  const localeParts = locale.split('-');
  for (let i = localeParts.length; i > 1; i--) {
    results.push(localeParts.slice(0, i - 1).join('-'));
  }
  return results;
}

function lookupSupportedLocales(
  availableLocales: string[],
  requestedLocales: string[]
) {
  const subset: string[] = [];
  for (const locale of requestedLocales) {
    const noExtensionLocale = locale.replace(
      UNICODE_EXTENSION_SEQUENCE_REGEX,
      ''
    );
    const availableLocale = bestAvailableLocale(
      availableLocales,
      noExtensionLocale
    );
    if (availableLocale) {
      subset.push(availableLocale);
    }
  }
  return subset;
}

export function supportedLocales(
  availableLocales: string[],
  requestedLocales: string[],
  options?: {localeMatcher?: 'best fit' | 'lookup'}
): string[] {
  let matcher: 'best fit' | 'lookup' = 'best fit';
  if (options !== undefined) {
    options = toObject(options);
    matcher = getOption(
      options,
      'localeMatcher',
      'string',
      ['lookup', 'best fit'],
      'best fit'
    ) as 'best fit';
  }
  if (matcher === 'best fit') {
    return lookupSupportedLocales(availableLocales, requestedLocales);
  }
  return lookupSupportedLocales(availableLocales, requestedLocales);
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
  const localeHierarchy = getLocaleHierarchy(
    locale,
    localeData.aliases,
    localeData.parentLocales
  );
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

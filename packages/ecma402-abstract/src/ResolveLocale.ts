import {LookupMatcherResult} from '../types/core';
import {LookupMatcher} from './LookupMatcher';
import {BestFitMatcher} from './BestFitMatcher';
import {invariant} from './utils';
import {UnicodeExtensionValue} from './UnicodeExtensionValue';

export interface ResolveLocaleResult {
  locale: string;
  dataLocale: string;
  [k: string]: any;
}

/**
 * https://tc39.es/ecma402/#sec-resolvelocale
 */
export function ResolveLocale<K extends string, D extends {[k in K]: any}>(
  availableLocales: string[],
  requestedLocales: string[],
  options: {localeMatcher: string; [k: string]: string},
  relevantExtensionKeys: K[],
  localeData: Record<string, D>,
  getDefaultLocale: () => string
): ResolveLocaleResult {
  const matcher = options.localeMatcher;
  let r: LookupMatcherResult;
  if (matcher === 'lookup') {
    r = LookupMatcher(availableLocales, requestedLocales, getDefaultLocale);
  } else {
    r = BestFitMatcher(availableLocales, requestedLocales, getDefaultLocale);
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
      `value must be string or null but got ${typeof value} in key ${key}`
    );
    let supportedExtensionAddition = '';
    if (r.extension) {
      const requestedValue = UnicodeExtensionValue(r.extension, key);
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
      const postExtension = foundLocale.slice(privateIndex, foundLocale.length);
      foundLocale = preExtension + supportedExtension + postExtension;
    }
    foundLocale = (Intl as any).getCanonicalLocales(foundLocale)[0];
  }
  result.locale = foundLocale;
  return result;
}

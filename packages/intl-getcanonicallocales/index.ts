import {parseUnicodeLocaleId} from './src/parser';
import {emitUnicodeLocaleId} from './src/emitter';
import {canonicalizeUnicodeLocaleId} from './src/canonicalizer';

/**
 * https://tc39.es/ecma402/#sec-canonicalizelocalelist
 * @param locales
 */
function CanonicalizeLocaleList(locales?: string[] | string): string[] {
  if (locales === undefined) {
    return [];
  }
  const seen: string[] = [];
  if (typeof locales === 'string') {
    locales = [locales];
  }
  for (const locale of locales) {
    const canonicalizedTag = emitUnicodeLocaleId(
      canonicalizeUnicodeLocaleId(parseUnicodeLocaleId(locale))
    );
    if (seen.indexOf(canonicalizedTag) < 0) {
      seen.push(canonicalizedTag);
    }
  }
  return seen;
}

export function getCanonicalLocales(locales?: string[] | string): string[] {
  return CanonicalizeLocaleList(locales);
}

export {
  parseUnicodeLocaleId,
  parseUnicodeLanguageId,
  isStructurallyValidLanguageTag,
  isUnicodeRegionSubtag,
  isUnicodeScriptSubtag,
  isUnicodeLanguageSubtag,
} from './src/parser';
export * from './src/types';
export * from './src/emitter';

import {parse} from './parser';
import {emit} from './emitter';
import {canonicalizeUnicodeLocaleId} from './canonicalizer';

function canonicalizeLocaleList(locales?: string[] | string): string[] {
  if (locales === undefined) {
    return [];
  }
  const seen: string[] = [];
  if (typeof locales === 'string') {
    locales = [locales];
  }
  for (const locale of locales) {
    const canonicalizedTag = emit(canonicalizeUnicodeLocaleId(parse(locale)));
    if (seen.indexOf(canonicalizedTag) < 0) {
      seen.push(canonicalizedTag);
    }
  }
  return seen;
}

export function getCanonicalLocales(locales?: string[] | string): string[] {
  return canonicalizeLocaleList(locales);
}

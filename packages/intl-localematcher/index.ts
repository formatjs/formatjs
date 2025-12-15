import {CanonicalizeLocaleList} from './abstract/CanonicalizeLocaleList.js'
import {ResolveLocale} from './abstract/ResolveLocale.js'

export interface Opts {
  algorithm: 'lookup' | 'best fit'
}

export function match(
  requestedLocales: readonly string[],
  availableLocales: readonly string[],
  defaultLocale: string,
  opts?: Opts
): string {
  return ResolveLocale(
    availableLocales,
    CanonicalizeLocaleList(requestedLocales),
    {
      localeMatcher: opts?.algorithm || 'best fit',
    },
    [],
    {},
    () => defaultLocale
  ).locale
}

export {LookupSupportedLocales} from './abstract/LookupSupportedLocales.js'
export {ResolveLocale} from './abstract/ResolveLocale.js'

import {CanonicalizeLocaleList} from './abstract/CanonicalizeLocaleList'
import {ResolveLocale} from './abstract/ResolveLocale'

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

export {LookupSupportedLocales} from './abstract/LookupSupportedLocales'
export {ResolveLocale} from './abstract/ResolveLocale'

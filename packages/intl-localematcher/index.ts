import {ResolveLocale} from '@formatjs/ecma402-abstract';

export interface Opts {
  algorithm: 'lookup' | 'best fit';
}

export function match(
  requestedLocales: string[],
  availableLocales: string[],
  defaultLocale: string,
  opts?: Opts
): string {
  const locales = availableLocales.reduce((all, l) => {
    all.add(l);
    return all;
  }, new Set<string>());

  return ResolveLocale(
    locales,
    requestedLocales,
    {
      localeMatcher: opts?.algorithm || 'best fit',
    },
    [],
    {},
    () => defaultLocale
  ).locale;
}

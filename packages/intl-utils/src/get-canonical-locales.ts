/**
 * IE11-safe version of getCanonicalLocales since it's ES2016
 * @param locales locales
 */
export function getCanonicalLocales(locales?: string | string[]): string[] {
  // IE11
  const {getCanonicalLocales} = Intl as any;
  if (typeof getCanonicalLocales === 'function') {
    return getCanonicalLocales(locales) as string[];
  }
  // NOTE: we must NOT call `supportedLocalesOf` of a formatjs polyfill, or their implementation
  // will even eventually call this method recursively. Here we use `Intl.DateTimeFormat` since it
  // is not polyfilled by `@formatjs`.
  // TODO: Fix TypeScript type def for this bc undefined is just fine
  return Intl.DateTimeFormat.supportedLocalesOf(locales!);
}

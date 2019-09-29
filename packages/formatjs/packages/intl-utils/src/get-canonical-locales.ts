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
  return Intl.NumberFormat.supportedLocalesOf(locales || '');
}

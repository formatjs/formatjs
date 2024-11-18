/**
 * http://ecma-international.org/ecma-402/7.0/index.html#sec-canonicalizelocalelist
 * @param locales
 */
export function CanonicalizeLocaleList(
  locales?: string | readonly string[]
): string[] {
  return Intl.getCanonicalLocales(locales)
}

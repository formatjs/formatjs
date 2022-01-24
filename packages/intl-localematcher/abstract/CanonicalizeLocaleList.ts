/**
 * http://ecma-international.org/ecma-402/7.0/index.html#sec-canonicalizelocalelist
 * @param locales
 */
export function CanonicalizeLocaleList(locales?: string | string[]): string[] {
  // TODO
  return ((Intl as any).getCanonicalLocales as any)(locales)
}

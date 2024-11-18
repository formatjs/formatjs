export function CanonicalizeUnicodeLocaleId(locale: string): string {
  return Intl.getCanonicalLocales(locale)[0]
}

function supportedLocalesOf(locale?: string | string[]) {
  if (!locale) {
    return true
  }
  const locales = Array.isArray(locale) ? locale : [locale]
  return (
    (Intl as any).ListFormat.supportedLocalesOf(locales).length ===
    locales.length
  )
}

export function shouldPolyfill(locale?: string | string[]) {
  return !('ListFormat' in Intl) || !supportedLocalesOf(locale)
}

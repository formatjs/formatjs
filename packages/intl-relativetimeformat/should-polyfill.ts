function supportedLocalesOf(locale?: string | string[]) {
  if (!locale) {
    return true
  }
  const locales = Array.isArray(locale) ? locale : [locale]
  return (
    Intl.RelativeTimeFormat.supportedLocalesOf(locales).length ===
    locales.length
  )
}

export function shouldPolyfill(locale?: string | string[]) {
  return !('RelativeTimeFormat' in Intl) || !supportedLocalesOf(locale)
}

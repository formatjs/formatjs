function supportedLocalesOf(locale?: string | string[]) {
  if (!locale) {
    return true
  }
  const locales = Array.isArray(locale) ? locale : [locale]
  return Intl.PluralRules.supportedLocalesOf(locales).length === locales.length
}

export function shouldPolyfill(locale?: string | string[]) {
  return (
    !('PluralRules' in Intl) ||
    new Intl.PluralRules('en', {minimumFractionDigits: 2} as any).select(1) ===
      'one' ||
    !supportedLocalesOf(locale)
  )
}

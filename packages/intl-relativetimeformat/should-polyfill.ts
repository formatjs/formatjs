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

function hasResolvedOptionsNumberingSystem(locale?: string | string[]) {
  try {
    return (
      'numberingSystem' in
      new Intl.RelativeTimeFormat(locale || 'en', {
        numeric: 'auto',
      }).resolvedOptions()
    )
  } catch (_) {
    return false
  }
}

export function shouldPolyfill(locale?: string | string[]) {
  return (
    !('RelativeTimeFormat' in Intl) ||
    !supportedLocalesOf(locale) ||
    !hasResolvedOptionsNumberingSystem(locale)
  )
}

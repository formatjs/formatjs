import {match} from '@formatjs/intl-localematcher'
import {supportedLocales} from '@formatjs_generated/cldr.supported-locales/intl-relativetimeformat.js'

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
  } catch {
    return false
  }
}

export function shouldPolyfill(locale = 'en'): string | undefined {
  if (
    typeof Intl === 'undefined' ||
    typeof Intl.RelativeTimeFormat !== 'function' ||
    // ECMA-402 §18.2.2 provides the locale support query.
    // https://tc39.es/ecma402/#sec-Intl.RelativeTimeFormat.supportedLocalesOf
    typeof Intl.RelativeTimeFormat.supportedLocalesOf !== 'function' ||
    !supportedLocalesOf(locale) ||
    !hasResolvedOptionsNumberingSystem(locale)
  ) {
    return match([locale], supportedLocales, 'en')
  }
}

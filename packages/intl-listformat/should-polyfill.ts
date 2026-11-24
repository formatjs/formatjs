import {match} from '@formatjs/intl-localematcher'
import {supportedLocales} from '@formatjs_generated/cldr.supported-locales/intl-listformat.js'

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

export function shouldPolyfill(locale = 'en'): string | undefined {
  if (
    typeof Intl === 'undefined' ||
    typeof (Intl as any).ListFormat !== 'function' ||
    // ECMA-402 §14.2.2 provides the locale support query.
    // https://tc39.es/ecma402/#sec-Intl.ListFormat.supportedLocalesOf
    typeof (Intl as any).ListFormat.supportedLocalesOf !== 'function' ||
    !supportedLocalesOf(locale)
  ) {
    return locale ? match([locale], supportedLocales, 'en') : undefined
  }
}

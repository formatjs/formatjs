import {match} from '@formatjs/intl-localematcher'
import {supportedLocales} from '#formatjs_generated/packages/generated/cldr-supported-locales/intl-listformat.js'

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
  if (!('ListFormat' in Intl) || !supportedLocalesOf(locale)) {
    return locale ? match([locale], supportedLocales, 'en') : undefined
  }
}

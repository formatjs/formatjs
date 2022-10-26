import {match} from '@formatjs/intl-localematcher'
import {supportedLocales} from './supported-locales.generated'

function supportedLocalesOf(locale?: string | string[]) {
  if (!locale) {
    return true
  }
  const locales = Array.isArray(locale) ? locale : [locale]
  return (
    (Intl as any).DurationFormat.supportedLocalesOf(locales).length ===
    locales.length
  )
}

export function shouldPolyfill(locale = 'en') {
  if (!('DurationFormat' in Intl) || !supportedLocalesOf(locale)) {
    return locale ? match([locale], supportedLocales, 'en') : undefined
  }
}

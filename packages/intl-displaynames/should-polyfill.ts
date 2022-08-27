import {match} from '@formatjs/intl-localematcher'
import {supportedLocales} from './supported-locales.generated'

/**
 * https://bugs.chromium.org/p/chromium/issues/detail?id=1097432
 */
function hasMissingICUBug() {
  const DisplayNames = (Intl as any).DisplayNames
  if (DisplayNames && !DisplayNames.polyfilled) {
    return (
      new DisplayNames(['en'], {
        type: 'region',
      }).of('CA') === 'CA'
    )
  }
  return false
}

/**
 * https://bugs.chromium.org/p/chromium/issues/detail?id=1176979
 */
function hasScriptBug() {
  const DisplayNames = (Intl as any).DisplayNames
  if (DisplayNames && !DisplayNames.polyfilled) {
    return (
      new DisplayNames(['en'], {
        type: 'script',
      }).of('arab') !== 'Arabic'
    )
  }
  return false
}

function supportedLocalesOf(locale?: string | string[]) {
  if (!locale) {
    return true
  }
  const locales = Array.isArray(locale) ? locale : [locale]
  return (
    (Intl as any).DisplayNames.supportedLocalesOf(locales).length ===
    locales.length
  )
}

export function _shouldPolyfillWithoutLocale() {
  return !(Intl as any).DisplayNames || hasMissingICUBug() || hasScriptBug()
}

export function shouldPolyfill(locale = 'en') {
  try {
    if (_shouldPolyfillWithoutLocale() || !supportedLocalesOf(locale)) {
      return match([locale], supportedLocales, 'en')
    }
  } catch (e) {
    return true
  }
}

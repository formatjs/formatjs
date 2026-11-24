import {match} from '@formatjs/intl-localematcher'
import {supportedLocales} from '@formatjs_generated/cldr.supported-locales/intl-displaynames.js'

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
 * https://github.com/formatjs/formatjs/issues/5889
 *
 * Tests if the implementation properly canonicalizes script codes per ECMA-402 spec.
 * The spec requires CanonicalCodeForDisplayNames to convert lowercase 'arab' to title-case 'Arab'
 * before lookup. This test uses lowercase input to verify canonicalization happens.
 *
 * - Correct implementations: canonicalize 'arab' → 'Arab', look up → return 'Arabic'
 * - Buggy implementations (old Node.js): don't canonicalize, look up 'arab' literally → return 'arab'
 *
 * See ECMA-402 section 12.5.1: CanonicalCodeForDisplayNames
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

// ECMA-402 §12.2.2 provides the host locale support query.
// https://tc39.es/ecma402/#sec-Intl.DisplayNames.supportedLocalesOf
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

export function _shouldPolyfillWithoutLocale(): boolean {
  return (
    typeof Intl === 'undefined' ||
    typeof (Intl as any).DisplayNames !== 'function' ||
    hasMissingICUBug() ||
    hasScriptBug()
  )
}

export function shouldPolyfill(locale = 'en'): string | true | undefined {
  try {
    if (!_shouldPolyfillWithoutLocale() && supportedLocalesOf(locale))
      return undefined
  } catch {
    // A partial host can throw on a valid capability probe.
  }
  try {
    return match([locale], supportedLocales, 'en')
  } catch {
    return true
  }
}

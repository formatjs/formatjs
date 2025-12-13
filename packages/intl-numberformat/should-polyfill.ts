import {match} from '@formatjs/intl-localematcher'
import {supportedLocales} from './supported-locales.generated'
/**
 * Check if this is old Node that only supports en
 * @returns
 */
function onlySupportsEn() {
  return (
    !(Intl.NumberFormat as any).polyfilled &&
    !Intl.NumberFormat.supportedLocalesOf(['es']).length
  )
}

/**
 * Check if Intl.NumberFormat is ES2020 compatible.
 * Caveat: we are not checking `toLocaleString`.
 *
 * @public
 * @param unit unit to check
 */
function supportsES2020() {
  try {
    const s = new Intl.NumberFormat('en', {
      style: 'unit',
      unit: 'bit',
      unitDisplay: 'long',
      notation: 'scientific',
    }).format(10000)

    // Check for a plurality bug in environment that uses the older versions of ICU:
    // https://unicode-org.atlassian.net/browse/ICU-13836
    if (s !== '1E4 bits') {
      return false
    }
  } catch {
    return false
  }
  return true
}

/**
 * Check if Intl.NumberFormat is ES2020 compatible.
 * Caveat: we are not checking `toLocaleString`.
 *
 * @public
 * @param unit unit to check
 */
function supportsES2023() {
  try {
    const s = new Intl.NumberFormat('en', {
      notation: 'compact',
      minimumSignificantDigits: 3,
      maximumSignificantDigits: 3,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
      // @ts-ignore TS types are old
      roundingPriority: 'morePrecision',
    }).format(1e8)
    return s === '100.00M'
  } catch {
    return false
  }
}

function supportedLocalesOf(locale?: string | string[]) {
  if (!locale) {
    return true
  }
  const locales = Array.isArray(locale) ? locale : [locale]
  return Intl.NumberFormat.supportedLocalesOf(locales).length === locales.length
}

export function shouldPolyfill(locale = 'en'): string | undefined {
  if (
    typeof Intl === 'undefined' ||
    !('NumberFormat' in Intl) ||
    !supportsES2020() ||
    !supportsES2023() ||
    onlySupportsEn() ||
    !supportedLocalesOf(locale)
  ) {
    return locale ? match([locale], supportedLocales, 'en') : undefined
  }
}

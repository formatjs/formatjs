import {match} from '@formatjs/intl-localematcher'
import {supportedLocales} from '@formatjs_generated/cldr.supported-locales/intl-numberformat.js'
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

function supportsSourcePrecision() {
  try {
    const keep = new Intl.NumberFormat('en')
    const strip = new Intl.NumberFormat('en', {
      trailingZeroDisplay: 'stripToMinimum',
    } as any)
    return (
      keep.format('1.00' as any) === '1.00' &&
      keep.format(1) === '1' &&
      strip.format('1.00' as any) === '1'
    )
  } catch {
    return false
  }
}

function supportsRangeAndParts() {
  const prototype = Intl.NumberFormat.prototype as
    | (Intl.NumberFormat & {
        formatRange?: unknown
        formatRangeToParts?: unknown
      })
    | undefined
  // ECMA-402 §§16.3.4–16.3.6 require all three methods.
  // https://tc39.es/ecma402/#sec-intl.numberformat.prototype.formatrange
  // https://tc39.es/ecma402/#sec-intl.numberformat.prototype.formatrangetoparts
  // https://tc39.es/ecma402/#sec-intl.numberformat.prototype.formattoparts
  return (
    typeof prototype?.formatRange === 'function' &&
    typeof prototype?.formatRangeToParts === 'function' &&
    typeof prototype?.formatToParts === 'function'
  )
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
    typeof Intl.NumberFormat !== 'function' ||
    // ECMA-402 §16.2.2 provides the locale support query.
    // https://tc39.es/ecma402/#sec-intl.numberformat.supportedlocalesof
    typeof Intl.NumberFormat.supportedLocalesOf !== 'function' ||
    !supportsES2020() ||
    !supportsES2023() ||
    !supportsRangeAndParts() ||
    !supportsSourcePrecision() ||
    onlySupportsEn() ||
    !supportedLocalesOf(locale)
  ) {
    return locale ? match([locale], supportedLocales, 'en') : undefined
  }
}

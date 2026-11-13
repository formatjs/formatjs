import {match} from '@formatjs/intl-localematcher'
import {supportedLocales} from '@formatjs_generated/cldr.supported-locales/intl-pluralrules.js'

function supportedLocalesOf(locale?: string | string[]) {
  if (!locale) {
    return true
  }
  const locales = Array.isArray(locale) ? locale : [locale]
  return Intl.PluralRules.supportedLocalesOf(locales).length === locales.length
}

function supportsSourcePrecision() {
  try {
    const keep = new Intl.PluralRules('en')
    const strip = new Intl.PluralRules('en', {
      trailingZeroDisplay: 'stripToMinimum',
    } as any)
    return (
      keep.select('1.0' as any) === 'other' &&
      keep.select(1) === 'one' &&
      strip.select('1.0' as any) === 'one'
    )
  } catch {
    return false
  }
}

export function shouldPolyfill(locale = 'en'): string | undefined {
  if (
    typeof Intl === 'undefined' ||
    !('PluralRules' in Intl) ||
    !supportsSourcePrecision() ||
    new Intl.PluralRules('en', {minimumFractionDigits: 2} as any).select(1) ===
      'one' ||
    !supportedLocalesOf(locale)
  ) {
    return locale ? match([locale], supportedLocales, 'en') : undefined
  }
}

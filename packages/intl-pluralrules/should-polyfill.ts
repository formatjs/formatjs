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
  const keep = new Intl.PluralRules('en')
  const strip = new Intl.PluralRules('en', {
    trailingZeroDisplay: 'stripToMinimum',
  } as any)
  return (
    keep.select('1.0' as any) === 'other' &&
    keep.select(1) === 'one' &&
    strip.select('1.0' as any) === 'one'
  )
}

export function shouldPolyfill(locale = 'en'): string | undefined {
  try {
    if (
      typeof Intl !== 'undefined' &&
      typeof Intl.PluralRules === 'function' &&
      // ECMA-402 §17.2.2 provides the locale support query.
      // https://tc39.es/ecma402/#sec-intl.pluralrules.supportedlocalesof
      typeof Intl.PluralRules.supportedLocalesOf === 'function' &&
      supportsSourcePrecision() &&
      new Intl.PluralRules('en', {minimumFractionDigits: 2} as any).select(
        1
      ) !== 'one' &&
      supportedLocalesOf(locale)
    )
      return undefined
  } catch {
    // A partial host can throw on a valid capability probe.
  }
  return locale ? match([locale], supportedLocales, 'en') : undefined
}

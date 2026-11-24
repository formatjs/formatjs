import {supportedEntries} from '#packages/intl-supportedvaluesof/supported-entries.js'
import {
  arraySome,
  setDataProperty,
} from '#packages/ecma262-abstract/intrinsics.js'
import {HasOwnProperty} from '#packages/ecma262-abstract/HasOwnProperty.js'
import {
  getCurrencyDisplayNamesProbe,
  getNumberFormatProbe,
} from '#packages/intl-supportedvaluesof/memoize.js'
import type {Currency} from '@formatjs_generated/cldr.supported-values/currencies.js'
import {
  currencies,
  currencyCandidateLocales,
} from '@formatjs_generated/cldr.supported-values/currencies.js'
const apply = Reflect.apply
const createObject = Object.create
const stringIndexOf = String.prototype.indexOf
const stringSlice = String.prototype.slice
const english = ['en']

// ECMA-402 §8.3.2 step 4 returns available canonical currency codes.
// https://tc39.es/ecma402/#sec-availablecanonicalcurrencies
export function getSupportedCurrencies(): Currency[] {
  const probe = getNumberFormatProbe()
  if (!probe || (!probe.formatToParts && !probe.format)) return []
  const {create, format, formatToParts} = probe
  const namesProbe = getCurrencyDisplayNamesProbe()
  if (namesProbe && !namesProbe.hasName) return []
  const namesByLocale = createObject(null) as Record<
    string,
    Intl.DisplayNames | null | undefined
  >
  const ATOZ = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'
  const candidates: Currency[] = []

  for (let index = 0; index < currencies.length; index++) {
    const currency = currencies[index]
    if (currency.length === 3) {
      setDataProperty(candidates, `${candidates.length}`, currency)
    } else if (currency.length === 5 && currency[3] === '~') {
      const start = apply(stringIndexOf, ATOZ, [currency[2]])
      const end = apply(stringIndexOf, ATOZ, [currency[4]])
      const prefix = currency[0] + currency[1]
      for (let i = start; i <= end; i++) {
        setDataProperty(candidates, `${candidates.length}`, prefix + ATOZ[i])
      }
    }
  }

  return supportedEntries(candidates, currency => {
    const locales = HasOwnProperty(currencyCandidateLocales, currency)
      ? currencyCandidateLocales[currency]
      : english
    return arraySome(locales, locale => {
      try {
        // ECMA-402 §6.4 requires support in both services. On hosts without
        // DisplayNames, the NumberFormat probe supplies the available evidence.
        if (namesProbe) {
          let names = namesByLocale[locale]
          if (names === undefined) {
            namesByLocale[locale] = null
            names = namesByLocale[locale] = namesProbe.create(locale)
          }
          if (!names || !namesProbe.hasName?.(names, currency)) return false
        }
        // The probe stands in for private locale data in §8.3.2 step 4.
        const options = {
          __proto__: null,
          style: 'currency',
          currencyDisplay: 'name',
          currency,
        } as const
        const formatter = create(locale, options)
        // Currency parts distinguish a localized name from an ISO code fallback
        // even when the locale's number pattern adds literals around it.
        if (formatToParts) {
          const parts = formatToParts(formatter, 123)
          for (let i = 0; i < parts.length; i++) {
            const part = parts[i]
            if (part.type === 'currency' && part.value !== currency) return true
          }
          return false
        }
        const text = format!(formatter, 123)
        // Older hosts expose only the complete formatted string.
        return (
          apply(stringSlice, text, [0, 3]) !== currency &&
          apply(stringSlice, text, [-3]) !== currency
        )
      } catch {
        return false
      }
    })
  })
}

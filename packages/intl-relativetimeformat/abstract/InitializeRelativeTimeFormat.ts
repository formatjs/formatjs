import {
  RelativeTimeFormatInternal,
  LocaleFieldsData,
  CanonicalizeLocaleList,
  CoerceOptionsToObject,
  GetOption,
  invariant,
} from '@formatjs/ecma402-abstract'
import {ResolveLocale} from '@formatjs/intl-localematcher'

const NUMBERING_SYSTEM_REGEX = /^[a-z0-9]{3,8}(-[a-z0-9]{3,8})*$/i

export function InitializeRelativeTimeFormat(
  rtf: Intl.RelativeTimeFormat,
  locales: string | string[] | undefined,
  options: Intl.RelativeTimeFormatOptions | undefined,
  {
    getInternalSlots,
    availableLocales,
    relevantExtensionKeys,
    localeData,
    getDefaultLocale,
  }: {
    getInternalSlots(rtf: Intl.RelativeTimeFormat): RelativeTimeFormatInternal
    availableLocales: Set<string>
    relevantExtensionKeys: string[]
    localeData: Record<string, LocaleFieldsData | undefined>
    getDefaultLocale(): string
  }
) {
  const internalSlots = getInternalSlots(rtf)
  internalSlots.initializedRelativeTimeFormat = true
  const requestedLocales = CanonicalizeLocaleList(locales)
  const opt: any = Object.create(null)
  const opts = CoerceOptionsToObject<Intl.RelativeTimeFormatOptions>(options)
  const matcher = GetOption(
    opts,
    'localeMatcher',
    'string',
    ['best fit', 'lookup'],
    'best fit'
  )
  opt.localeMatcher = matcher
  const numberingSystem = GetOption(
    opts,
    // @ts-expect-error TS option is wack
    'numberingSystem',
    'string',
    undefined,
    undefined
  )
  if (numberingSystem !== undefined) {
    if (!NUMBERING_SYSTEM_REGEX.test(numberingSystem)) {
      throw new RangeError(`Invalid numbering system ${numberingSystem}`)
    }
  }
  opt.nu = numberingSystem
  const r = ResolveLocale(
    availableLocales,
    requestedLocales,
    opt,
    relevantExtensionKeys,
    localeData,
    getDefaultLocale
  )
  const {locale, nu} = r
  internalSlots.locale = locale
  internalSlots.style = GetOption(
    opts,
    'style',
    'string',
    ['long', 'narrow', 'short'],
    'long'
  )
  internalSlots.numeric = GetOption(
    opts,
    'numeric',
    'string',
    ['always', 'auto'],
    'always'
  )
  const fields = localeData[r.dataLocale]
  invariant(!!fields, `Missing locale data for ${r.dataLocale}`)
  internalSlots.fields = fields
  internalSlots.numberFormat = new Intl.NumberFormat(locales)
  internalSlots.pluralRules = new Intl.PluralRules(locales)
  internalSlots.numberingSystem = nu
  return rtf
}

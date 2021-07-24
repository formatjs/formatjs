import {
  PluralRulesInternal,
  PluralRulesData,
  CanonicalizeLocaleList,
  CoerceOptionsToObject,
  GetOption,
  SetNumberFormatDigitOptions,
} from '@formatjs/ecma402-abstract'
import {ResolveLocale} from '@formatjs/intl-localematcher'

export function InitializePluralRules(
  pl: Intl.PluralRules,
  locales: string | string[] | undefined,
  options: Intl.PluralRulesOptions | undefined,
  {
    availableLocales,
    relevantExtensionKeys,
    localeData,
    getDefaultLocale,
    getInternalSlots,
  }: {
    availableLocales: Set<string>
    relevantExtensionKeys: string[]
    localeData: Record<string, PluralRulesData | undefined>
    getDefaultLocale(): string
    getInternalSlots(pl: Intl.PluralRules): PluralRulesInternal
  }
) {
  const requestedLocales = CanonicalizeLocaleList(locales)
  const opt: any = Object.create(null)
  const opts = CoerceOptionsToObject<Intl.PluralRulesOptions>(options)
  const internalSlots = getInternalSlots(pl)
  internalSlots.initializedPluralRules = true
  const matcher = GetOption(
    opts,
    'localeMatcher',
    'string',
    ['best fit', 'lookup'],
    'best fit'
  )
  opt.localeMatcher = matcher
  internalSlots.type = GetOption(
    opts,
    'type',
    'string',
    ['cardinal', 'ordinal'],
    'cardinal'
  )

  SetNumberFormatDigitOptions(internalSlots, opts, 0, 3, 'standard')
  const r = ResolveLocale(
    availableLocales,
    requestedLocales,
    opt,
    relevantExtensionKeys,
    localeData,
    getDefaultLocale
  )
  internalSlots.locale = r.locale
  return pl
}

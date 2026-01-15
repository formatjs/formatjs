import {
  CanonicalizeLocaleList,
  CoerceOptionsToObject,
  GetOption,
  type PluralRulesData,
  type PluralRulesInternal,
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
): Intl.PluralRules {
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
  const r = ResolveLocale(
    availableLocales,
    requestedLocales,
    opt,
    relevantExtensionKeys,
    localeData,
    getDefaultLocale
  )
  internalSlots.locale = r.locale
  // ECMA-402 Spec: type option ('cardinal' or 'ordinal')
  internalSlots.type = GetOption(
    opts,
    'type',
    'string',
    ['cardinal', 'ordinal'],
    'cardinal'
  )

  // Extension: notation options for compact notation support
  // Not in ECMA-402 spec, but mirrors Intl.NumberFormat notation option
  // Enables proper plural selection for compact numbers (e.g., "1.2M")
  const notation = GetOption(
    opts,
    'notation',
    'string',
    ['standard', 'compact'],
    'standard'
  )
  internalSlots.notation = notation

  if (notation === 'compact') {
    // Extension: compactDisplay option (mirrors Intl.NumberFormat)
    internalSlots.compactDisplay = GetOption(
      opts,
      'compactDisplay',
      'string',
      ['short', 'long'],
      'short'
    )
    // Implementation: Load NumberFormat locale data if available (soft dependency)
    // This is needed to calculate compact exponents using ComputeExponentForMagnitude
    if (
      typeof Intl !== 'undefined' &&
      Intl.NumberFormat &&
      (Intl.NumberFormat as any).localeData
    ) {
      internalSlots.dataLocaleData = (Intl.NumberFormat as any).localeData[
        r.locale
      ]
    }
  }

  SetNumberFormatDigitOptions(internalSlots, opts, 0, 3, 'standard')

  return pl
}

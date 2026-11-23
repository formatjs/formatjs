import {CanonicalizeLocaleList} from '#packages/ecma402-abstract/CanonicalizeLocaleList.js'
import {HasOwnProperty} from '#packages/ecma262-abstract/HasOwnProperty.js'
import {CoerceOptionsToObject} from '#packages/ecma402-abstract/CoerceOptionsToObject.js'
import {GetOption} from '#packages/ecma402-abstract/GetOption.js'
import {SetNumberFormatDigitOptions} from '#packages/ecma402-abstract/NumberFormat/SetNumberFormatDigitOptions.js'
import {
  type PluralRulesData,
  type PluralRulesInternal,
  type PluralRulesOptions,
} from '#packages/ecma402-abstract/types/plural-rules.js'
import {ResolveLocale} from '@formatjs/intl-localematcher'

export function InitializePluralRules(
  pl: Intl.PluralRules,
  locales: string | string[] | undefined,
  options: PluralRulesOptions | undefined,
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
  const opt: any = {__proto__: null}
  const opts = CoerceOptionsToObject<PluralRulesOptions>(options)
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
    getDefaultLocale,
    'hostDefaultWithLocaleData'
  )
  internalSlots.locale = r.locale
  // ECMA-402 §17.1.1 steps 5–6 select the locale before later option reads.
  // https://tc39.es/ecma402/#sec-intl.pluralrules
  internalSlots.localeData = r.localeData
  // ECMA-402 §17.1.1 steps 7–8 read and store the rule type.
  // https://tc39.es/ecma402/#sec-intl.pluralrules
  internalSlots.type = GetOption(
    opts,
    'type',
    'string',
    ['cardinal', 'ordinal'],
    'cardinal'
  )

  // Read and validate notation and compactDisplay before digit options.
  // ECMA-402 §17.1.1 Intl.PluralRules, steps 9–13.
  // https://tc39.es/ecma402/#sec-intl.pluralrules
  const notation = GetOption(
    opts,
    'notation',
    'string',
    ['standard', 'scientific', 'engineering', 'compact'],
    'standard'
  )
  internalSlots.notation = notation

  const compactDisplay = GetOption(
    opts,
    'compactDisplay',
    'string',
    ['short', 'long'],
    'short'
  )
  if (notation === 'compact') {
    internalSlots.compactDisplay = compactDisplay
    // ECMA-402 §17.5.1 leaves the locale-specific compact rules to the implementation.
    // https://tc39.es/ecma402/#sec-pluralruleselect
    const data = r.localeData
    if (data && HasOwnProperty(data, 'compactExponents'))
      internalSlots.compactExponents = data.compactExponents
  }

  SetNumberFormatDigitOptions(internalSlots, opts, 0, 3, notation)

  return pl
}

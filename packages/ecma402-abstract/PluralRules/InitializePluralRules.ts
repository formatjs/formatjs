import {CanonicalizeLocaleList} from '#packages/ecma402-abstract/CanonicalizeLocaleList.js'
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
  const opt: any = Object.create(null)
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

  // Read and validate notation and compactDisplay before digit options.
  // ECMA-402 §17.1.1 Intl.PluralRules, steps 9–13.
  // https://tc39.es/ecma402/#sec-intl.pluralrules
  // https://github.com/tc39/ecma402/blob/b1c961988b9a07894b1dc3dc2b5626ea48387d61/spec/pluralrules.html#L29-L34
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
    internalSlots.compactExponents = localeData[r.dataLocale]?.compactExponents
  }

  SetNumberFormatDigitOptions(internalSlots, opts, 0, 3, notation)

  return pl
}

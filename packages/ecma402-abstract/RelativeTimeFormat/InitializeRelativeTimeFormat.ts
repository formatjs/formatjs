import {RangeErrorConstructor} from '#packages/ecma262-abstract/intrinsics.js'
import {IsUnicodeLocaleIdentifierType} from '#packages/ecma402-abstract/IsUnicodeLocaleIdentifierType.js'
import {CanonicalizeLocaleList} from '#packages/ecma402-abstract/CanonicalizeLocaleList.js'
import {CoerceOptionsToObject} from '#packages/ecma402-abstract/CoerceOptionsToObject.js'
import {GetOption} from '#packages/ecma402-abstract/GetOption.js'
import {
  type LocaleFieldsData,
  type RelativeTimeFormatInternal,
} from '#packages/ecma402-abstract/types/relative-time.js'
import {
  createMemoizedNumberFormatForConstructor,
  createMemoizedPluralRulesForConstructor,
  findFormatterPartsMethod,
  findPluralRulesSelectMethod,
  getNumberFormatProvider,
  getPluralRulesProvider,
  invariant,
} from '#packages/ecma402-abstract/utils.js'
import {ResolveLocale} from '@formatjs/intl-localematcher'

const apply = Reflect.apply

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
): Intl.RelativeTimeFormat {
  const internalSlots = getInternalSlots(rtf)
  internalSlots.initializedRelativeTimeFormat = true
  // ECMA-402 §18.1.1 steps 3–9: resolve locales before reading style or numeric.
  // https://tc39.es/ecma402/#sec-Intl.RelativeTimeFormat
  const requestedLocales = CanonicalizeLocaleList(locales)
  const opt: any = {__proto__: null}
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
    if (!IsUnicodeLocaleIdentifierType(numberingSystem)) {
      throw new RangeErrorConstructor(
        `Invalid numbering system ${numberingSystem}`
      )
    }
  }
  opt.nu = numberingSystem
  const r = ResolveLocale(
    availableLocales,
    requestedLocales,
    opt,
    relevantExtensionKeys,
    localeData,
    getDefaultLocale,
    'hostDefaultWithLocaleData'
  )
  const {locale, nu} = r
  internalSlots.locale = locale
  // Step 8: capture fields before style or numeric getters can reload them.
  const fields = r.localeData
  invariant(!!fields, `Missing locale data for ${r.dataLocale}`)
  internalSlots.fields = fields
  internalSlots.numberingSystem = nu
  // Steps 10–13: read style before numeric, applying defaults.
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
  // ECMA-402 §18.1.1, steps 14–17: isolate NumberFormat options and use
  // the resolved locale for both internal formatters.
  // https://tc39.es/ecma402/#sec-Intl.RelativeTimeFormat
  const nfOptions = {__proto__: null, numberingSystem: nu}
  const NumberFormat = getNumberFormatProvider()
  const numberFormat = createMemoizedNumberFormatForConstructor(NumberFormat)(
    locale,
    nfOptions
  )
  const PluralRules = getPluralRulesProvider()
  const pluralRules =
    createMemoizedPluralRulesForConstructor(PluralRules)(locale)
  // §18.5.2 steps 11–12 invoke internal operations. Retain the provider
  // methods so replacing public Intl properties cannot affect formatting.
  // https://tc39.es/ecma402/#sec-PartitionRelativeTimePattern
  const formatToParts = findFormatterPartsMethod(NumberFormat) as
    | Intl.NumberFormat['formatToParts']
    | undefined
  if (formatToParts) {
    internalSlots.formatNumber = value =>
      apply(formatToParts, numberFormat, [value])
  } else {
    // Older providers expose only the bound format getter.
    const format = numberFormat.format
    internalSlots.formatNumber = value => [
      {type: 'literal', value: format(value)},
    ]
  }
  const select = findPluralRulesSelectMethod(PluralRules)
  invariant(select, 'Missing supplied PluralRules select method')
  internalSlots.selectPlural = value => apply(select, pluralRules, [value])
  return rtf
}

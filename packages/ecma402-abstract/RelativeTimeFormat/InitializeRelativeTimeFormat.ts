import {IsUnicodeLocaleIdentifierType} from '#packages/ecma402-abstract/IsUnicodeLocaleIdentifierType.js'
import {CanonicalizeLocaleList} from '#packages/ecma402-abstract/CanonicalizeLocaleList.js'
import {CoerceOptionsToObject} from '#packages/ecma402-abstract/CoerceOptionsToObject.js'
import {GetOption} from '#packages/ecma402-abstract/GetOption.js'
import {
  type LocaleFieldsData,
  type RelativeTimeFormatInternal,
} from '#packages/ecma402-abstract/types/relative-time.js'
import {
  createMemoizedNumberFormat,
  createMemoizedPluralRules,
  invariant,
} from '#packages/ecma402-abstract/utils.js'
import {ResolveLocale} from '@formatjs/intl-localematcher'

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
    if (!IsUnicodeLocaleIdentifierType(numberingSystem)) {
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
  // ECMA-402 §18.1.1, steps 14–17: isolate NumberFormat options and use
  // the resolved locale for both internal formatters.
  // https://tc39.es/ecma402/#sec-Intl.RelativeTimeFormat
  // https://github.com/tc39/ecma402/blob/b1c961988b9a07894b1dc3dc2b5626ea48387d61/spec/relativetimeformat.html#L34-L37
  const nfOptions = Object.create(null)
  nfOptions.numberingSystem = nu
  internalSlots.numberFormat = createMemoizedNumberFormat(locale, nfOptions)
  internalSlots.pluralRules = createMemoizedPluralRules(locale)
  internalSlots.numberingSystem = nu
  return rtf
}

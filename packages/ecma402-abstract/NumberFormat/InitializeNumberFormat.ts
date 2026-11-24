import {RangeErrorConstructor} from '#packages/ecma262-abstract/intrinsics.js'
import {IsUnicodeLocaleIdentifierType} from '#packages/ecma402-abstract/IsUnicodeLocaleIdentifierType.js'
import {ResolveLocale} from '@formatjs/intl-localematcher'
import {CanonicalizeLocaleList} from '#packages/ecma402-abstract/CanonicalizeLocaleList.js'
import {CoerceOptionsToObject} from '#packages/ecma402-abstract/CoerceOptionsToObject.js'
import {GetOption} from '#packages/ecma402-abstract/GetOption.js'
import {GetStringOrBooleanOption} from '#packages/ecma402-abstract/GetStringOrBooleanOption.js'
import {
  type NumberFormatInternal,
  type NumberFormatLocaleInternalData,
  type NumberFormatOptions,
  type UseGroupingType,
} from '#packages/ecma402-abstract/types/number.js'
import {invariant} from '#packages/ecma402-abstract/utils.js'
import {CurrencyDigits} from '#packages/ecma402-abstract/NumberFormat/CurrencyDigits.js'
import {SetNumberFormatDigitOptions} from '#packages/ecma402-abstract/NumberFormat/SetNumberFormatDigitOptions.js'
import {SetNumberFormatUnitOptions} from '#packages/ecma402-abstract/NumberFormat/SetNumberFormatUnitOptions.js'

const createOptions = Object.create

// ECMA-402 §16.1.1, step 3 resolves locale options before unit and digit options.
// https://tc39.es/ecma402/#sec-intl.numberformat
export function InitializeNumberFormat(
  nf: Intl.NumberFormat,
  locales: string | ReadonlyArray<string> | undefined,
  opts: NumberFormatOptions | undefined,
  {
    getInternalSlots,
    localeData,
    availableLocales,
    getDefaultLocale,
    currencyDigitsData,
  }: {
    getInternalSlots(nf: Intl.NumberFormat): NumberFormatInternal
    localeData: Record<string, NumberFormatLocaleInternalData | undefined>
    availableLocales: Set<string>
    getDefaultLocale(): string
    currencyDigitsData: Record<string, number>
  }
): Intl.NumberFormat {
  const requestedLocales: string[] = CanonicalizeLocaleList(locales)
  const options = CoerceOptionsToObject<NumberFormatOptions>(opts)
  const opt = createOptions(null)
  const matcher = GetOption(
    options,
    'localeMatcher',
    'string',
    ['lookup', 'best fit'],
    'best fit'
  )
  opt.localeMatcher = matcher

  const numberingSystem = GetOption(
    options,
    'numberingSystem',
    'string',
    undefined,
    undefined
  )
  if (
    numberingSystem !== undefined &&
    !IsUnicodeLocaleIdentifierType(numberingSystem)
  ) {
    // ResolveOptions step 6.d.ii rejects malformed Unicode types.
    // ECMA-402 §9.2.8 ResolveOptions, step 6.d.ii.
    // https://tc39.es/ecma402/#sec-resolveoptions
    throw RangeErrorConstructor(`Invalid numberingSystems: ${numberingSystem}`)
  }
  // ECMA-402 §16.2.3 maps the nu extension to the numberingSystem option.
  // https://tc39.es/ecma402/#sec-intl.numberformat-internal-slots
  opt.nu = numberingSystem

  const r = ResolveLocale(
    availableLocales,
    requestedLocales,
    opt,
    // [[RelevantExtensionKeys]] slot, which is a constant
    ['nu'],
    localeData,
    getDefaultLocale,
    'hostDefaultWithLocaleData'
  )
  // ECMA-402 §16.1.1 step 7 retains the selected locale data on the formatter.
  // https://tc39.es/ecma402/#sec-intl.numberformat
  const dataLocaleData = r.localeData
  invariant(!!dataLocaleData, `Missing locale data for ${r.dataLocale}`)
  const internalSlots = getInternalSlots(nf)
  internalSlots.locale = r.locale
  internalSlots.dataLocale = r.dataLocale
  internalSlots.numberingSystem = r.nu
  internalSlots.dataLocaleData = dataLocaleData

  SetNumberFormatUnitOptions(internalSlots, options)
  const style = internalSlots.style

  const notation = GetOption(
    options,
    'notation',
    'string',
    ['standard', 'scientific', 'engineering', 'compact'],
    'standard'
  )
  internalSlots.notation = notation

  let mnfdDefault: number
  let mxfdDefault: number
  if (style === 'currency' && notation === 'standard') {
    const currency = internalSlots.currency
    const cDigits = CurrencyDigits(currency!, {currencyDigitsData})
    mnfdDefault = cDigits
    mxfdDefault = cDigits
  } else {
    mnfdDefault = 0
    mxfdDefault = style === 'percent' ? 0 : 3
  }

  SetNumberFormatDigitOptions(
    internalSlots,
    options,
    mnfdDefault,
    mxfdDefault,
    notation
  )

  const compactDisplay = GetOption(
    options,
    'compactDisplay',
    'string',
    ['short', 'long'],
    'short'
  )

  let defaultUseGrouping: UseGroupingType = 'auto'

  if (notation === 'compact') {
    internalSlots.compactDisplay = compactDisplay
    defaultUseGrouping = 'min2'
  }

  let useGrouping = GetStringOrBooleanOption(
    options,
    'useGrouping',
    ['min2', 'auto', 'always'],
    'always',
    false,
    defaultUseGrouping
  )
  internalSlots.useGrouping = useGrouping

  let signDisplay = GetOption(
    options,
    'signDisplay',
    'string',
    ['auto', 'never', 'always', 'exceptZero', 'negative'],
    'auto'
  )
  internalSlots.signDisplay = signDisplay

  return nf
}

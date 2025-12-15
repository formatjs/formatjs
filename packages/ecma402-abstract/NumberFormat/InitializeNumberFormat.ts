import {ResolveLocale} from '@formatjs/intl-localematcher'
import {CanonicalizeLocaleList} from '../CanonicalizeLocaleList.js'
import {CoerceOptionsToObject} from '../CoerceOptionsToObject.js'
import {GetOption} from '../GetOption.js'
import {GetStringOrBooleanOption} from '../GetStringOrBooleanOption.js'
import {
  NumberFormatInternal,
  NumberFormatLocaleInternalData,
  NumberFormatOptions,
  UseGroupingType,
} from '../types/number.js'
import {invariant} from '../utils.js'
import {CurrencyDigits} from './CurrencyDigits.js'
import {SetNumberFormatDigitOptions} from './SetNumberFormatDigitOptions.js'
import {SetNumberFormatUnitOptions} from './SetNumberFormatUnitOptions.js'

/**
 * https://tc39.es/ecma402/#sec-initializenumberformat
 */
export function InitializeNumberFormat(
  nf: Intl.NumberFormat,
  locales: string | ReadonlyArray<string> | undefined,
  opts: NumberFormatOptions | undefined,
  {
    getInternalSlots,
    localeData,
    availableLocales,
    numberingSystemNames,
    getDefaultLocale,
    currencyDigitsData,
  }: {
    getInternalSlots(nf: Intl.NumberFormat): NumberFormatInternal
    localeData: Record<string, NumberFormatLocaleInternalData | undefined>
    availableLocales: Set<string>
    numberingSystemNames: ReadonlyArray<string>
    getDefaultLocale(): string
    currencyDigitsData: Record<string, number>
  }
): Intl.NumberFormat {
  const requestedLocales: string[] = CanonicalizeLocaleList(locales)
  const options = CoerceOptionsToObject<NumberFormatOptions>(opts)
  const opt = Object.create(null)
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
    numberingSystemNames.indexOf(numberingSystem) < 0
  ) {
    // 8.a. If numberingSystem does not match the Unicode Locale Identifier type nonterminal,
    // throw a RangeError exception.
    throw RangeError(`Invalid numberingSystems: ${numberingSystem}`)
  }
  opt.nu = numberingSystem

  const r = ResolveLocale(
    Array.from(availableLocales),
    requestedLocales,
    opt,
    // [[RelevantExtensionKeys]] slot, which is a constant
    ['nu'],
    localeData,
    getDefaultLocale
  )
  const dataLocaleData = localeData[r.dataLocale]
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

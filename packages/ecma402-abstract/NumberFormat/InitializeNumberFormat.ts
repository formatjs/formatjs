import {
  NumberFormatInternal,
  NumberFormatOptions,
  NumberFormatLocaleInternalData,
} from '../types/number'
import {CanonicalizeLocaleList} from '../CanonicalizeLocaleList'
import {GetOption} from '../GetOption'
import {ResolveLocale} from '@formatjs/intl-localematcher'
import {SetNumberFormatUnitOptions} from './SetNumberFormatUnitOptions'
import {CurrencyDigits} from './CurrencyDigits'
import {SetNumberFormatDigitOptions} from './SetNumberFormatDigitOptions'
import {invariant} from '../utils'
import {CoerceOptionsToObject} from '../CoerceOptionsToObject'

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
) {
  // @ts-ignore
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
    availableLocales,
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

  SetNumberFormatUnitOptions(nf, options, {getInternalSlots})
  const style = internalSlots.style

  let mnfdDefault: number
  let mxfdDefault: number
  if (style === 'currency') {
    const currency = internalSlots.currency
    const cDigits = CurrencyDigits(currency!, {currencyDigitsData})
    mnfdDefault = cDigits
    mxfdDefault = cDigits
  } else {
    mnfdDefault = 0
    mxfdDefault = style === 'percent' ? 0 : 3
  }

  const notation = GetOption(
    options,
    'notation',
    'string',
    ['standard', 'scientific', 'engineering', 'compact'],
    'standard'
  )
  internalSlots.notation = notation

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
  if (notation === 'compact') {
    internalSlots.compactDisplay = compactDisplay
  }

  const useGrouping = GetOption(
    options,
    'useGrouping',
    'boolean',
    undefined,
    true
  )
  internalSlots.useGrouping = useGrouping

  const signDisplay = GetOption(
    options,
    'signDisplay',
    'string',
    ['auto', 'never', 'always', 'exceptZero'],
    'auto'
  )
  internalSlots.signDisplay = signDisplay

  return nf
}

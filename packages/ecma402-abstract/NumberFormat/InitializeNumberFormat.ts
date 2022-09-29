import {
  NumberFormatInternal,
  NumberFormatOptions,
  NumberFormatLocaleInternalData,
  UseGroupingType,
} from '../types/number'
import {CanonicalizeLocaleList} from '../CanonicalizeLocaleList'
import {GetOption} from '../GetOption'
import {ResolveLocale} from '@formatjs/intl-localematcher'
import {SetNumberFormatUnitOptions} from './SetNumberFormatUnitOptions'
import {CurrencyDigits} from './CurrencyDigits'
import {SetNumberFormatDigitOptions} from './SetNumberFormatDigitOptions'
import {invariant} from '../utils'
import {CoerceOptionsToObject} from '../CoerceOptionsToObject'
import {GetNumberOption} from '../GetNumberOption'
import {GetStringOrBooleanOption} from '../GetStringOrBooleanOption'

const VALID_ROUND_INCREMENT_VALUES = [
  1, 2, 5, 10, 20, 25, 50, 100, 200, 250, 500, 1000, 2000,
]

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

  const roundingIncrement = GetNumberOption(
    options,
    'roundingIncrement',
    1,
    5000,
    1
  )

  if (VALID_ROUND_INCREMENT_VALUES.indexOf(roundingIncrement) === -1) {
    throw new RangeError(
      `Invalid rounding increment value: ${roundingIncrement}.\nValid values are ${VALID_ROUND_INCREMENT_VALUES}.`
    )
  }

  if (
    roundingIncrement !== 1 &&
    internalSlots.roundingType !== 'fractionDigits'
  ) {
    throw new TypeError(
      `For roundingIncrement > 1 only fractionDigits is a valid roundingType`
    )
  }

  if (
    roundingIncrement !== 1 &&
    internalSlots.maximumFractionDigits !== internalSlots.minimumFractionDigits
  ) {
    throw new RangeError(
      'With roundingIncrement > 1, maximumFractionDigits and minimumFractionDigits must be equal.'
    )
  }

  internalSlots.roundingIncrement = roundingIncrement

  const trailingZeroDisplay = GetOption(
    options,
    'trailingZeroDisplay',
    'string',
    ['auto', 'stripIfInteger'],
    'auto'
  )

  internalSlots.trailingZeroDisplay = trailingZeroDisplay

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

  internalSlots.useGrouping = GetStringOrBooleanOption(
    options,
    'useGrouping',
    ['min2', 'auto', 'always'],
    'always',
    false,
    defaultUseGrouping
  )

  internalSlots.signDisplay = GetOption(
    options,
    'signDisplay',
    'string',
    ['auto', 'never', 'always', 'exceptZero', 'negative'],
    'auto'
  )

  internalSlots.roundingMode = GetOption(
    options,
    'roundingMode',
    'string',
    [
      'ceil',
      'floor',
      'expand',
      'trunc',
      'halfCeil',
      'halfFloor',
      'halfExpand',
      'halfTrunc',
      'halfEven',
    ],
    'halfExpand'
  )

  return nf
}

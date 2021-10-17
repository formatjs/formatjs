import {LDMLPluralRule} from './plural-rules'
import {LocaleData} from './core'

export type NumberFormatNotation =
  | 'standard'
  | 'scientific'
  | 'engineering'
  | 'compact'

export type NumberFormatRoundingType =
  | 'significantDigits'
  | 'fractionDigits'
  | 'compactRounding'

export interface NumberFormatDigitOptions {
  minimumIntegerDigits?: number
  minimumSignificantDigits?: number
  maximumSignificantDigits?: number
  minimumFractionDigits?: number
  maximumFractionDigits?: number
}

export interface NumberFormatDigitInternalSlots {
  minimumIntegerDigits: number
  minimumSignificantDigits?: number
  maximumSignificantDigits?: number
  roundingType: NumberFormatRoundingType
  // These two properties are only used when `roundingType` is "fractionDigits".
  minimumFractionDigits?: number
  maximumFractionDigits?: number
  notation?: NumberFormatNotation
}

// All fields are optional due to de-duping
export type RawNumberLocaleData = LocaleData<NumberFormatLocaleInternalData>

export interface NumberFormatLocaleInternalData {
  units: UnitDataTable
  currencies: Record<string, CurrencyData>
  numbers: RawNumberData
  // Bc of relevantExtensionKeys in the spec
  nu: string[]
}

export interface UnitDataTable {
  simple: Record<string, UnitData>
  compound: Record<string, CompoundUnitData>
}

export interface UnitData {
  // A pattern where {0} is number placeholder. Example: "摂氏 {0} 度".
  long: LDMLPluralRuleMap<string>
  short: LDMLPluralRuleMap<string>
  narrow: LDMLPluralRuleMap<string>
  // perUnitPattern. See http://unicode.org/reports/tr35/tr35-general.html#perUnitPatterns
  perUnit: Record<'narrow' | 'short' | 'long', string | undefined>
}

// The values are patterns on how to compose simple units.
// For example, "{0} per {1}".
export interface CompoundUnitData {
  long: string
  short: string
  narrow: string
}

export interface CurrencyData {
  displayName: LDMLPluralRuleMap<string>
  symbol: string
  narrow: string
}

export type DecimalFormatNum =
  | '1000'
  | '10000'
  | '100000'
  | '1000000'
  | '10000000'
  | '100000000'
  | '1000000000'
  | '10000000000'
  | '100000000000'
  | '1000000000000'
  | '10000000000000'
  | '100000000000000'
export type NumberingSystem = string

/**
 * We only care about insertBetween bc we assume
 * `currencyMatch` & `surroundingMatch` are all the same
 *
 * @export
 * @interface CurrencySpacingData
 */
export interface CurrencySpacingData {
  beforeInsertBetween: string
  afterInsertBetween: string
}

export interface RawCurrencyData {
  currencySpacing: CurrencySpacingData
  standard: string
  accounting: string
  short?: Record<DecimalFormatNum, LDMLPluralRuleMap<string>>
  // IMPORTANT: We're making the assumption here that currency unitPattern
  // are the same for all LDMLPluralRule
  unitPattern: string
}

export interface SymbolsData {
  decimal: string
  group: string
  list: string
  percentSign: string
  plusSign: string
  minusSign: string
  exponential: string
  superscriptingExponent: string
  perMille: string
  infinity: string
  nan: string
  timeSeparator: string
}

export interface RawNumberData {
  nu: string[]
  // numberingSystem -> pattern
  symbols: Record<NumberingSystem, SymbolsData>
  // numberingSystem -> pattern
  decimal: Record<
    NumberingSystem,
    {
      // The standard number pattern of the decimal.
      standard: string
      // These two are compact notation mappings.
      long: Record<DecimalFormatNum, LDMLPluralRuleMap<string>>
      short: Record<DecimalFormatNum, LDMLPluralRuleMap<string>>
    }
  >
  percent: Record<NumberingSystem, string>
  currency: Record<NumberingSystem, RawCurrencyData>
}

export type LDMLPluralRuleMap<T> = Omit<
  Partial<Record<LDMLPluralRule, T>>,
  'other'
> & {
  other: T
}

export interface RawNumberFormatResult {
  formattedString: string
  roundedNumber: number
  integerDigitsCount: number
}

export type NumberFormatOptionsLocaleMatcher = 'lookup' | 'best fit'
export type NumberFormatOptionsStyle =
  | 'decimal'
  | 'percent'
  | 'currency'
  | 'unit'
export type NumberFormatOptionsCompactDisplay = 'short' | 'long'
export type NumberFormatOptionsCurrencyDisplay =
  | 'symbol'
  | 'code'
  | 'name'
  | 'narrowSymbol'
export type NumberFormatOptionsCurrencySign = 'standard' | 'accounting'
export type NumberFormatOptionsNotation = NumberFormatNotation
export type NumberFormatOptionsSignDisplay =
  | 'auto'
  | 'always'
  | 'never'
  | 'exceptZero'
export type NumberFormatOptionsUnitDisplay = 'long' | 'short' | 'narrow'

export interface NumberFormatInternal extends NumberFormatDigitInternalSlots {
  locale: string
  dataLocale: string
  style: NumberFormatOptionsStyle
  currency?: string
  currencyDisplay: NumberFormatOptionsCurrencyDisplay
  unit?: string
  unitDisplay: NumberFormatOptionsUnitDisplay
  currencySign: NumberFormatOptionsCurrencySign
  notation: NumberFormatOptionsNotation
  compactDisplay: NumberFormatOptionsCompactDisplay
  signDisplay: NumberFormatOptionsSignDisplay
  useGrouping: boolean
  pl: Intl.PluralRules
  boundFormat?: Intl.NumberFormat['format']
  numberingSystem: string
  // Locale-dependent formatter data
  dataLocaleData: NumberFormatLocaleInternalData
}

export type NumberFormatOptions = Intl.NumberFormatOptions &
  NumberFormatDigitOptions & {
    localeMatcher?: NumberFormatOptionsLocaleMatcher
    style?: NumberFormatOptionsStyle
    compactDisplay?: NumberFormatOptionsCompactDisplay
    currencyDisplay?: NumberFormatOptionsCurrencyDisplay
    currencySign?: NumberFormatOptionsCurrencySign
    notation?: NumberFormatOptionsNotation
    signDisplay?: NumberFormatOptionsSignDisplay
    unit?: string
    unitDisplay?: NumberFormatOptionsUnitDisplay
    numberingSystem?: string
    trailingZeroDisplay?: 'auto' | 'stripIfInteger'
    roundingPriority?: 'auto' | 'morePrecision' | 'lessPrecision'
  }

export type ResolvedNumberFormatOptions = Intl.ResolvedNumberFormatOptions &
  Pick<
    NumberFormatInternal,
    | 'currencySign'
    | 'unit'
    | 'unitDisplay'
    | 'notation'
    | 'compactDisplay'
    | 'signDisplay'
  >

export type NumberFormatPartTypes =
  | Intl.NumberFormatPartTypes
  | 'exponentSeparator'
  | 'exponentMinusSign'
  | 'exponentInteger'
  | 'compact'
  | 'unit'
  | 'literal'

export interface NumberFormatPart {
  type: NumberFormatPartTypes
  value: string
}

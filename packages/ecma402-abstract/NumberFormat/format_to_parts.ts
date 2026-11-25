import type {ApproximateStyle} from '#packages/ecma402-abstract/NumberFormat/FormatApproximately.js'
import {
  composeNumberPattern,
  getNumberPattern,
} from '#packages/ecma402-abstract/NumberFormat/number-patterns.js'
import type {Decimal} from '@formatjs/bigdecimal'
import {SYMBOL_RANGES} from '@formatjs_generated/unicode/regex.js'
import {
  type LDMLPluralRuleMap,
  type NumberFormatLocaleInternalData,
  type NumberFormatOptionsCompactDisplay,
  type NumberFormatOptionsCurrencyDisplay,
  type NumberFormatOptionsCurrencySign,
  type NumberFormatOptionsNotation,
  type NumberFormatOptionsStyle,
  type NumberFormatOptionsUnitDisplay,
  type NumberFormatPart,
  type RawNumberFormatResult,
  type SymbolsData,
  type UseGroupingType,
} from '#packages/ecma402-abstract/types/number.js'
import {getPowerOf10} from '#packages/ecma402-abstract/NumberFormat/decimal-cache.js'
import {type LDMLPluralRule} from '#packages/ecma402-abstract/types/plural-rules.js'
import {getCompactPattern} from '#packages/ecma402-abstract/NumberFormat/compact-patterns.js'
import {digitMapping} from '@formatjs_generated/unicode/digit-mapping.js'
import {HasOwnProperty} from '#packages/ecma262-abstract/HasOwnProperty.js'
import {setDataProperty} from '#packages/ecma262-abstract/intrinsics.js'

const apply = Reflect.apply
const charCodeAt = String.prototype.charCodeAt
const codePointAt = String.prototype.codePointAt
const indexOf = String.prototype.indexOf
const slice = String.prototype.slice
const repeat = String.prototype.repeat
const trim = String.prototype.trim

function appendPart(
  parts: NumberFormatPart[],
  type: NumberFormatPart['type'],
  value: string
): void {
  setDataProperty(parts, parts.length, {type, value})
}

// LDML currency boundary spacing checks Unicode General_Category at the edge.
// https://unicode.org/reports/tr35/tr35-numbers.html#Currency_Spacing
function isSymbol(codePoint: number | undefined): boolean {
  if (codePoint === undefined) return false
  let start = 0
  let end: number = SYMBOL_RANGES.length
  while (start < end) {
    const index = (start + end) >>> 1
    const range = SYMBOL_RANGES[index]
    if (codePoint < range[0]) end = index
    else if (codePoint > range[1]) start = index + 1
    else return true
  }
  return false
}

function lastCodePoint(value: string): number | undefined {
  let index = value.length - 1
  const last = apply(charCodeAt, value, [index]) as number
  if (last >= 0xdc00 && last <= 0xdfff && index > 0) {
    const first = apply(charCodeAt, value, [index - 1]) as number
    if (first >= 0xd800 && first <= 0xdbff) index--
  }
  return apply(codePointAt, value, [index])
}

function appendParts(
  result: NumberFormatPart[],
  parts: readonly NumberFormatPart[]
) {
  for (let i = 0; i < parts.length; i++)
    setDataProperty(result, result.length, parts[i])
}

function appendSpan(
  parts: NumberFormatPart[],
  type: 'literal' | 'unit',
  pattern: string,
  start: number,
  end: number
): void {
  if (start < end) appendPart(parts, type, apply(slice, pattern, [start, end]))
}

function interpolateCurrencyName(
  pattern: string,
  numberParts: NumberFormatPart[],
  name: string
): NumberFormatPart[] {
  const result: NumberFormatPart[] = []
  let start = 0
  for (let i = 0; i + 2 < pattern.length; i++) {
    if (pattern[i] !== '{' || pattern[i + 2] !== '}') continue
    const field = pattern[i + 1]
    if (field !== '0' && field !== '1') continue
    appendSpan(result, 'literal', pattern, start, i)
    if (field === '0') appendParts(result, numberParts)
    else appendPart(result, 'currency', name)
    start = i + 3
    i += 2
  }
  appendSpan(result, 'literal', pattern, start, pattern.length)
  return result
}

function replaceField(pattern: string, field: string, value: string): string {
  const index = apply(indexOf, pattern, [field]) as number
  if (index < 0) return pattern
  return (
    apply(slice, pattern, [0, index]) +
    value +
    apply(slice, pattern, [index + field.length])
  )
}

function interpolateUnit(
  pattern: string,
  numberParts: NumberFormatPart[]
): NumberFormatPart[] {
  const result: NumberFormatPart[] = []
  let start = 0
  let field = apply(indexOf, pattern, ['{0}', start]) as number
  while (field >= 0) {
    // Adjacent whitespace is a literal, separate from the unit affix.
    let before = field
    let after = field + 3
    while (before > start && apply(trim, pattern[before - 1], []) === '')
      before--
    while (after < pattern.length && apply(trim, pattern[after], []) === '')
      after++
    appendSpan(result, 'unit', pattern, start, before)
    appendSpan(result, 'literal', pattern, before, field)
    appendParts(result, numberParts)
    appendSpan(result, 'literal', pattern, field + 3, after)
    start = after
    field = apply(indexOf, pattern, ['{0}', start]) as number
  }
  appendSpan(result, 'unit', pattern, start, pattern.length)
  return result
}

interface NumberResult {
  formattedString: string
  roundedNumber: Decimal
  sign: -1 | 0 | 1
  // Example: 100K has exponent 3 and magnitude 5.
  exponent: number
  magnitude: number
}

export default function formatToParts(
  numberResult: NumberResult,
  data: NumberFormatLocaleInternalData,
  getCategory: (value: Decimal, formatted?: string) => LDMLPluralRule,
  options: {
    numberingSystem: string
    useGrouping?: UseGroupingType
    style: NumberFormatOptionsStyle
    // Notation
    notation: NumberFormatOptionsNotation
    // Compact notation
    compactDisplay?: NumberFormatOptionsCompactDisplay
    // Currency
    currency?: string
    currencyDisplay?: NumberFormatOptionsCurrencyDisplay
    currencySign?: NumberFormatOptionsCurrencySign
    // Unit
    unit?: string
    unitDisplay?: NumberFormatOptionsUnitDisplay
  },
  approximateStyle?: ApproximateStyle
): NumberFormatPart[] {
  const {sign, exponent, magnitude} = numberResult
  const {notation, style, numberingSystem} = options
  const defaultNumberingSystem = data.numbers.nu[0]
  const symbols =
    data.numbers.symbols[numberingSystem] ||
    data.numbers.symbols[defaultNumberingSystem]

  // #region Part 1: partition and interpolate the CLDR number pattern.
  // ----------------------------------------------------------

  // ECMA-402 §16.5.11: select the notation pattern from exponent and locale data.
  // https://tc39.es/ecma402/#sec-getnotationsubpattern
  let compactNumberPattern: string | null = null
  if (notation === 'compact' && magnitude) {
    compactNumberPattern = getCompactDisplayPattern(
      numberResult,
      getCategory,
      data,
      options.compactDisplay!,
      numberingSystem
    )
  }

  // ECMA-402 §6.3 uses the ISO 4217 code when no localized symbol exists.
  // The locale record cannot inherit a translation.
  // https://tc39.es/ecma402/#sec-currency-codes
  const currencyData =
    style === 'currency' && HasOwnProperty(data.currencies, options.currency!)
      ? data.currencies[options.currency!]
      : undefined
  let nonNameCurrencyPart: string | undefined
  if (style === 'currency' && options.currencyDisplay !== 'name') {
    if (currencyData) {
      switch (options.currencyDisplay!) {
        case 'code':
          nonNameCurrencyPart = options.currency!
          break
        case 'symbol':
          nonNameCurrencyPart = currencyData.symbol
          break
        default:
          nonNameCurrencyPart = currencyData.narrow
          break
      }
    } else {
      nonNameCurrencyPart = options.currency!
    }
  }

  const decimal =
    data.numbers.decimal[numberingSystem] ||
    data.numbers.decimal[defaultNumberingSystem]
  const currency =
    data.numbers.currency[numberingSystem] ||
    data.numbers.currency[defaultNumberingSystem]
  const numberPattern =
    style === 'percent'
      ? data.numbers.percent[numberingSystem] ||
        data.numbers.percent[defaultNumberingSystem]
      : style === 'currency' && options.currencyDisplay !== 'name'
        ? currency[options.currencySign!]
        : decimal.standard
  if (approximateStyle) {
    approximateStyle.pattern = numberPattern
    approximateStyle.sign = sign
  }
  const stylePlan = getNumberPattern(
    data.numbers,
    numberPattern,
    false,
    sign,
    false
  )
  // ECMA-402 GetNumberFormatPattern and GetNotationSubPattern are independent.
  const plan = compactNumberPattern
    ? composeNumberPattern(
        stylePlan,
        getNumberPattern(data.numbers, compactNumberPattern, true, 0, false)
      )
    : stylePlan
  const spacing =
    style === 'currency' && options.currencyDisplay !== 'name'
      ? (
          data.numbers.currency[numberingSystem] ||
          data.numbers.currency[defaultNumberingSystem]
        ).currencySpacing
      : undefined
  const beforeCurrency =
    spacing?.beforeInsertBetween &&
    !isSymbol(apply(codePointAt, nonNameCurrencyPart!, [0]))
  const afterCurrency =
    spacing?.afterInsertBetween &&
    !isSymbol(lastCodePoint(nonNameCurrencyPart!))
  let insertedBefore = false
  let insertedAfter = false
  const numberParts: NumberFormatPart[] = []

  // ECMA-402 §16.5.3 step 9 traverses private pattern parts.
  // https://tc39.es/ecma402/#sec-partitionnumberpattern
  for (let index = 0; index < plan.parts.length; index++) {
    const part = plan.parts[index]
    const type = part[0]
    switch (type) {
      case 'number':
        partitionNumberIntoParts(
          numberParts,
          symbols,
          numberResult,
          notation,
          exponent,
          numberingSystem,
          options.useGrouping ?? true,
          plan.grouping,
          data.numbers.minimumGroupingDigits ?? 1,
          style
        )
        break
      case 'currency':
        if (
          !insertedBefore &&
          beforeCurrency &&
          index > 0 &&
          plan.parts[index - 1][0] === 'number'
        ) {
          appendPart(numberParts, 'literal', spacing!.beforeInsertBetween!)
          insertedBefore = true
        }
        appendPart(numberParts, 'currency', nonNameCurrencyPart!)
        if (
          !insertedAfter &&
          afterCurrency &&
          index + 1 < plan.parts.length &&
          plan.parts[index + 1][0] === 'number'
        ) {
          appendPart(numberParts, 'literal', spacing!.afterInsertBetween!)
          insertedAfter = true
        }
        break
      case 'approximatelySign':
      case 'minusSign':
      case 'plusSign':
      case 'percentSign':
        appendPart(numberParts, type, symbols[type])
        break
      default:
        appendPart(numberParts, type, part[1])
    }
  }

  // #endregion

  // #region Part 2: interpolate unit pattern if necessary.
  // ----------------------------------------------

  const getNameCategory = () => {
    const {roundedNumber, formattedString} = numberResult
    if (exponent === 0) return getCategory(roundedNumber, formattedString)
    if (notation === 'compact') {
      return getCategory(roundedNumber.times(getPowerOf10(exponent)))
    }
    // Scientific and engineering notation display a mantissa times 10^exponent.
    // Shift its decimal point before deriving CLDR's visible fraction operands.
    // https://unicode.org/reports/tr35/tr35-numbers.html#Scientific_Notation
    // https://unicode.org/reports/tr35/tr35-numbers.html#Operands
    const decimal = apply(indexOf, formattedString, ['.']) as number
    const integerLength = decimal < 0 ? formattedString.length : decimal
    const digits =
      decimal < 0
        ? formattedString
        : (apply(slice, formattedString, [0, decimal]) as string) +
          apply(slice, formattedString, [decimal + 1])
    const point = integerLength + exponent
    let expanded: string
    if (point <= 0) {
      expanded = '0.' + apply(repeat, '0', [-point]) + digits
    } else if (point >= digits.length) {
      expanded = digits + apply(repeat, '0', [point - digits.length])
    } else {
      expanded =
        apply(slice, digits, [0, point]) + '.' + apply(slice, digits, [point])
    }
    return getCategory(roundedNumber, expanded)
  }

  switch (style) {
    case 'currency': {
      // `currencyDisplay: 'name'` has similar pattern handling as units.
      if (options.currencyDisplay === 'name') {
        const unitPattern = (
          data.numbers.currency[numberingSystem] ||
          data.numbers.currency[defaultNumberingSystem]
        ).unitPattern

        // Sparse CLDR locales can omit names for an otherwise known currency.
        const unitName =
          (currencyData &&
            pluralPattern(getNameCategory(), currencyData.displayName)) ||
          options.currency!

        // ECMA-402 §16.5.3 step 9.c–g expands a private pattern.
        // https://tc39.es/ecma402/#sec-partitionnumberpattern
        return interpolateCurrencyName(unitPattern, numberParts, unitName)
      } else {
        return numberParts
      }
    }
    case 'unit': {
      const unit = options.unit!
      const width = options.unitDisplay!
      const {simple, compound} = data.units
      const category = getNameCategory()
      const unitData = (id: string) =>
        HasOwnProperty(simple, id) ? simple[id] : undefined
      const unitForm = (id: string, plural: LDMLPluralRule) => {
        const forms = unitData(id)?.[width]
        return forms && pluralPattern(plural, forms)
      }
      let unitPattern = unitForm(unit, category)
      if (unitPattern === undefined) {
        // LDML compound units use a precomposed denominator when available.
        // https://unicode.org/reports/tr35/tr35-general.html#Compound_Units
        const per = apply(indexOf, unit, ['-per-']) as number
        if (per >= 0) {
          const numerator = apply(slice, unit, [0, per]) as string
          const denominator = apply(slice, unit, [per + 5]) as string
          const numeratorPattern = unitForm(numerator, category)
          // ECMA-402 §16.5.10 step 6 reads stored unit patterns.
          // https://tc39.es/ecma402/#sec-getnumberformatpattern
          const denominatorData = unitData(denominator)
          const perUnit =
            denominatorData && HasOwnProperty(denominatorData, 'perUnit')
              ? denominatorData.perUnit
              : undefined
          const perUnitPattern =
            perUnit && HasOwnProperty(perUnit, width)
              ? perUnit[width]
              : undefined
          if (numeratorPattern && perUnitPattern) {
            unitPattern = replaceField(perUnitPattern, '{0}', numeratorPattern)
          } else if (numeratorPattern) {
            // CLDR's per derivation assigns category "one" to the denominator.
            // https://unicode.org/reports/tr35/tr35-general.html#Deriving_the_Plural_Category_of_Unit_Components
            const perPattern = HasOwnProperty(compound, 'per')
              ? compound.per?.[width]
              : undefined
            const denominatorPattern = unitForm(denominator, 'one')
            if (perPattern && denominatorPattern) {
              unitPattern = replaceField(
                replaceField(perPattern, '{0}', numeratorPattern),
                '{1}',
                apply(trim, replaceField(denominatorPattern, '{0}', ''), [])
              )
            }
          }
        }
      }
      // ECMA-402 §16.5.10 steps 6.d–f select a fallback for missing unit data.
      // https://tc39.es/ecma402/#sec-getnumberformatpattern
      unitPattern ??= unitForm('fallback', category) ?? `{0} ${unit}`

      return interpolateUnit(unitPattern, numberParts)
    }
    default:
      return numberParts
  }

  // #endregion
}

// ECMA-402 §16.5.4 step 4.c.iii.1 substitutes ASCII digits directly.
// https://tc39.es/ecma402/#sec-partitionnotationsubpattern
function localizeDigits(
  value: string,
  digits: readonly string[] | undefined
): string {
  if (!digits) return value
  let result = ''
  for (let index = 0; index < value.length; index++) {
    const digit = (apply(charCodeAt, value, [index]) as number) - 48
    result += digit >= 0 && digit <= 9 ? digits[digit] : value[index]
  }
  return result
}

// ECMA-402 §16.5.4 partitions digits, separators, and exponent fields.
// https://tc39.es/ecma402/#sec-partitionnotationsubpattern
function partitionNumberIntoParts(
  result: NumberFormatPart[],
  symbols: SymbolsData,
  numberResult: Pick<
    RawNumberFormatResult,
    'formattedString' | 'roundedNumber'
  >,
  notation: NumberFormatOptionsNotation,
  exponent: number,
  numberingSystem: string,
  useGrouping: UseGroupingType,
  grouping: readonly [number, number],
  minimumGroupingDigits: number,
  style: NumberFormatOptionsStyle
): void {
  const {formattedString: n, roundedNumber: x} = numberResult
  if (x.isNaN()) {
    appendPart(result, 'nan', n)
    return
  }
  if (!x.isFinite()) {
    appendPart(result, 'infinity', n)
    return
  }

  const digits = HasOwnProperty(digitMapping, numberingSystem)
    ? digitMapping[numberingSystem]
    : undefined
  const point = apply(indexOf, n, ['.']) as number
  const integerEnd = point < 0 ? n.length : point

  // Step 4.c.iii.7.b groups by original digit positions before substitution.
  // Each ASCII digit maps to one code point, which can occupy two UTF-16 units.
  // https://unicode.org/reports/tr35/tr35-numbers.html#Number_Patterns
  const primary = grouping[0]
  const secondary = grouping[1]
  const minimum = useGrouping === 'min2' ? 2 : minimumGroupingDigits
  const shouldGroup =
    useGrouping !== false &&
    (useGrouping === 'always' || integerEnd >= primary + minimum)
  if (shouldGroup && integerEnd > primary) {
    const separator =
      style === 'currency'
        ? (symbols.currencyGroup ?? symbols.group)
        : symbols.group
    const split = integerEnd - primary
    const firstGroup = ((split - 1) % secondary) + 1
    let start = 0
    for (let end = firstGroup; end <= split; end += secondary) {
      appendPart(
        result,
        'integer',
        localizeDigits(apply(slice, n, [start, end]) as string, digits)
      )
      appendPart(result, 'group', separator)
      start = end
    }
    appendPart(
      result,
      'integer',
      localizeDigits(apply(slice, n, [split, integerEnd]) as string, digits)
    )
  } else {
    const integer = point < 0 ? n : (apply(slice, n, [0, integerEnd]) as string)
    appendPart(result, 'integer', localizeDigits(integer, digits))
  }

  // Step 4.c.iii.8 appends the decimal separator and fraction when present.
  if (point >= 0) {
    const separator =
      style === 'currency'
        ? (symbols.currencyDecimal ?? symbols.decimal)
        : symbols.decimal
    appendPart(result, 'decimal', separator)
    appendPart(
      result,
      'fraction',
      localizeDigits(apply(slice, n, [point + 1]) as string, digits)
    )
  }

  if (notation === 'scientific' || notation === 'engineering') {
    appendPart(result, 'exponentSeparator', symbols.exponential)
    if (exponent < 0) {
      appendPart(result, 'exponentMinusSign', symbols.minusSign)
      exponent = -exponent
    }
    // Step 4.c.vii formats exponent digits in the same numbering system.
    appendPart(result, 'exponentInteger', localizeDigits(`${exponent}`, digits))
  }
}

// Find the CLDR pattern for compact notation based on the magnitude of data and style.
//
// Returns the unsigned notation template; style retains its own signed plan.
//
// Returning null means the compact display pattern cannot be found.
function getCompactDisplayPattern(
  numberResult: NumberResult,
  getCategory: (value: Decimal, formatted?: string) => LDMLPluralRule,
  data: NumberFormatLocaleInternalData,
  compactDisplay: NumberFormatOptionsCompactDisplay,
  numberingSystem: string
): string | null {
  const {roundedNumber, formattedString, magnitude} = numberResult
  // String(10 ** magnitude) uses exponent notation for tiny values; comparing
  // "1e-7" lexically with CLDR thresholds would select the largest suffix.
  if (magnitude < 0) return null
  const defaultNumberingSystem = data.numbers.nu[0]
  const decimal =
    data.numbers.decimal[numberingSystem] ||
    data.numbers.decimal[defaultNumberingSystem]
  const patterns = decimal[compactDisplay]
  const entry = getCompactPattern(patterns, magnitude)
  if (!entry) return null
  // LDML compact formatting steps 7–8 select the pattern from the scaled
  // number at its displayed precision. A pattern of "0" uses normal formatting.
  // https://unicode.org/reports/tr35/tr35-numbers.html#Compact_Number_Formats
  const pattern = pluralPattern(
    getCategory(roundedNumber, formattedString),
    entry.rules
  )
  if (pattern === '0') {
    return null
  }

  return pattern
}

function pluralPattern<T>(
  category: LDMLPluralRule,
  rules: LDMLPluralRuleMap<T>
): T {
  return (
    (HasOwnProperty(rules, category) ? rules[category] : undefined) ||
    rules.other
  )
}

import {
  NumberFormatOptionsStyle,
  NumberFormatOptionsNotation,
  NumberFormatOptionsCompactDisplay,
  NumberFormatOptionsCurrencyDisplay,
  NumberFormatOptionsCurrencySign,
  NumberFormatOptionsUnitDisplay,
  NumberFormatLocaleInternalData,
  UnitData,
  SymbolsData,
  RawNumberFormatResult,
  DecimalFormatNum,
  LDMLPluralRuleMap,
  NumberFormatPart,
  UseGroupingType,
} from '../types/number'
import {ToRawFixed} from './ToRawFixed'
import {LDMLPluralRule} from '../types/plural-rules'
import {digitMapping} from './digit-mapping.generated'
import {S_UNICODE_REGEX} from '../regex.generated'

// This is from: unicode-12.1.0/General_Category/Symbol/regex.js
// IE11 does not support unicode flag, otherwise this is just /\p{S}/u.
// /^\p{S}/u
const CARET_S_UNICODE_REGEX = new RegExp(`^${S_UNICODE_REGEX.source}`)
// /\p{S}$/u
const S_DOLLAR_UNICODE_REGEX = new RegExp(`${S_UNICODE_REGEX.source}$`)

const CLDR_NUMBER_PATTERN = /[#0](?:[\.,][#0]+)*/g

interface NumberResult {
  formattedString: string
  roundedNumber: number
  sign: -1 | 0 | 1
  // Example: 100K has exponent 3 and magnitude 5.
  exponent: number
  magnitude: number
}

export default function formatToParts(
  numberResult: NumberResult,
  data: NumberFormatLocaleInternalData,
  pl: Intl.PluralRules,
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
  }
): NumberFormatPart[] {
  const {sign, exponent, magnitude} = numberResult
  const {notation, style, numberingSystem} = options
  const defaultNumberingSystem = data.numbers.nu[0]

  // #region Part 1: partition and interpolate the CLDR number pattern.
  // ----------------------------------------------------------

  let compactNumberPattern: string | null = null
  if (notation === 'compact' && magnitude) {
    compactNumberPattern = getCompactDisplayPattern(
      numberResult,
      pl,
      data,
      style,
      options.compactDisplay!,
      options.currencyDisplay,
      numberingSystem
    )
  }

  // This is used multiple times
  let nonNameCurrencyPart: string | undefined
  if (style === 'currency' && options.currencyDisplay !== 'name') {
    const byCurrencyDisplay = data.currencies[options.currency!]
    if (byCurrencyDisplay) {
      switch (options.currencyDisplay!) {
        case 'code':
          nonNameCurrencyPart = options.currency!
          break
        case 'symbol':
          nonNameCurrencyPart = byCurrencyDisplay.symbol
          break
        default:
          nonNameCurrencyPart = byCurrencyDisplay.narrow
          break
      }
    } else {
      // Fallback for unknown currency
      nonNameCurrencyPart = options.currency!
    }
  }

  let numberPattern: string
  if (!compactNumberPattern) {
    // Note: if the style is unit, or is currency and the currency display is name,
    // its unit parts will be interpolated in part 2. So here we can fallback to decimal.
    if (
      style === 'decimal' ||
      style === 'unit' ||
      (style === 'currency' && options.currencyDisplay === 'name')
    ) {
      // Shortcut for decimal
      const decimalData =
        data.numbers.decimal[numberingSystem] ||
        data.numbers.decimal[defaultNumberingSystem]
      numberPattern = getPatternForSign(decimalData.standard, sign)
    } else if (style === 'currency') {
      const currencyData =
        data.numbers.currency[numberingSystem] ||
        data.numbers.currency[defaultNumberingSystem]

      // We replace number pattern part with `0` for easier postprocessing.
      numberPattern = getPatternForSign(
        currencyData[options.currencySign!],
        sign
      )
    } else {
      // percent
      const percentPattern =
        data.numbers.percent[numberingSystem] ||
        data.numbers.percent[defaultNumberingSystem]
      numberPattern = getPatternForSign(percentPattern, sign)
    }
  } else {
    numberPattern = compactNumberPattern
  }

  // Extract the decimal number pattern string. It looks like "#,##0,00", which will later be
  // used to infer decimal group sizes.
  const decimalNumberPattern = CLDR_NUMBER_PATTERN.exec(numberPattern)![0]

  // Now we start to substitute patterns
  // 1. replace strings like `0` and `#,##0.00` with `{0}`
  // 2. unquote characters (invariant: the quoted characters does not contain the special tokens)
  numberPattern = numberPattern
    .replace(CLDR_NUMBER_PATTERN, '{0}')
    .replace(/'(.)'/g, '$1')

  // Handle currency spacing (both compact and non-compact).
  if (style === 'currency' && options.currencyDisplay !== 'name') {
    const currencyData =
      data.numbers.currency[numberingSystem] ||
      data.numbers.currency[defaultNumberingSystem]
    // See `currencySpacing` substitution rule in TR-35.
    // Here we always assume the currencyMatch is "[:^S:]" and surroundingMatch is "[:digit:]".
    //
    // Example 1: for pattern "#,##0.00¤" with symbol "US$", we replace "¤" with the symbol,
    // but insert an extra non-break space before the symbol, because "[:^S:]" matches "U" in
    // "US$" and "[:digit:]" matches the latn numbering system digits.
    //
    // Example 2: for pattern "¤#,##0.00" with symbol "US$", there is no spacing between symbol
    // and number, because `$` does not match "[:^S:]".
    //
    // Implementation note: here we do the best effort to infer the insertion.
    // We also assume that `beforeInsertBetween` and `afterInsertBetween` will never be `;`.
    const afterCurrency = currencyData.currencySpacing.afterInsertBetween
    if (afterCurrency && !S_DOLLAR_UNICODE_REGEX.test(nonNameCurrencyPart!)) {
      numberPattern = numberPattern.replace('¤{0}', `¤${afterCurrency}{0}`)
    }
    const beforeCurrency = currencyData.currencySpacing.beforeInsertBetween
    if (beforeCurrency && !CARET_S_UNICODE_REGEX.test(nonNameCurrencyPart!)) {
      numberPattern = numberPattern.replace('{0}¤', `{0}${beforeCurrency}¤`)
    }
  }

  // The following tokens are special: `{0}`, `¤`, `%`, `-`, `+`, `{c:...}.
  const numberPatternParts = numberPattern.split(/({c:[^}]+}|\{0\}|[¤%\-\+])/g)
  const numberParts: NumberFormatPart[] = []

  const symbols =
    data.numbers.symbols[numberingSystem] ||
    data.numbers.symbols[defaultNumberingSystem]

  for (const part of numberPatternParts) {
    if (!part) {
      continue
    }
    switch (part) {
      case '{0}': {
        // We only need to handle scientific and engineering notation here.
        numberParts.push(
          ...paritionNumberIntoParts(
            symbols,
            numberResult,
            notation,
            exponent,
            numberingSystem,
            // If compact number pattern exists, do not insert group separators.
            !compactNumberPattern && Boolean(options.useGrouping),
            decimalNumberPattern
          )
        )
        break
      }
      case '-':
        numberParts.push({type: 'minusSign', value: symbols.minusSign})
        break
      case '+':
        numberParts.push({type: 'plusSign', value: symbols.plusSign})
        break
      case '%':
        numberParts.push({type: 'percentSign', value: symbols.percentSign})
        break
      case '¤':
        // Computed above when handling currency spacing.
        numberParts.push({type: 'currency', value: nonNameCurrencyPart!})
        break
      default:
        if (/^\{c:/.test(part)) {
          numberParts.push({
            type: 'compact',
            value: part.substring(3, part.length - 1),
          })
        } else {
          // literal
          numberParts.push({type: 'literal', value: part})
        }
        break
    }
  }

  // #endregion

  // #region Part 2: interpolate unit pattern if necessary.
  // ----------------------------------------------

  switch (style) {
    case 'currency': {
      // `currencyDisplay: 'name'` has similar pattern handling as units.
      if (options.currencyDisplay === 'name') {
        const unitPattern = (
          data.numbers.currency[numberingSystem] ||
          data.numbers.currency[defaultNumberingSystem]
        ).unitPattern

        // Select plural
        let unitName: string
        const currencyNameData = data.currencies[options.currency!]
        if (currencyNameData) {
          unitName = selectPlural(
            pl,
            numberResult.roundedNumber * 10 ** exponent,
            currencyNameData.displayName
          )
        } else {
          // Fallback for unknown currency
          unitName = options.currency!
        }

        // Do {0} and {1} substitution
        const unitPatternParts = unitPattern.split(/(\{[01]\})/g)

        const result: NumberFormatPart[] = []
        for (const part of unitPatternParts) {
          switch (part) {
            case '{0}':
              result.push(...numberParts)
              break
            case '{1}':
              result.push({type: 'currency', value: unitName})
              break
            default:
              if (part) {
                result.push({type: 'literal', value: part})
              }
              break
          }
        }
        return result
      } else {
        return numberParts
      }
    }
    case 'unit': {
      const {unit, unitDisplay} = options

      let unitData: UnitData | undefined = data.units.simple[unit!]

      let unitPattern: string
      if (unitData) {
        // Simple unit pattern
        unitPattern = selectPlural(
          pl,
          numberResult.roundedNumber * 10 ** exponent,
          data.units.simple[unit!][unitDisplay!]
        )
      } else {
        // See: http://unicode.org/reports/tr35/tr35-general.html#perUnitPatterns
        // If cannot find unit in the simple pattern, it must be "per" compound pattern.
        // Implementation note: we are not following TR-35 here because we need to format to parts!
        const [numeratorUnit, denominatorUnit] = unit!.split('-per-')
        unitData = data.units.simple[numeratorUnit]

        const numeratorUnitPattern = selectPlural(
          pl,
          numberResult.roundedNumber * 10 ** exponent,
          data.units.simple[numeratorUnit!][unitDisplay!]
        )
        const perUnitPattern =
          data.units.simple[denominatorUnit].perUnit[unitDisplay!]

        if (perUnitPattern) {
          // perUnitPattern exists, combine it with numeratorUnitPattern
          unitPattern = perUnitPattern.replace('{0}', numeratorUnitPattern)
        } else {
          // get compoundUnit pattern (e.g. "{0} per {1}"), repalce {0} with numerator pattern and {1} with
          // the denominator pattern in singular form.
          const perPattern = data.units.compound.per[unitDisplay!]
          const denominatorPattern = selectPlural(
            pl,
            1,
            data.units.simple[denominatorUnit][unitDisplay!]
          )
          unitPattern = unitPattern = perPattern
            .replace('{0}', numeratorUnitPattern)
            .replace('{1}', denominatorPattern.replace('{0}', ''))
        }
      }

      const result: NumberFormatPart[] = []
      // We need spacing around "{0}" because they are not treated as "unit" parts, but "literal".
      for (const part of unitPattern.split(/(\s*\{0\}\s*)/)) {
        const interpolateMatch = /^(\s*)\{0\}(\s*)$/.exec(part)
        if (interpolateMatch) {
          // Space before "{0}"
          if (interpolateMatch[1]) {
            result.push({type: 'literal', value: interpolateMatch[1]})
          }
          // "{0}" itself
          result.push(...numberParts)
          // Space after "{0}"
          if (interpolateMatch[2]) {
            result.push({type: 'literal', value: interpolateMatch[2]})
          }
        } else if (part) {
          result.push({type: 'unit', value: part})
        }
      }

      return result
    }
    default:
      return numberParts
  }

  // #endregion
}

// A subset of https://tc39.es/ecma402/#sec-partitionnotationsubpattern
// Plus the exponent parts handling.
function paritionNumberIntoParts(
  symbols: SymbolsData,
  numberResult: Pick<
    RawNumberFormatResult,
    'formattedString' | 'roundedNumber'
  >,
  notation: NumberFormatOptionsNotation,
  exponent: number,
  numberingSystem: string,
  useGrouping: boolean,
  /**
   * This is the decimal number pattern without signs or symbols.
   * It is used to infer the group size when `useGrouping` is true.
   *
   * A typical value looks like "#,##0.00" (primary group size is 3).
   * Some locales like Hindi has secondary group size of 2 (e.g. "#,##,##0.00").
   */
  decimalNumberPattern: string
): NumberFormatPart[] {
  const result: NumberFormatPart[] = []
  // eslint-disable-next-line prefer-const
  let {formattedString: n, roundedNumber: x} = numberResult

  if (isNaN(x)) {
    return [{type: 'nan', value: n}]
  } else if (!isFinite(x)) {
    return [{type: 'infinity', value: n}]
  }

  const digitReplacementTable = digitMapping[numberingSystem as 'arab']
  if (digitReplacementTable) {
    n = n.replace(/\d/g, digit => digitReplacementTable[+digit] || digit)
  }
  // TODO: Else use an implementation dependent algorithm to map n to the appropriate
  // representation of n in the given numbering system.
  const decimalSepIndex = n.indexOf('.')
  let integer: string
  let fraction: string | undefined
  if (decimalSepIndex > 0) {
    integer = n.slice(0, decimalSepIndex)
    fraction = n.slice(decimalSepIndex + 1)
  } else {
    integer = n
  }

  // #region Grouping integer digits

  // The weird compact and x >= 10000 check is to ensure consistency with Node.js and Chrome.
  // Note that `de` does not have compact form for thousands, but Node.js does not insert grouping separator
  // unless the rounded number is greater than 10000:
  //   NumberFormat('de', {notation: 'compact', compactDisplay: 'short'}).format(1234) //=> "1234"
  //   NumberFormat('de').format(1234) //=> "1.234"
  if (useGrouping && (notation !== 'compact' || x >= 10000)) {
    const groupSepSymbol = symbols.group
    const groups: string[] = []

    // > There may be two different grouping sizes: The primary grouping size used for the least
    // > significant integer group, and the secondary grouping size used for more significant groups.
    // > If a pattern contains multiple grouping separators, the interval between the last one and the
    // > end of the integer defines the primary grouping size, and the interval between the last two
    // > defines the secondary grouping size. All others are ignored.
    const integerNumberPattern = decimalNumberPattern.split('.')[0]
    const patternGroups = integerNumberPattern.split(',')

    let primaryGroupingSize = 3
    let secondaryGroupingSize = 3

    if (patternGroups.length > 1) {
      primaryGroupingSize = patternGroups[patternGroups.length - 1].length
    }
    if (patternGroups.length > 2) {
      secondaryGroupingSize = patternGroups[patternGroups.length - 2].length
    }

    let i = integer.length - primaryGroupingSize
    if (i > 0) {
      // Slice the least significant integer group
      groups.push(integer.slice(i, i + primaryGroupingSize))
      // Then iteratively push the more signicant groups
      // TODO: handle surrogate pairs in some numbering system digits
      for (i -= secondaryGroupingSize; i > 0; i -= secondaryGroupingSize) {
        groups.push(integer.slice(i, i + secondaryGroupingSize))
      }
      groups.push(integer.slice(0, i + secondaryGroupingSize))
    } else {
      groups.push(integer)
    }

    while (groups.length > 0) {
      const integerGroup = groups.pop()!
      result.push({type: 'integer', value: integerGroup})
      if (groups.length > 0) {
        result.push({type: 'group', value: groupSepSymbol})
      }
    }
  } else {
    result.push({type: 'integer', value: integer})
  }

  // #endregion

  if (fraction !== undefined) {
    result.push(
      {type: 'decimal', value: symbols.decimal},
      {type: 'fraction', value: fraction}
    )
  }

  if (
    (notation === 'scientific' || notation === 'engineering') &&
    isFinite(x)
  ) {
    result.push({type: 'exponentSeparator', value: symbols.exponential})
    if (exponent < 0) {
      result.push({type: 'exponentMinusSign', value: symbols.minusSign})
      exponent = -exponent
    }
    const exponentResult = ToRawFixed(exponent, 0, 0)
    result.push({
      type: 'exponentInteger',
      value: exponentResult.formattedString,
    })
  }

  return result
}

function getPatternForSign(pattern: string, sign: -1 | 0 | 1): string {
  if (pattern.indexOf(';') < 0) {
    pattern = `${pattern};-${pattern}`
  }
  const [zeroPattern, negativePattern] = pattern.split(';')
  switch (sign) {
    case 0:
      return zeroPattern
    case -1:
      return negativePattern
    default:
      return negativePattern.indexOf('-') >= 0
        ? negativePattern.replace(/-/g, '+')
        : `+${zeroPattern}`
  }
}

// Find the CLDR pattern for compact notation based on the magnitude of data and style.
//
// Example return value: "¤ {c:laki}000;¤{c:laki} -0" (`sw` locale):
// - Notice the `{c:...}` token that wraps the compact literal.
// - The consecutive zeros are normalized to single zero to match CLDR_NUMBER_PATTERN.
//
// Returning null means the compact display pattern cannot be found.
function getCompactDisplayPattern(
  numberResult: NumberResult,
  pl: Intl.PluralRules,
  data: NumberFormatLocaleInternalData,
  style: NumberFormatOptionsStyle,
  compactDisplay: NumberFormatOptionsCompactDisplay,
  currencyDisplay: NumberFormatOptionsCurrencyDisplay | undefined,
  numberingSystem: string
): string | null {
  const {roundedNumber, sign, magnitude} = numberResult
  const magnitudeKey = String(10 ** magnitude) as DecimalFormatNum
  const defaultNumberingSystem = data.numbers.nu[0]

  let pattern: string
  if (style === 'currency' && currencyDisplay !== 'name') {
    const byNumberingSystem = data.numbers.currency
    const currencyData =
      byNumberingSystem[numberingSystem] ||
      byNumberingSystem[defaultNumberingSystem]

    // NOTE: compact notation ignores currencySign!
    const compactPluralRules = currencyData.short?.[magnitudeKey]
    if (!compactPluralRules) {
      return null
    }
    pattern = selectPlural(pl, roundedNumber, compactPluralRules)
  } else {
    const byNumberingSystem = data.numbers.decimal
    const byCompactDisplay =
      byNumberingSystem[numberingSystem] ||
      byNumberingSystem[defaultNumberingSystem]

    const compactPlaralRule = byCompactDisplay[compactDisplay][magnitudeKey]
    if (!compactPlaralRule) {
      return null
    }
    pattern = selectPlural(pl, roundedNumber, compactPlaralRule)
  }
  // See https://unicode.org/reports/tr35/tr35-numbers.html#Compact_Number_Formats
  // > If the value is precisely “0”, either explicit or defaulted, then the normal number format
  // > pattern for that sort of object is supplied.
  if (pattern === '0') {
    return null
  }

  pattern = getPatternForSign(pattern, sign)
    // Extract compact literal from the pattern
    .replace(/([^\s;\-\+\d¤]+)/g, '{c:$1}')
    // We replace one or more zeros with a single zero so it matches `CLDR_NUMBER_PATTERN`.
    .replace(/0+/, '0')

  return pattern
}

function selectPlural<T>(
  pl: Intl.PluralRules,
  x: number,
  rules: LDMLPluralRuleMap<T>
): T {
  return rules[pl.select(x) as LDMLPluralRule] || rules.other
}

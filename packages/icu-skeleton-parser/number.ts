import type {NumberFormatOptions} from '@formatjs/ecma402-abstract'
import {WHITE_SPACE_REGEX} from './regex.generated'

export interface ExtendedNumberFormatOptions extends NumberFormatOptions {
  scale?: number
}
export interface NumberSkeletonToken {
  stem: string
  options: string[]
}

export function parseNumberSkeletonFromString(
  skeleton: string
): NumberSkeletonToken[] {
  if (skeleton.length === 0) {
    throw new Error('Number skeleton cannot be empty')
  }
  // Parse the skeleton
  const stringTokens = skeleton
    .split(WHITE_SPACE_REGEX)
    .filter(x => x.length > 0)

  const tokens: NumberSkeletonToken[] = []
  for (const stringToken of stringTokens) {
    let stemAndOptions = stringToken.split('/')
    if (stemAndOptions.length === 0) {
      throw new Error('Invalid number skeleton')
    }

    const [stem, ...options] = stemAndOptions
    for (const option of options) {
      if (option.length === 0) {
        throw new Error('Invalid number skeleton')
      }
    }

    tokens.push({stem, options})
  }
  return tokens
}

function icuUnitToEcma(unit: string): ExtendedNumberFormatOptions['unit'] {
  return unit.replace(/^(.*?)-/, '') as ExtendedNumberFormatOptions['unit']
}

const FRACTION_PRECISION_REGEX = /^\.(?:(0+)(\*)?|(#+)|(0+)(#+))$/g
const SIGNIFICANT_PRECISION_REGEX = /^(@+)?(\+|#+)?[rs]?$/g
const INTEGER_WIDTH_REGEX = /(\*)(0+)|(#+)(0+)|(0+)/g
const CONCISE_INTEGER_WIDTH_REGEX = /^(0+)$/

function parseSignificantPrecision(str: string): ExtendedNumberFormatOptions {
  const result: ExtendedNumberFormatOptions = {}
  if (str[str.length - 1] === 'r') {
    result.roundingPriority = 'morePrecision'
  } else if (str[str.length - 1] === 's') {
    result.roundingPriority = 'lessPrecision'
  }
  str.replace(
    SIGNIFICANT_PRECISION_REGEX,
    function (_: string, g1: string, g2: string | number) {
      // @@@ case
      if (typeof g2 !== 'string') {
        result.minimumSignificantDigits = g1.length
        result.maximumSignificantDigits = g1.length
      }
      // @@@+ case
      else if (g2 === '+') {
        result.minimumSignificantDigits = g1.length
      }
      // .### case
      else if (g1[0] === '#') {
        result.maximumSignificantDigits = g1.length
      }
      // .@@## or .@@@ case
      else {
        result.minimumSignificantDigits = g1.length
        result.maximumSignificantDigits =
          g1.length + (typeof g2 === 'string' ? g2.length : 0)
      }
      return ''
    }
  )
  return result
}

function parseSign(str: string): ExtendedNumberFormatOptions | undefined {
  switch (str) {
    case 'sign-auto':
      return {
        signDisplay: 'auto',
      }
    case 'sign-accounting':
    case '()':
      return {
        currencySign: 'accounting',
      }
    case 'sign-always':
    case '+!':
      return {
        signDisplay: 'always',
      }
    case 'sign-accounting-always':
    case '()!':
      return {
        signDisplay: 'always',
        currencySign: 'accounting',
      }
    case 'sign-except-zero':
    case '+?':
      return {
        signDisplay: 'exceptZero',
      }
    case 'sign-accounting-except-zero':
    case '()?':
      return {
        signDisplay: 'exceptZero',
        currencySign: 'accounting',
      }
    case 'sign-never':
    case '+_':
      return {
        signDisplay: 'never',
      }
  }
}

function parseConciseScientificAndEngineeringStem(
  stem: string
): ExtendedNumberFormatOptions | undefined {
  // Engineering
  let result: ExtendedNumberFormatOptions | undefined
  if (stem[0] === 'E' && stem[1] === 'E') {
    result = {
      notation: 'engineering',
    }
    stem = stem.slice(2)
  } else if (stem[0] === 'E') {
    result = {
      notation: 'scientific',
    }
    stem = stem.slice(1)
  }
  if (result) {
    const signDisplay = stem.slice(0, 2)
    if (signDisplay === '+!') {
      result.signDisplay = 'always'
      stem = stem.slice(2)
    } else if (signDisplay === '+?') {
      result.signDisplay = 'exceptZero'
      stem = stem.slice(2)
    }
    if (!CONCISE_INTEGER_WIDTH_REGEX.test(stem)) {
      throw new Error('Malformed concise eng/scientific notation')
    }
    result.minimumIntegerDigits = stem.length
  }
  return result
}

function parseNotationOptions(opt: string): ExtendedNumberFormatOptions {
  const result: ExtendedNumberFormatOptions = {}
  const signOpts = parseSign(opt)
  if (signOpts) {
    return signOpts
  }
  return result
}

/**
 * https://github.com/unicode-org/icu/blob/master/docs/userguide/format_parse/numbers/skeletons.md#skeleton-stems-and-options
 */
export function parseNumberSkeleton(
  tokens: NumberSkeletonToken[]
): ExtendedNumberFormatOptions {
  let result: ExtendedNumberFormatOptions = {}
  for (const token of tokens) {
    switch (token.stem) {
      case 'percent':
      case '%':
        result.style = 'percent'
        continue
      case '%x100':
        result.style = 'percent'
        result.scale = 100
        continue
      case 'currency':
        result.style = 'currency'
        result.currency = token.options[0]
        continue
      case 'group-off':
      case ',_':
        result.useGrouping = false
        continue
      case 'precision-integer':
      case '.':
        result.maximumFractionDigits = 0
        continue
      case 'measure-unit':
      case 'unit':
        result.style = 'unit'
        result.unit = icuUnitToEcma(token.options[0])
        continue
      case 'compact-short':
      case 'K':
        result.notation = 'compact'
        result.compactDisplay = 'short'
        continue
      case 'compact-long':
      case 'KK':
        result.notation = 'compact'
        result.compactDisplay = 'long'
        continue
      case 'scientific':
        result = {
          ...result,
          notation: 'scientific',
          ...token.options.reduce(
            (all, opt) => ({...all, ...parseNotationOptions(opt)}),
            {}
          ),
        }
        continue
      case 'engineering':
        result = {
          ...result,
          notation: 'engineering',
          ...token.options.reduce(
            (all, opt) => ({...all, ...parseNotationOptions(opt)}),
            {}
          ),
        }
        continue
      case 'notation-simple':
        result.notation = 'standard'
        continue
      // https://github.com/unicode-org/icu/blob/master/icu4c/source/i18n/unicode/unumberformatter.h
      case 'unit-width-narrow':
        result.currencyDisplay = 'narrowSymbol'
        result.unitDisplay = 'narrow'
        continue
      case 'unit-width-short':
        result.currencyDisplay = 'code'
        result.unitDisplay = 'short'
        continue
      case 'unit-width-full-name':
        result.currencyDisplay = 'name'
        result.unitDisplay = 'long'
        continue
      case 'unit-width-iso-code':
        result.currencyDisplay = 'symbol'
        continue
      case 'scale':
        result.scale = parseFloat(token.options[0])
        continue
      // https://unicode-org.github.io/icu/userguide/format_parse/numbers/skeletons.html#integer-width
      case 'integer-width':
        if (token.options.length > 1) {
          throw new RangeError(
            'integer-width stems only accept a single optional option'
          )
        }
        token.options[0].replace(
          INTEGER_WIDTH_REGEX,
          function (
            _: string,
            g1: string,
            g2: string,
            g3: string,
            g4: string,
            g5: string
          ) {
            if (g1) {
              result.minimumIntegerDigits = g2.length
            } else if (g3 && g4) {
              throw new Error(
                'We currently do not support maximum integer digits'
              )
            } else if (g5) {
              throw new Error(
                'We currently do not support exact integer digits'
              )
            }
            return ''
          }
        )
        continue
    }
    // https://unicode-org.github.io/icu/userguide/format_parse/numbers/skeletons.html#integer-width
    if (CONCISE_INTEGER_WIDTH_REGEX.test(token.stem)) {
      result.minimumIntegerDigits = token.stem.length
      continue
    }
    if (FRACTION_PRECISION_REGEX.test(token.stem)) {
      // Precision
      // https://unicode-org.github.io/icu/userguide/format_parse/numbers/skeletons.html#fraction-precision
      // precision-integer case
      if (token.options.length > 1) {
        throw new RangeError(
          'Fraction-precision stems only accept a single optional option'
        )
      }
      token.stem.replace(
        FRACTION_PRECISION_REGEX,
        function (
          _: string,
          g1: string,
          g2: string | number,
          g3: string,
          g4: string,
          g5: string
        ) {
          // .000* case (before ICU67 it was .000+)
          if (g2 === '*') {
            result.minimumFractionDigits = g1.length
          }
          // .### case
          else if (g3 && g3[0] === '#') {
            result.maximumFractionDigits = g3.length
          }
          // .00## case
          else if (g4 && g5) {
            result.minimumFractionDigits = g4.length
            result.maximumFractionDigits = g4.length + g5.length
          } else {
            result.minimumFractionDigits = g1.length
            result.maximumFractionDigits = g1.length
          }
          return ''
        }
      )

      const opt = token.options[0]
      // https://unicode-org.github.io/icu/userguide/format_parse/numbers/skeletons.html#trailing-zero-display
      if (opt === 'w') {
        result = {...result, trailingZeroDisplay: 'stripIfInteger'}
      } else if (opt) {
        result = {...result, ...parseSignificantPrecision(opt)}
      }
      continue
    }
    // https://unicode-org.github.io/icu/userguide/format_parse/numbers/skeletons.html#significant-digits-precision
    if (SIGNIFICANT_PRECISION_REGEX.test(token.stem)) {
      result = {...result, ...parseSignificantPrecision(token.stem)}
      continue
    }
    const signOpts = parseSign(token.stem)
    if (signOpts) {
      result = {...result, ...signOpts}
    }
    const conciseScientificAndEngineeringOpts =
      parseConciseScientificAndEngineeringStem(token.stem)
    if (conciseScientificAndEngineeringOpts) {
      result = {...result, ...conciseScientificAndEngineeringOpts}
    }
  }
  return result
}

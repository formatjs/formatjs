import {
  NumberFormatInternal,
  NumberFormatPart,
  NumberFormatPartTypes,
} from '../types/number.js'

const PART_TYPES_TO_COLLAPSE = new Set<NumberFormatPartTypes>([
  'unit',
  'exponentMinusSign',
  'minusSign',
  'plusSign',
  'percentSign',
  'exponentSeparator',
  'percent',
  'percentSign',
  'currency',
  'literal',
] as const)

/**
 * https://tc39.es/ecma402/#sec-collapsenumberrange
 * LDML: https://unicode-org.github.io/cldr/ldml/tr35-numbers.html#collapsing-number-ranges
 */
export function CollapseNumberRange(
  numberFormat: Intl.NumberFormat,
  result: NumberFormatPart[],
  {
    getInternalSlots,
  }: {
    getInternalSlots(nf: Intl.NumberFormat): NumberFormatInternal
  }
): NumberFormatPart[] {
  const internalSlots = getInternalSlots(numberFormat)
  const symbols =
    internalSlots.dataLocaleData.numbers.symbols[internalSlots.numberingSystem]
  const rangeSignRegex = new RegExp(`s?[${symbols.rangeSign}]s?`)
  const rangeSignIndex = result.findIndex(
    r => r.type === 'literal' && rangeSignRegex.test(r.value)
  )

  let prefixSignParts = []
  for (let i = rangeSignIndex - 1; i >= 0; i--) {
    if (!PART_TYPES_TO_COLLAPSE.has(result[i].type)) {
      break
    }
    prefixSignParts.unshift(result[i])
  }

  // Don't collapse if it's a single code point
  if (Array.from(prefixSignParts.map(p => p.value).join('')).length > 1) {
    const newResult = Array.from(result)
    newResult.splice(
      rangeSignIndex - prefixSignParts.length,
      prefixSignParts.length
    )
    return newResult
  }

  let suffixSignParts = []
  for (let i = rangeSignIndex + 1; i < result.length; i++) {
    if (!PART_TYPES_TO_COLLAPSE.has(result[i].type)) {
      break
    }
    suffixSignParts.push(result[i])
  }

  // Don't collapse if it's a single code point
  if (Array.from(suffixSignParts.map(p => p.value).join('')).length > 1) {
    const newResult = Array.from(result)
    newResult.splice(rangeSignIndex + 1, suffixSignParts.length)
    return newResult
  }
  return result
}

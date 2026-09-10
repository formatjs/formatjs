import {
  type NumberFormatInternal,
  type NumberFormatPart,
  type NumberFormatPartTypes,
} from '#packages/ecma402-abstract/types/number.js'

const AFFIX_TYPES = new Set<NumberFormatPartTypes>([
  'unit',
  'minusSign',
  'plusSign',
  'percentSign',
  'currency',
  'literal',
])
const DIGIT_TYPES = new Set<NumberFormatPartTypes>([
  'integer',
  'fraction',
  'exponentInteger',
])

function affixLength(parts: NumberFormatPart[], fromEnd: boolean): number {
  let length = 0
  while (length < parts.length) {
    const part = parts[fromEnd ? parts.length - length - 1 : length]
    if (!AFFIX_TYPES.has(part.type)) break
    length++
  }
  return length
}

function canCollapse(
  a: NumberFormatPart[],
  b: NumberFormatPart[],
  sharedSuffix = false
): boolean {
  return (
    a.length === b.length &&
    a.some(part => part.type !== 'literal') &&
    a.every(
      (part, i) => part.type === b[i].type && part.value === b[i].value
    ) &&
    (Array.from(a.map(part => part.value).join('')).length > 1 ||
      (sharedSuffix &&
        a.length === 1 &&
        (a[0].type === 'plusSign' || a[0].type === 'minusSign')))
  )
}

// ECMA-402 §16.5.21 forbids collapsing ranges into ambiguous results.
// Only identical affixes collapse; scientific and compact notation remain intact.
// https://tc39.es/ecma402/#sec-collapsenumberrange
// https://github.com/tc39/ecma402/blob/b1c961988b9a07894b1dc3dc2b5626ea48387d61/spec/numberformat.html#L1874-L1878
// LDML collapsing steps 1–3 and range-spacing heuristics:
// https://unicode.org/reports/tr35/tr35-numbers.html#Collapsing_Number_Ranges
// https://github.com/unicode-org/cldr/blob/acd6d88ae493633240e19a87a721076a8a75c310/docs/ldml/tr35-numbers.md#L1886-L1921
export function CollapseNumberRange(
  _numberFormat: Intl.NumberFormat,
  result: NumberFormatPart[],
  _options: {
    getInternalSlots(nf: Intl.NumberFormat): NumberFormatInternal
  }
): NumberFormatPart[] {
  const separatorIndex = result.findIndex(part => part.source === 'shared')
  if (separatorIndex < 0) return result
  const start = result.slice(0, separatorIndex)
  const end = result.slice(separatorIndex + 1)
  const separator = {...result[separatorIndex]}
  const prefix: NumberFormatPart[] = []
  const suffix: NumberFormatPart[] = []

  const startPrefix = start.slice(0, affixLength(start, false))
  const endPrefix = end.slice(0, affixLength(end, false))
  const startSuffixLength = affixLength(start, true)
  const endSuffixLength = affixLength(end, true)
  const startSuffix = start.slice(start.length - startSuffixLength)
  const endSuffix = end.slice(end.length - endSuffixLength)
  const collapseSuffix = canCollapse(startSuffix, endSuffix)
  // A shared currency/unit suffix also permits sharing identical sign prefixes.
  // The complete shared affix is more than one code point; mixed signs stay distinct.
  // ECMA-402 §16.5.21, ambiguity constraint, and LDML collapsing steps 1–3 above.
  const sharedUnit =
    collapseSuffix &&
    startSuffix.some(
      part =>
        part.type === 'currency' ||
        part.type === 'unit' ||
        part.type === 'percentSign'
    )
  if (canCollapse(startPrefix, endPrefix, sharedUnit)) {
    prefix.push(...start.splice(0, startPrefix.length))
    end.splice(0, endPrefix.length)
  }
  if (collapseSuffix) {
    start.splice(start.length - startSuffixLength)
    suffix.push(...end.splice(end.length - endSuffixLength))
  }
  for (const part of [...prefix, ...suffix]) part.source = 'shared'

  if (
    start.length &&
    end.length &&
    (!DIGIT_TYPES.has(start[start.length - 1].type) ||
      !DIGIT_TYPES.has(end[0].type))
  ) {
    // Use ordinary spaces for the optional spacing around uncollapsed affixes.
    if (!separator.value || separator.value.charAt(0).trim())
      separator.value = ` ${separator.value}`
    if (separator.value.charAt(separator.value.length - 1).trim())
      separator.value += ' '
  }
  return [...prefix, ...start, separator, ...end, ...suffix]
}

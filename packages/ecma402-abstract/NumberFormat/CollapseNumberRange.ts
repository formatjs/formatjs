import {setDataProperty} from '#packages/ecma262-abstract/intrinsics.js'
import {
  type NumberFormatInternal,
  type NumberFormatPart,
  type NumberFormatPartTypes,
} from '#packages/ecma402-abstract/types/number.js'

const apply = Reflect.apply
const codePointAt = String.prototype.codePointAt
const indexOf = String.prototype.indexOf
const trim = String.prototype.trim

// LDML uses Unicode White_Space. ECMAScript trim adds BOM and omits NEL.
// https://unicode.org/reports/tr35/tr35-numbers.html#Range_Pattern_Processing
// https://tc39.es/ecma262/#sec-white-space
function isRangeSpace(character: string): boolean {
  return (
    character === '\u0085' ||
    (character !== '\ufeff' && apply(trim, character, []) === '')
  )
}

function isAffix(type: NumberFormatPartTypes): boolean {
  return (
    type === 'unit' ||
    type === 'minusSign' ||
    type === 'plusSign' ||
    type === 'percentSign' ||
    type === 'currency' ||
    type === 'literal'
  )
}

function isDigit(type: NumberFormatPartTypes): boolean {
  return type === 'integer' || type === 'fraction' || type === 'exponentInteger'
}

function prefixEnd(
  parts: NumberFormatPart[],
  start: number,
  end: number
): number {
  while (start < end && isAffix(parts[start].type)) start++
  return start
}

function suffixStart(
  parts: NumberFormatPart[],
  start: number,
  end: number
): number {
  while (start < end && isAffix(parts[end - 1].type)) end--
  return end
}

function canCollapse(
  parts: NumberFormatPart[],
  start: number,
  end: number,
  otherStart: number,
  otherEnd: number,
  sharedUnit = false
): boolean {
  if (end - start !== otherEnd - otherStart) return false
  let nonLiteral = false
  let value = ''
  for (let i = start; i < end; i++) {
    const lhs = parts[i]
    const rhs = parts[otherStart + i - start]
    if (
      lhs.type === 'minusSign' ||
      lhs.type !== rhs.type ||
      lhs.value !== rhs.value
    )
      return false
    if (lhs.type !== 'literal') nonLiteral = true
    value += lhs.value
  }
  // Count Unicode code points across the whole affix, including paired surrogates.
  const multipleCodePoints =
    value.length > 2 ||
    (value.length === 2 && (apply(codePointAt, value, [0]) as number) <= 0xffff)
  return (
    nonLiteral &&
    (multipleCodePoints ||
      (sharedUnit && end - start === 1 && parts[start].type === 'plusSign'))
  )
}

function appendRange(
  target: NumberFormatPart[],
  parts: NumberFormatPart[],
  start: number,
  end: number,
  shared = false
): void {
  for (let i = start; i < end; i++) {
    const part = parts[i]
    setDataProperty(
      target,
      target.length,
      shared ? {type: part.type, value: part.value, source: 'shared'} : part
    )
  }
}

// ECMA-402 §16.5.20 requires unambiguous output from the private part list.
// https://tc39.es/ecma402/#sec-collapsenumberrange
// https://unicode.org/reports/tr35/tr35-numbers.html#Collapsing_Number_Ranges
export function CollapseNumberRange(
  _numberFormat: Intl.NumberFormat,
  result: NumberFormatPart[],
  _options: {
    getInternalSlots(nf: Intl.NumberFormat): NumberFormatInternal
  }
): NumberFormatPart[] {
  let separatorIndex = 0
  while (
    separatorIndex < result.length &&
    result[separatorIndex].source !== 'shared'
  )
    separatorIndex++
  if (separatorIndex === result.length) return result
  const endStart = separatorIndex + 1
  const aPrefix = prefixEnd(result, 0, separatorIndex)
  const bPrefix = prefixEnd(result, endStart, result.length)
  const aSuffix = suffixStart(result, 0, separatorIndex)
  const bSuffix = suffixStart(result, endStart, result.length)

  // An affix-only endpoint carries its meaning in that affix. Keep both
  // endpoints intact if collapsing would leave either without a numeric core.
  let canShare = aPrefix < aSuffix && bPrefix < bSuffix
  for (let i = 0; canShare && i < result.length; i++) {
    if (i === separatorIndex) continue
    const part = result[i]
    if (
      part.type === 'literal' &&
      (apply(indexOf, part.value, ['(']) >= 0 ||
        apply(indexOf, part.value, [')']) >= 0)
    )
      canShare = false
  }

  const collapseSuffix =
    canShare &&
    canCollapse(result, aSuffix, separatorIndex, bSuffix, result.length)
  let sharedUnit = false
  for (let i = aSuffix; collapseSuffix && i < separatorIndex; i++) {
    const type = result[i].type
    if (type === 'currency' || type === 'unit' || type === 'percentSign') {
      sharedUnit = true
      break
    }
  }
  const collapsePrefix =
    canShare && canCollapse(result, 0, aPrefix, endStart, bPrefix, sharedUnit)
  const aStart = collapsePrefix ? aPrefix : 0
  const aEnd = collapseSuffix ? aSuffix : separatorIndex
  const bStart = collapsePrefix ? bPrefix : endStart
  const bEnd = collapseSuffix ? bSuffix : result.length

  let separator = result[separatorIndex].value
  if (
    aStart < aEnd &&
    bStart < bEnd &&
    (!isDigit(result[aEnd - 1].type) || !isDigit(result[bStart].type))
  ) {
    // Retain the locale's own whitespace before adding optional spacing.
    if (!separator || !isRangeSpace(separator[0])) separator = ' ' + separator
    if (!isRangeSpace(separator[separator.length - 1])) separator += ' '
  }

  const parts: NumberFormatPart[] = []
  if (collapsePrefix) appendRange(parts, result, 0, aPrefix, true)
  appendRange(parts, result, aStart, aEnd)
  setDataProperty(parts, parts.length, {
    type: 'literal',
    value: separator,
    source: 'shared',
  })
  appendRange(parts, result, bStart, bEnd)
  if (collapseSuffix) appendRange(parts, result, bSuffix, result.length, true)
  return parts
}

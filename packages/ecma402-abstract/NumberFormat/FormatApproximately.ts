import type {
  NumberFormatInternal,
  NumberFormatPart,
  NumberPatternPlan,
} from '#packages/ecma402-abstract/types/number.js'
import {getNumberPattern} from '#packages/ecma402-abstract/NumberFormat/number-patterns.js'
import {setDataProperty} from '#packages/ecma262-abstract/intrinsics.js'

export interface ApproximateStyle {
  pattern: string
  sign: number
}

function isNumberPart(type: NumberFormatPart['type']): boolean {
  switch (type) {
    case 'integer':
    case 'group':
    case 'decimal':
    case 'fraction':
    case 'exponentSeparator':
    case 'exponentMinusSign':
    case 'exponentInteger':
    case 'compact':
    case 'nan':
    case 'infinity':
      return true
    default:
      return false
  }
}

function findPart(
  parts: readonly NumberFormatPart[],
  token: NumberPatternPlan['parts'][number],
  start: number
): number {
  for (let i = start; i < parts.length; i++) {
    const part = parts[i]
    if (
      token[0] === 'number'
        ? isNumberPart(part.type)
        : token[0] === part.type &&
          (token[0] !== 'literal' || token[1] === part.value)
    )
      return i
  }
  return -1
}

// ECMA-402 §16.5.19 steps 1–3 insert a sign into the existing endpoint parts.
// https://tc39.es/ecma402/#sec-formatapproximately
// https://unicode.org/reports/tr35/tr35-numbers.html#Approximate_Number_Formatting
export function FormatApproximately(
  internalSlots: NumberFormatInternal,
  parts: NumberFormatPart[],
  {pattern, sign}: ApproximateStyle
): NumberFormatPart[] {
  const {numbers} = internalSlots.dataLocaleData
  const {approximatelySign} =
    numbers.symbols[internalSlots.numberingSystem] ||
    numbers.symbols[numbers.nu[0]]
  if (!approximatelySign) return parts

  // The approximate CLDR plan supplies the position. Match its surrounding
  // tokens to the rendered endpoint so spacing and other parts stay intact.
  const tokens = getNumberPattern(numbers, pattern, false, sign, true).parts
  let start = 0
  let index = 0
  for (
    ;
    index < tokens.length && tokens[index][0] !== 'approximatelySign';
    index++
  ) {
    const token = tokens[index]
    const part = findPart(parts, token, start)
    if (part < 0) continue
    start = part + 1
    if (token[0] === 'number') {
      while (start < parts.length && isNumberPart(parts[start].type)) start++
    }
  }
  let position = index < tokens.length ? start : 0
  for (index++; index < tokens.length; index++) {
    const part = findPart(parts, tokens[index], start)
    if (part >= 0) {
      position = part
      break
    }
  }
  const result: NumberFormatPart[] = []
  for (let i = 0; i <= parts.length; i++) {
    if (i === position)
      setDataProperty(result, result.length, {
        type: 'approximatelySign',
        value: approximatelySign,
      })
    if (i < parts.length) setDataProperty(result, result.length, parts[i])
  }
  return result
}

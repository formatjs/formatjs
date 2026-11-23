import type {IntlMathematicalValue} from '#packages/ecma402-abstract/ToIntlMathematicalValue.js'
import type {Decimal} from '@formatjs/bigdecimal'
import {
  type NumberFormatInternal,
  type NumberFormatPart,
} from '#packages/ecma402-abstract/types/number.js'
import {PartitionNumberPattern} from '#packages/ecma402-abstract/NumberFormat/PartitionNumberPattern.js'

export function joinNumberParts(parts: readonly NumberFormatPart[]): string {
  let result = ''
  for (let index = 0; index < parts.length; index++) {
    result += parts[index].value
  }
  return result
}

// ECMA-402 §16.5.5 https://tc39.es/ecma402/#sec-formatnumber
export function FormatNumeric(
  internalSlots: NumberFormatInternal,
  x: Decimal | IntlMathematicalValue
): string {
  return joinNumberParts(PartitionNumberPattern(internalSlots, x))
}

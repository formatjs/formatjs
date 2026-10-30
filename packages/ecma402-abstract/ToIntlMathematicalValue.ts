import {Decimal} from '@formatjs/bigdecimal'
import {ToPrimitive} from '#packages/ecma262-abstract/ToPrimitive.js'

/**
 * https://tc39.es/ecma402/#sec-tointlmathematicalvalue
 * Converts input to a mathematical value, supporting BigInt
 */
export function ToIntlMathematicalValue(input: unknown): Decimal {
  // Handle BigInt directly before ToPrimitive, since ToPrimitive doesn't
  // handle bigint in its type signature (though the spec says it should return it as-is)
  if (typeof input === 'bigint') {
    return new Decimal(input.toString())
  }

  let primValue = ToPrimitive(input, 'number')

  // ECMA-402 §16.5.16, step 4.a: ToNumber rejects Symbol primitives.
  // Keep this error outside the invalid numeric string fallback below.
  // https://tc39.es/ecma402/#sec-tointlmathematicalvalue
  // https://github.com/tc39/ecma402/blob/b1c961988b9a07894b1dc3dc2b5626ea48387d61/spec/numberformat.html#L1652-L1657
  if (typeof primValue === 'symbol') {
    throw new TypeError('Cannot convert a Symbol value to a number')
  }

  if (typeof primValue === 'string') {
    // Steps 5–10: validate StringNumericLiteral and clamp rounded zero/infinity,
    // while retaining the original finite decimal's exact mathematical value.
    // https://github.com/tc39/ecma402/blob/b1c961988b9a07894b1dc3dc2b5626ea48387d61/spec/numberformat.html#L1660-L1670
    const rounded = +primValue
    if (
      rounded !== rounded ||
      rounded === Infinity ||
      rounded === -Infinity ||
      rounded === 0
    )
      return new Decimal(rounded)
    const text = primValue.trim()
    // BigInt parses radix integers exactly, including beyond Number precision.
    if (/^0[xob]/i.test(text)) return new Decimal(BigInt(text))
    primValue = text
  }

  // Handle other primitive types
  if (primValue === undefined) {
    return new Decimal(NaN)
  }
  if (primValue === true) {
    return new Decimal(1)
  }
  if (primValue === false) {
    return new Decimal(0)
  }
  if (primValue === null) {
    return new Decimal(0)
  }

  // Try to convert to Decimal (handles numbers and strings)
  try {
    return new Decimal(primValue as any)
  } catch {
    return new Decimal(NaN)
  }
}

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

import {Decimal} from 'decimal.js'
import {ToPrimitive} from './262.js'

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

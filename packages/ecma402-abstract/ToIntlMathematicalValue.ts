import {
  TypeErrorConstructor,
  bigIntFrom,
  mathMax,
  mathMin,
  numberIsFinite,
} from '#packages/ecma262-abstract/intrinsics.js'
import {Decimal} from '@formatjs/bigdecimal'
import {ToPrimitive} from '#packages/ecma262-abstract/ToPrimitive.js'

export interface IntlMathematicalValue {
  value: Decimal
  stringDigitCount: number
  stringFractionDigitCount: number
}

const apply = Reflect.apply
const trim = String.prototype.trim
const slice = String.prototype.slice

// ECMA-402 §16.5.15: convert with the number hint and preserve exact inputs.
// https://tc39.es/ecma402/#sec-tointlmathematicalvalue
export function ToIntlMathematicalValue(input: unknown): IntlMathematicalValue {
  const primitive: unknown = ToPrimitive(input, 'number')
  let stringDigitCount = 0
  let stringFractionDigitCount = 0
  if (typeof primitive === 'bigint') {
    return {
      value: new Decimal(primitive),
      stringDigitCount,
      stringFractionDigitCount,
    }
  }
  if (typeof primitive === 'symbol') {
    throw new TypeErrorConstructor('Cannot convert a Symbol value to a number')
  }
  const rounded = +(primitive as any)
  let exact: number | string | bigint = rounded
  if (typeof primitive === 'string' && rounded === rounded) {
    // ECMA-402 §16.5.14 reads a private StringNumericLiteral. Scan the
    // classified string without invoking RegExp or changing its legacy statics.
    // https://tc39.es/ecma402/#sec-runtime-semantics-stringintlmv
    const text = apply(trim, primitive, []) as string
    const first = text.length > 0 ? text[0] : ''
    const prefix = first === '0' && text.length > 1 ? text[1] : ''
    const base =
      prefix === 'x' ||
      prefix === 'X' ||
      prefix === 'o' ||
      prefix === 'O' ||
      prefix === 'b' ||
      prefix === 'B'
    const finite = numberIsFinite(rounded)
    if (base) {
      if (finite && rounded !== 0) exact = bigIntFrom(text)
    } else {
      const start = first === '+' || first === '-' ? 1 : 0
      if (start < text.length && text[start] !== 'I') {
        let fraction = 0
        let exponent = 0
        let fractional = false
        for (let index = start; index < text.length; index++) {
          const digit = text[index]
          if (digit === 'e' || digit === 'E') {
            exponent = +(apply(slice, text, [index + 1]) as string)
            break
          }
          if (digit === '.') {
            fractional = true
            continue
          }
          if (fractional) fraction++
          if (stringDigitCount || digit !== '0') stringDigitCount++
        }
        stringDigitCount = finite ? stringDigitCount || 1 + fraction : 0
        stringFractionDigitCount = mathMin(
          9007199254740991,
          mathMax(0, fraction - exponent)
        )
        // ECMA-402 §16.5.15 step 9 clamps overflow and underflow. Keep the
        // original decimal for other values to avoid a binary precision loss.
        if (finite && rounded !== 0) exact = text
      }
    }
  }
  return {value: new Decimal(exact), stringDigitCount, stringFractionDigitCount}
}

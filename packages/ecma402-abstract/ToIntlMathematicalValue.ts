import {Decimal} from '@formatjs/bigdecimal'
import {ToPrimitive} from '#packages/ecma262-abstract/ToPrimitive.js'

export interface IntlMathematicalValue {
  value: Decimal
  stringDigitCount: number
  stringFractionDigitCount: number
}

/** https://tc39.es/proposal-intl-keep-trailing-zeros/#sec-tointlmathematicalvalue */
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
    throw new TypeError('Cannot convert a Symbol value to a number')
  }
  const rounded = +(primitive as any)
  let value = new Decimal(rounded)
  if (typeof primitive === 'string' && !Number.isNaN(rounded)) {
    const text = primitive.trim()
    const parts = /^([+-]?)(\d*)(?:\.(\d*))?(?:e([+-]?\d+))?$/i.exec(text)
    if (parts && (parts[2] || parts[3])) {
      const fraction = parts[3] || ''
      const digits = (parts[2] + fraction).replace(/^0+/, '')
      stringDigitCount = digits ? digits.length : 1 + fraction.length
      // Counts beyond representable integer precision cannot affect bounded rounding.
      stringFractionDigitCount = Math.min(
        Number.MAX_SAFE_INTEGER,
        Math.max(0, fraction.length - Number(parts[4] || 0))
      )
    }
    if (!Number.isFinite(rounded)) {
      stringDigitCount = 0
    } else if (rounded !== 0) {
      value = /^0[xob]/i.test(text)
        ? new Decimal(BigInt(text))
        : new Decimal(text)
    }
  }
  return {value, stringDigitCount, stringFractionDigitCount}
}

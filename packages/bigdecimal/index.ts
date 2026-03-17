// Division precision: 40 extra digits (matches decimal.js default)
const DIV_PRECISION = 40

const enum SpecialValue {
  NONE = 0,
  NAN = 1,
  POSITIVE_INFINITY = 2,
  NEGATIVE_INFINITY = 3,
}

function removeTrailingZeros(
  mantissa: bigint,
  exponent: number
): [bigint, number] {
  if (mantissa === 0n) return [0n, 0]
  while (mantissa % 10n === 0n) {
    mantissa /= 10n
    exponent++
  }
  return [mantissa, exponent]
}

function bigintAbs(n: bigint): bigint {
  return n < 0n ? -n : n
}

function digitCount(n: bigint): number {
  if (n === 0n) return 1
  if (n < 0n) n = -n
  let count = 0
  // Fast path: skip 15 digits at a time
  const big15 = 1000000000000000n
  while (n >= big15) {
    n /= big15
    count += 15
  }
  // Remaining digits
  let r = Number(n)
  while (r >= 1) {
    r /= 10
    count++
  }
  return count
}

const TEN_BIGINT = 10n

function bigintPow10(n: number): bigint {
  if (n <= 0) return 1n
  // Build up via repeated squaring
  let result = 1n
  let base = TEN_BIGINT
  let exp = n
  while (exp > 0) {
    if (exp & 1) result *= base
    base *= base
    exp >>= 1
  }
  return result
}

function parseDecimalString(s: string): {
  mantissa: bigint
  exponent: number
  special: SpecialValue
  negativeZero: boolean
} {
  s = s.trim()

  if (s === 'NaN') {
    return {
      mantissa: 0n,
      exponent: 0,
      special: SpecialValue.NAN,
      negativeZero: false,
    }
  }
  if (s === 'Infinity' || s === '+Infinity') {
    return {
      mantissa: 0n,
      exponent: 0,
      special: SpecialValue.POSITIVE_INFINITY,
      negativeZero: false,
    }
  }
  if (s === '-Infinity') {
    return {
      mantissa: 0n,
      exponent: 0,
      special: SpecialValue.NEGATIVE_INFINITY,
      negativeZero: false,
    }
  }

  let negative = false
  let idx = 0
  if (s[idx] === '-') {
    negative = true
    idx++
  } else if (s[idx] === '+') {
    idx++
  }

  // Split by 'e' or 'E' for scientific notation
  let eIdx = s.indexOf('e', idx)
  if (eIdx === -1) eIdx = s.indexOf('E', idx)
  let sciExp = 0
  let numPart: string
  if (eIdx !== -1) {
    sciExp = parseInt(s.substring(eIdx + 1), 10)
    numPart = s.substring(idx, eIdx)
  } else {
    numPart = s.substring(idx)
  }

  // Split by decimal point
  const dotIdx = numPart.indexOf('.')
  let intPart: string
  let fracPart: string
  if (dotIdx !== -1) {
    intPart = numPart.substring(0, dotIdx)
    fracPart = numPart.substring(dotIdx + 1)
  } else {
    intPart = numPart
    fracPart = ''
  }

  // Combine into mantissa
  const combined = intPart + fracPart
  const exponent = sciExp - fracPart.length

  if (combined === '' || combined === '0' || /^0+$/.test(combined)) {
    return {
      mantissa: 0n,
      exponent: 0,
      special: SpecialValue.NONE,
      negativeZero: negative,
    }
  }

  let mantissa = BigInt(combined)
  if (negative) mantissa = -mantissa

  const [normMantissa, normExponent] = removeTrailingZeros(mantissa, exponent)
  return {
    mantissa: normMantissa,
    exponent: normExponent,
    special: SpecialValue.NONE,
    negativeZero: false,
  }
}

export class BigDecimal {
  readonly _mantissa: bigint
  readonly _exponent: number
  readonly _special: SpecialValue
  readonly _negativeZero: boolean

  constructor(value: number | string | bigint) {
    if (typeof value === 'bigint') {
      const [m, e] = removeTrailingZeros(value, 0)
      this._mantissa = m
      this._exponent = e
      this._special = SpecialValue.NONE
      this._negativeZero = false
      return
    }

    if (typeof value === 'number') {
      if (Number.isNaN(value)) {
        this._mantissa = 0n
        this._exponent = 0
        this._special = SpecialValue.NAN
        this._negativeZero = false
        return
      }
      if (value === Infinity) {
        this._mantissa = 0n
        this._exponent = 0
        this._special = SpecialValue.POSITIVE_INFINITY
        this._negativeZero = false
        return
      }
      if (value === -Infinity) {
        this._mantissa = 0n
        this._exponent = 0
        this._special = SpecialValue.NEGATIVE_INFINITY
        this._negativeZero = false
        return
      }
      if (value === 0) {
        this._mantissa = 0n
        this._exponent = 0
        this._special = SpecialValue.NONE
        this._negativeZero = Object.is(value, -0)
        return
      }
      // Convert via string to preserve exact decimal representation
      value = String(value)
    }

    const parsed = parseDecimalString(value)
    this._mantissa = parsed.mantissa
    this._exponent = parsed.exponent
    this._special = parsed.special
    this._negativeZero = parsed.negativeZero
  }

  // Private constructor for internal use
  private static _create(
    mantissa: bigint,
    exponent: number,
    special: SpecialValue,
    negativeZero: boolean
  ): BigDecimal {
    const bd = Object.create(BigDecimal.prototype) as BigDecimal
    ;(bd as any)._mantissa = mantissa
    ;(bd as any)._exponent = exponent
    ;(bd as any)._special = special
    ;(bd as any)._negativeZero = negativeZero
    return bd
  }

  // Auto-coerce to BigDecimal for decimal.js compat
  private static _coerce(v: BigDecimal | number | string | bigint): BigDecimal {
    return v instanceof BigDecimal ? v : new BigDecimal(v)
  }

  // --- Arithmetic ---

  times(y: BigDecimal | number | string | bigint): BigDecimal {
    const other = BigDecimal._coerce(y)
    if (this._special || other._special) {
      return this._specialArith(other, 'times')
    }
    if (this._mantissa === 0n || other._mantissa === 0n) {
      const negZero = this._isSignNegative()
        ? !other._isSignNegative()
        : other._isSignNegative()
      return BigDecimal._create(0n, 0, SpecialValue.NONE, negZero)
    }
    const m = this._mantissa * other._mantissa
    const e = this._exponent + other._exponent
    const [nm, ne] = removeTrailingZeros(m, e)
    return BigDecimal._create(nm, ne, SpecialValue.NONE, false)
  }

  div(y: BigDecimal | number | string | bigint): BigDecimal {
    const other = BigDecimal._coerce(y)
    if (this._special || other._special) {
      return this._specialArith(other, 'div')
    }
    if (other._mantissa === 0n) {
      if (this._mantissa === 0n) {
        return BigDecimal._create(0n, 0, SpecialValue.NAN, false)
      }
      const neg = this._isSignNegative() !== other._isSignNegative()
      return BigDecimal._create(
        0n,
        0,
        neg ? SpecialValue.NEGATIVE_INFINITY : SpecialValue.POSITIVE_INFINITY,
        false
      )
    }
    if (this._mantissa === 0n) {
      const negZero = this._isSignNegative() !== other._isSignNegative()
      return BigDecimal._create(0n, 0, SpecialValue.NONE, negZero)
    }
    // Scale numerator for precision
    const scaledNumerator = this._mantissa * bigintPow10(DIV_PRECISION)
    const quotient = scaledNumerator / other._mantissa
    const newExponent = this._exponent - other._exponent - DIV_PRECISION
    const [nm, ne] = removeTrailingZeros(quotient, newExponent)
    return BigDecimal._create(nm, ne, SpecialValue.NONE, false)
  }

  plus(y: BigDecimal | number | string | bigint): BigDecimal {
    const other = BigDecimal._coerce(y)
    if (this._special || other._special) {
      return this._specialArith(other, 'plus')
    }
    if (this._mantissa === 0n && other._mantissa === 0n) {
      // -0 + -0 = -0, otherwise 0
      const negZero = this._negativeZero && other._negativeZero
      return BigDecimal._create(0n, 0, SpecialValue.NONE, negZero)
    }
    if (this._mantissa === 0n) return other
    if (other._mantissa === 0n) return this

    // Align exponents
    let m1 = this._mantissa
    let m2 = other._mantissa
    const e1 = this._exponent
    const e2 = other._exponent
    const minE = Math.min(e1, e2)
    if (e1 > minE) m1 *= bigintPow10(e1 - minE)
    if (e2 > minE) m2 *= bigintPow10(e2 - minE)

    const sum = m1 + m2
    if (sum === 0n) {
      return BigDecimal._create(0n, 0, SpecialValue.NONE, false)
    }
    const [nm, ne] = removeTrailingZeros(sum, minE)
    return BigDecimal._create(nm, ne, SpecialValue.NONE, false)
  }

  minus(y: BigDecimal | number | string | bigint): BigDecimal {
    return this.plus(BigDecimal._coerce(y).negated())
  }

  mod(y: BigDecimal | number | string | bigint): BigDecimal {
    const other = BigDecimal._coerce(y)
    if (this._special || other._special) {
      if (
        this._special === SpecialValue.NAN ||
        other._special === SpecialValue.NAN
      ) {
        return BigDecimal._create(0n, 0, SpecialValue.NAN, false)
      }
      if (
        this._special === SpecialValue.POSITIVE_INFINITY ||
        this._special === SpecialValue.NEGATIVE_INFINITY
      ) {
        return BigDecimal._create(0n, 0, SpecialValue.NAN, false)
      }
      if (
        other._special === SpecialValue.POSITIVE_INFINITY ||
        other._special === SpecialValue.NEGATIVE_INFINITY
      ) {
        return this
      }
    }
    if (other._mantissa === 0n) {
      return BigDecimal._create(0n, 0, SpecialValue.NAN, false)
    }
    if (this._mantissa === 0n) {
      return this
    }

    // Align exponents
    let m1 = this._mantissa
    let m2 = other._mantissa
    const e1 = this._exponent
    const e2 = other._exponent
    const minE = Math.min(e1, e2)
    if (e1 > minE) m1 *= bigintPow10(e1 - minE)
    if (e2 > minE) m2 *= bigintPow10(e2 - minE)

    const remainder = m1 % m2
    if (remainder === 0n) {
      return BigDecimal._create(0n, 0, SpecialValue.NONE, false)
    }
    const [nm, ne] = removeTrailingZeros(remainder, minE)
    return BigDecimal._create(nm, ne, SpecialValue.NONE, false)
  }

  abs(): BigDecimal {
    if (this._special === SpecialValue.NAN) return this
    if (this._special === SpecialValue.NEGATIVE_INFINITY) {
      return BigDecimal._create(0n, 0, SpecialValue.POSITIVE_INFINITY, false)
    }
    return BigDecimal._create(
      bigintAbs(this._mantissa),
      this._exponent,
      this._special,
      false
    )
  }

  negated(): BigDecimal {
    if (this._special === SpecialValue.NAN) return this
    if (this._special === SpecialValue.POSITIVE_INFINITY) {
      return BigDecimal._create(0n, 0, SpecialValue.NEGATIVE_INFINITY, false)
    }
    if (this._special === SpecialValue.NEGATIVE_INFINITY) {
      return BigDecimal._create(0n, 0, SpecialValue.POSITIVE_INFINITY, false)
    }
    if (this._mantissa === 0n) {
      return BigDecimal._create(0n, 0, SpecialValue.NONE, !this._negativeZero)
    }
    return BigDecimal._create(
      -this._mantissa,
      this._exponent,
      SpecialValue.NONE,
      false
    )
  }

  pow(n: number): BigDecimal {
    if (this._special === SpecialValue.NAN) return this
    if (n === 0) return new BigDecimal(1)
    if (n < 0) {
      return new BigDecimal(1).div(this.pow(-n))
    }
    if (this._special === SpecialValue.POSITIVE_INFINITY) return this
    if (this._special === SpecialValue.NEGATIVE_INFINITY) {
      return n % 2 === 0
        ? BigDecimal._create(0n, 0, SpecialValue.POSITIVE_INFINITY, false)
        : this
    }
    if (this._mantissa === 0n) return new BigDecimal(0)
    const m = this._mantissa ** BigInt(n)
    const e = this._exponent * n
    const [nm, ne] = removeTrailingZeros(m, e)
    return BigDecimal._create(nm, ne, SpecialValue.NONE, false)
  }

  floor(): BigDecimal {
    if (this._special !== SpecialValue.NONE) return this
    if (this._mantissa === 0n) return this
    if (this._exponent >= 0) return this // already an integer

    const divisor = bigintPow10(-this._exponent)
    const m = this._mantissa
    let q = m / divisor

    // Floor: round toward -infinity
    // For negative numbers with remainder, subtract 1
    if (m < 0n && m % divisor !== 0n) {
      q -= 1n
    }

    if (q === 0n) {
      // Check if we should return -0
      const negZero = this._mantissa < 0n
      return BigDecimal._create(0n, 0, SpecialValue.NONE, negZero)
    }
    const [nm, ne] = removeTrailingZeros(q, 0)
    return BigDecimal._create(nm, ne, SpecialValue.NONE, false)
  }

  ceil(): BigDecimal {
    if (this._special !== SpecialValue.NONE) return this
    if (this._mantissa === 0n) return this
    if (this._exponent >= 0) return this // already an integer

    const divisor = bigintPow10(-this._exponent)
    const m = this._mantissa
    let q = m / divisor

    // Ceil: round toward +infinity
    // For positive numbers with remainder, add 1
    if (m > 0n && m % divisor !== 0n) {
      q += 1n
    }

    if (q === 0n) {
      return BigDecimal._create(0n, 0, SpecialValue.NONE, false)
    }
    const [nm, ne] = removeTrailingZeros(q, 0)
    return BigDecimal._create(nm, ne, SpecialValue.NONE, false)
  }

  log(base: number): BigDecimal {
    if (this._special === SpecialValue.NAN) return this
    if (this._special === SpecialValue.NEGATIVE_INFINITY) {
      return BigDecimal._create(0n, 0, SpecialValue.NAN, false)
    }
    if (this._special === SpecialValue.POSITIVE_INFINITY) {
      return BigDecimal._create(0n, 0, SpecialValue.POSITIVE_INFINITY, false)
    }
    if (this._mantissa < 0n) {
      return BigDecimal._create(0n, 0, SpecialValue.NAN, false)
    }
    if (this._mantissa === 0n) {
      return BigDecimal._create(0n, 0, SpecialValue.NEGATIVE_INFINITY, false)
    }

    if (base === 10) {
      return this._log10()
    }

    // General case: log_b(x) = log10(x) / log10(b)
    const log10x = this._log10()
    const log10b = new BigDecimal(Math.log10(base))
    return log10x.div(log10b)
  }

  private _log10(): BigDecimal {
    // log10(mantissa * 10^exponent) = log10(mantissa) + exponent
    const absMantissa = bigintAbs(this._mantissa)
    const digits = digitCount(absMantissa)
    // integerPart = digits - 1 + exponent (this is floor(log10(x)) for exact powers)

    // For high precision: compute log10 of the mantissa
    // Normalize mantissa to [1, 10) by dividing by 10^(digits-1)
    // Then log10(mantissa) = (digits-1) + log10(normalized)
    // Total = (digits-1) + log10(normalized) + exponent

    // Get the leading ~17 significant digits for Math.log10
    // Use log laws: log10(leading × 10^shift) = log10(leading) + shift
    // This avoids Math.pow(10, shift) overflow for shift > 308
    let log10Mantissa: number
    if (digits <= 15) {
      log10Mantissa = Math.log10(Number(absMantissa))
    } else {
      const shift = digits - 17
      const leading = absMantissa / bigintPow10(shift)
      log10Mantissa = Math.log10(Number(leading)) + shift
    }

    // Total log10 = log10(mantissa) + exponent
    const totalLog10 = log10Mantissa + this._exponent

    // Convert to BigDecimal with ~18 digits of precision
    // We use String conversion to preserve precision
    return new BigDecimal(totalLog10)
  }

  // --- Comparison ---

  eq(y: BigDecimal | number | string | bigint): boolean {
    const other = BigDecimal._coerce(y)
    if (
      this._special === SpecialValue.NAN ||
      other._special === SpecialValue.NAN
    )
      return false
    if (this._special !== other._special) return false
    if (this._special !== SpecialValue.NONE) return true // both same special
    if (this._mantissa === 0n && other._mantissa === 0n) return true // 0 == -0
    return (
      this._mantissa === other._mantissa && this._exponent === other._exponent
    )
  }

  private _compareTo(other: BigDecimal): number {
    // Returns -1, 0, 1
    if (
      this._special === SpecialValue.NAN ||
      other._special === SpecialValue.NAN
    ) {
      return NaN
    }

    // Handle infinities
    if (this._special === SpecialValue.POSITIVE_INFINITY) {
      return other._special === SpecialValue.POSITIVE_INFINITY ? 0 : 1
    }
    if (this._special === SpecialValue.NEGATIVE_INFINITY) {
      return other._special === SpecialValue.NEGATIVE_INFINITY ? 0 : -1
    }
    if (other._special === SpecialValue.POSITIVE_INFINITY) return -1
    if (other._special === SpecialValue.NEGATIVE_INFINITY) return 1

    // Both finite - treat zeros as equal regardless of sign
    const thisZero = this._mantissa === 0n
    const otherZero = other._mantissa === 0n
    if (thisZero && otherZero) return 0
    if (thisZero) return other._mantissa > 0n ? -1 : 1
    if (otherZero) return this._mantissa > 0n ? 1 : -1

    // Different signs
    const thisNeg = this._mantissa < 0n
    const otherNeg = other._mantissa < 0n
    if (thisNeg !== otherNeg) return thisNeg ? -1 : 1

    // Same sign - align exponents and compare
    let m1 = this._mantissa
    let m2 = other._mantissa
    const e1 = this._exponent
    const e2 = other._exponent
    const minE = Math.min(e1, e2)
    if (e1 > minE) m1 *= bigintPow10(e1 - minE)
    if (e2 > minE) m2 *= bigintPow10(e2 - minE)

    if (m1 < m2) return -1
    if (m1 > m2) return 1
    return 0
  }

  lessThan(y: BigDecimal | number | string | bigint): boolean {
    const c = this._compareTo(BigDecimal._coerce(y))
    return c === -1
  }

  greaterThan(y: BigDecimal | number | string | bigint): boolean {
    const c = this._compareTo(BigDecimal._coerce(y))
    return c === 1
  }

  lessThanOrEqualTo(y: BigDecimal | number | string | bigint): boolean {
    const c = this._compareTo(BigDecimal._coerce(y))
    return c === 0 || c === -1
  }

  greaterThanOrEqualTo(y: BigDecimal | number | string | bigint): boolean {
    const c = this._compareTo(BigDecimal._coerce(y))
    return c === 0 || c === 1
  }

  // --- Queries ---

  isZero(): boolean {
    return this._special === SpecialValue.NONE && this._mantissa === 0n
  }

  isNaN(): boolean {
    return this._special === SpecialValue.NAN
  }

  isFinite(): boolean {
    return this._special === SpecialValue.NONE
  }

  isNegative(): boolean {
    if (this._special === SpecialValue.NAN) return false
    if (this._special === SpecialValue.NEGATIVE_INFINITY) return true
    if (this._special === SpecialValue.POSITIVE_INFINITY) return false
    if (this._mantissa === 0n) return this._negativeZero
    return this._mantissa < 0n
  }

  isPositive(): boolean {
    if (this._special === SpecialValue.NAN) return false
    if (this._special === SpecialValue.POSITIVE_INFINITY) return true
    if (this._special === SpecialValue.NEGATIVE_INFINITY) return false
    if (this._mantissa === 0n) return !this._negativeZero
    return this._mantissa > 0n
  }

  isInteger(): boolean {
    if (this._special !== SpecialValue.NONE) return false
    if (this._mantissa === 0n) return true
    return this._exponent >= 0
  }

  // --- Conversion ---

  toJSON(): string {
    return this.toString()
  }

  toNumber(): number {
    if (this._special === SpecialValue.NAN) return NaN
    if (this._special === SpecialValue.POSITIVE_INFINITY) return Infinity
    if (this._special === SpecialValue.NEGATIVE_INFINITY) return -Infinity
    if (this._mantissa === 0n) return this._negativeZero ? -0 : 0
    return Number(this.toString())
  }

  toString(): string {
    if (this._special === SpecialValue.NAN) return 'NaN'
    if (this._special === SpecialValue.POSITIVE_INFINITY) return 'Infinity'
    if (this._special === SpecialValue.NEGATIVE_INFINITY) return '-Infinity'
    if (this._mantissa === 0n) return '0'

    const negative = this._mantissa < 0n
    const absStr = bigintAbs(this._mantissa).toString()
    const prefix = negative ? '-' : ''

    if (this._exponent === 0) {
      return prefix + absStr
    }

    if (this._exponent > 0) {
      // Append zeros
      return prefix + absStr + '0'.repeat(this._exponent)
    }

    // Negative exponent: insert decimal point
    const decimalPlaces = -this._exponent
    if (decimalPlaces < absStr.length) {
      const intPart = absStr.slice(0, absStr.length - decimalPlaces)
      const fracPart = absStr.slice(absStr.length - decimalPlaces)
      return prefix + intPart + '.' + fracPart
    } else {
      // Need leading zeros: 0.000...digits
      const leadingZeros = decimalPlaces - absStr.length
      return prefix + '0.' + '0'.repeat(leadingZeros) + absStr
    }
  }

  // --- Static ---

  static pow(base: number | BigDecimal, exp: number | BigDecimal): BigDecimal {
    const n = typeof exp === 'number' ? exp : exp.toNumber()
    if (typeof base === 'number' && base === 10) {
      // Trivial: 10^n = mantissa=1, exponent=n
      return BigDecimal._create(1n, n, SpecialValue.NONE, false)
    }
    const bd = base instanceof BigDecimal ? base : new BigDecimal(base)
    return bd.pow(n)
  }

  static set(_config: Record<string, unknown>): void {
    // No-op: only used for { toExpPos: 100 } in ecma402-abstract
  }

  // --- Internal helpers ---

  private _isSignNegative(): boolean {
    if (this._special === SpecialValue.NEGATIVE_INFINITY) return true
    if (this._mantissa < 0n) return true
    if (this._mantissa === 0n) return this._negativeZero
    return false
  }

  private _specialArith(
    other: BigDecimal,
    op: 'times' | 'div' | 'plus'
  ): BigDecimal {
    const a = this._special
    const b = other._special

    // NaN propagates
    if (a === SpecialValue.NAN || b === SpecialValue.NAN) {
      return BigDecimal._create(0n, 0, SpecialValue.NAN, false)
    }

    const aNeg = this._isSignNegative()
    const bNeg = other._isSignNegative()
    const aInf =
      a === SpecialValue.POSITIVE_INFINITY ||
      a === SpecialValue.NEGATIVE_INFINITY
    const bInf =
      b === SpecialValue.POSITIVE_INFINITY ||
      b === SpecialValue.NEGATIVE_INFINITY

    if (op === 'times') {
      if (aInf || bInf) {
        if (
          (aInf && other._mantissa === 0n && !bInf) ||
          (bInf && this._mantissa === 0n && !aInf)
        ) {
          return BigDecimal._create(0n, 0, SpecialValue.NAN, false)
        }
        const neg = aNeg !== bNeg
        return BigDecimal._create(
          0n,
          0,
          neg ? SpecialValue.NEGATIVE_INFINITY : SpecialValue.POSITIVE_INFINITY,
          false
        )
      }
    }

    if (op === 'div') {
      if (aInf && bInf) {
        return BigDecimal._create(0n, 0, SpecialValue.NAN, false)
      }
      if (aInf) {
        const neg = aNeg !== bNeg
        return BigDecimal._create(
          0n,
          0,
          neg ? SpecialValue.NEGATIVE_INFINITY : SpecialValue.POSITIVE_INFINITY,
          false
        )
      }
      if (bInf) {
        const negZero = aNeg !== bNeg
        return BigDecimal._create(0n, 0, SpecialValue.NONE, negZero)
      }
    }

    if (op === 'plus') {
      if (aInf && bInf) {
        if (aNeg !== bNeg) {
          return BigDecimal._create(0n, 0, SpecialValue.NAN, false)
        }
        return this
      }
      if (aInf) return this
      if (bInf) return other
    }

    // One is special (infinity), one is finite - shouldn't reach here for plus
    // but handle edge cases
    return BigDecimal._create(0n, 0, SpecialValue.NAN, false)
  }
}

// Alias for drop-in decimal.js compatibility
export {BigDecimal as Decimal}
export default BigDecimal

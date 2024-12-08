import Decimal from 'decimal.js'
import {TEN} from '../constants'
import {RawNumberFormatResult, UnsignedRoundingModeType} from '../types/number'
import {repeat} from '../utils'
import {ApplyUnsignedRoundingMode} from './ApplyUnsignedRoundingMode'
Decimal.set({
  toExpPos: 100,
})
function ToRawFixedFn(n: Decimal, f: number) {
  return n.times(TEN.pow(-f))
}

function findN1R1(x: Decimal, f: number, roundingIncrement: number) {
  const nx = x.times(TEN.pow(f)).floor()
  const n1 = nx.div(roundingIncrement).floor().times(roundingIncrement)
  const r1 = ToRawFixedFn(n1, f)
  return {
    n1,
    r1,
  }
}

function findN2R2(x: Decimal, f: number, roundingIncrement: number) {
  const nx = x.times(TEN.pow(f)).ceil()
  const n2 = nx.div(roundingIncrement).ceil().times(roundingIncrement)
  const r2 = ToRawFixedFn(n2, f)
  return {
    n2,
    r2,
  }
}

/**
 * TODO: dedup with intl-pluralrules and support BigInt
 * https://tc39.es/ecma402/#sec-torawfixed
 * @param x a finite non-negative Number or BigInt
 * @param minFraction and integer between 0 and 20
 * @param maxFraction and integer between 0 and 20
 */
export function ToRawFixed(
  x: Decimal,
  minFraction: number,
  maxFraction: number,
  roundingIncrement: number,
  unsignedRoundingMode: UnsignedRoundingModeType
): RawNumberFormatResult {
  const f = maxFraction
  const {n1, r1} = findN1R1(x, f, roundingIncrement)
  const {n2, r2} = findN2R2(x, f, roundingIncrement)
  const r = ApplyUnsignedRoundingMode(x, r1, r2, unsignedRoundingMode)
  let n: Decimal, xFinal: Decimal
  let m: string
  if (r.eq(r1)) {
    n = n1
    xFinal = r1
  } else {
    n = n2
    xFinal = r2
  }
  if (n.isZero()) {
    m = '0'
  } else {
    m = n.toString()
  }
  let int
  if (f !== 0) {
    let k = m.length
    if (k <= f) {
      const z = repeat('0', f - k + 1)
      m = z + m
      k = f + 1
    }
    const a = m.slice(0, k - f)
    const b = m.slice(m.length - f)
    m = a + '.' + b
    int = a.length
  } else {
    int = m.length
  }
  let cut = maxFraction - minFraction
  while (cut > 0 && m[m.length - 1] === '0') {
    m = m.slice(0, m.length - 1)
    cut--
  }
  if (m[m.length - 1] === '\u002e') {
    m = m.slice(0, m.length - 1)
  }
  return {
    formattedString: m,
    roundedNumber: xFinal,
    integerDigitsCount: int,
    roundingMagnitude: -f,
  }
}

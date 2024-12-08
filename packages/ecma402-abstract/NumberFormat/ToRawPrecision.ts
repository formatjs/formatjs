import Decimal from 'decimal.js'
import {TEN, ZERO} from '../constants'
import {RawNumberFormatResult, UnsignedRoundingModeType} from '../types/number'
import {invariant, repeat} from '../utils'
import {ApplyUnsignedRoundingMode} from './ApplyUnsignedRoundingMode'

Decimal.set({
  toExpPos: 100,
})

function ToRawPrecisionFn(n: Decimal, e: Decimal, p: number) {
  invariant(
    TEN.pow(p - 1).lessThanOrEqualTo(n) && n.lessThan(TEN.pow(p)),
    `n should be in the range ${TEN.pow(p - 1)} <= n < ${TEN.pow(p)} but got ${n}`
  )
  // n * 10^(e - p + 1)
  return n.times(TEN.pow(e.minus(p).plus(1)))
}

function findN1E1R1(x: Decimal, p: number) {
  const maxN1 = TEN.pow(p)
  const minN1 = TEN.pow(p - 1)

  const maxE1 = x.div(minN1).log(10).plus(p).minus(1).ceil()

  for (let currentE1 = maxE1; ; currentE1 = currentE1.minus(1)) {
    let currentN1 = x.div(TEN.pow(currentE1.minus(p).plus(1))).floor()
    if (currentN1.lessThan(maxN1) && currentN1.greaterThanOrEqualTo(minN1)) {
      const currentR1 = ToRawPrecisionFn(currentN1, currentE1, p)
      if (currentR1.lessThanOrEqualTo(x)) {
        return {
          n1: currentN1,
          e1: currentE1,
          r1: currentR1,
        }
      }
    }
  }
}

function findN2E2R2(x: Decimal, p: number) {
  const maxN2 = TEN.pow(p)
  const minN2 = TEN.pow(p - 1)
  const minE2 = x.div(maxN2).log(10).plus(p).minus(1).floor()

  for (let currentE2 = minE2; ; currentE2 = currentE2.plus(1)) {
    let currentN2 = x.div(TEN.pow(currentE2.minus(p).plus(1))).ceil()
    if (currentN2.lessThan(maxN2) && currentN2.greaterThanOrEqualTo(minN2)) {
      const currentR2 = ToRawPrecisionFn(currentN2, currentE2, p)
      if (currentR2.greaterThanOrEqualTo(x)) {
        return {
          n2: currentN2,
          e2: currentE2,
          r2: currentR2,
        }
      }
    }
  }
}

export function ToRawPrecision(
  x: Decimal,
  minPrecision: number,
  maxPrecision: number,
  unsignedRoundingMode: UnsignedRoundingModeType
): RawNumberFormatResult {
  const p = maxPrecision
  let m: string
  let e: number
  let xFinal: Decimal
  if (x.isZero()) {
    m = repeat('0', p)
    e = 0
    xFinal = ZERO
  } else {
    const {n1, e1, r1} = findN1E1R1(x, p)
    const {n2, e2, r2} = findN2E2R2(x, p)
    let r = ApplyUnsignedRoundingMode(x, r1, r2, unsignedRoundingMode)
    let n
    if (r.eq(r1)) {
      n = n1
      e = e1.toNumber()
      xFinal = r1
    } else {
      n = n2
      e = e2.toNumber()
      xFinal = r2
    }
    m = n.toString()
  }
  let int
  if (e >= p - 1) {
    m = m + repeat('0', e - p + 1)
    int = e + 1
  } else if (e >= 0) {
    m = m.slice(0, e + 1) + '.' + m.slice(m.length - (p - (e + 1)))
    int = e + 1
  } else {
    invariant(e < 0, 'e should be less than 0')
    m = '0.' + repeat('0', -e - 1) + m
    int = 1
  }
  if (m.includes('.') && maxPrecision > minPrecision) {
    let cut = maxPrecision - minPrecision
    while (cut > 0 && m[m.length - 1] === '0') {
      m = m.slice(0, m.length - 1)
      cut--
    }
    if (m[m.length - 1] === '.') {
      m = m.slice(0, m.length - 1)
    }
  }
  return {
    formattedString: m,
    roundedNumber: xFinal,
    integerDigitsCount: int,
    roundingMagnitude: e,
  }
}

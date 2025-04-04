import Decimal from 'decimal.js'
import {ZERO} from '../constants'
import {RawNumberFormatResult, UnsignedRoundingModeType} from '../types/number'
import {invariant, repeat} from '../utils'
import {ApplyUnsignedRoundingMode} from './ApplyUnsignedRoundingMode'

//IMPL: Helper function to find n1, e1, and r1
function findN1E1R1(x: Decimal, p: number) {
  const maxN1 = Decimal.pow(10, p)
  const minN1 = Decimal.pow(10, p - 1)
  const maxE1 = x.div(minN1).log(10).plus(p).minus(1).ceil()

  let currentE1 = maxE1
  while (true) {
    let currentN1 = x.div(Decimal.pow(10, currentE1.minus(p).plus(1))).floor()
    if (currentN1.lessThan(maxN1) && currentN1.greaterThanOrEqualTo(minN1)) {
      const currentR1 = currentN1.times(
        Decimal.pow(10, currentE1.minus(p).plus(1))
      )
      if (currentR1.lessThanOrEqualTo(x)) {
        return {
          n1: currentN1,
          e1: currentE1,
          r1: currentR1,
        }
      }
    }
    currentE1 = currentE1.minus(1)
  }
}

//IMPL: Helper function to find n2, e2, and r2
function findN2E2R2(x: Decimal, p: number) {
  const maxN2 = Decimal.pow(10, p)
  const minN2 = Decimal.pow(10, p - 1)
  const minE2 = x.div(maxN2).log(10).plus(p).minus(1).floor()

  let currentE2 = minE2
  while (true) {
    let currentN2 = x.div(Decimal.pow(10, currentE2.minus(p).plus(1))).ceil()
    if (currentN2.lessThan(maxN2) && currentN2.greaterThanOrEqualTo(minN2)) {
      const currentR2 = currentN2.times(
        Decimal.pow(10, currentE2.minus(p).plus(1))
      )
      if (currentR2.greaterThanOrEqualTo(x)) {
        return {
          n2: currentN2,
          e2: currentE2,
          r2: currentR2,
        }
      }
    }
    currentE2 = currentE2.plus(1)
  }
}

/**
 * https://tc39.es/ecma402/#sec-torawprecision
 * @param x a finite non-negative Number or BigInt
 * @param minPrecision an integer between 1 and 21
 * @param maxPrecision an integer between 1 and 21
 */
export function ToRawPrecision(
  x: Decimal,
  minPrecision: number,
  maxPrecision: number,
  unsignedRoundingMode: UnsignedRoundingModeType
): RawNumberFormatResult {
  // 1. Let p be maxPrecision.
  const p = maxPrecision
  let m: string
  let e: number
  let xFinal: Decimal

  // 2. If x = 0, then
  if (x.isZero()) {
    // a. Let m be the String value consisting of p occurrences of the character "0".
    m = repeat('0', p)
    // b. Let e be 0.
    e = 0
    // c. Let xFinal be 0.
    xFinal = ZERO
  } else {
    // 3. Else,
    // a. Let {n1, e1, r1} be the result of findN1E1R1(x, p).
    const {n1, e1, r1} = findN1E1R1(x, p)
    // b. Let {n2, e2, r2} be the result of findN2E2R2(x, p).
    const {n2, e2, r2} = findN2E2R2(x, p)
    // c. Let r be ApplyUnsignedRoundingMode(x, r1, r2, unsignedRoundingMode).
    let r = ApplyUnsignedRoundingMode(x, r1, r2, unsignedRoundingMode)
    let n
    // d. If r = r1, then
    if (r.eq(r1)) {
      // i. Let n be n1.
      n = n1
      // ii. Let e be e1.
      e = e1.toNumber()
      // iii. Let xFinal be r1.
      xFinal = r1
    } else {
      // e. Else,
      // i. Let n be n2.
      n = n2
      // ii. Let e be e2.
      e = e2.toNumber()
      // iii. Let xFinal be r2.
      xFinal = r2
    }
    // f. Let m be the String representation of n.
    m = n.toString()
  }

  let int

  // 4. If e ≥ p - 1, then
  if (e >= p - 1) {
    // a. Let m be the string-concatenation of m and p - 1 - e occurrences of the character "0".
    m = m + repeat('0', e - p + 1)
    // b. Let int be e + 1.
    int = e + 1
  } else if (e >= 0) {
    // 5. Else if e ≥ 0, then
    // a. Let m be the string-concatenation of the first e + 1 characters of m, ".", and the remaining p - (e + 1) characters of m.
    m = m.slice(0, e + 1) + '.' + m.slice(m.length - (p - (e + 1)))
    // b. Let int be e + 1.
    int = e + 1
  } else {
    // 6. Else,
    // a. Assert: e < 0.
    invariant(e < 0, 'e should be less than 0')
    // b. Let m be the string-concatenation of "0.", -e - 1 occurrences of the character "0", and m.
    m = '0.' + repeat('0', -e - 1) + m
    // c. Let int be 1.
    int = 1
  }

  // 7. If m contains ".", and maxPrecision > minPrecision, then
  if (m.includes('.') && maxPrecision > minPrecision) {
    // a. Let cut be maxPrecision - minPrecision.
    let cut = maxPrecision - minPrecision
    // b. Repeat, while cut > 0 and the last character of m is "0",
    while (cut > 0 && m[m.length - 1] === '0') {
      // i. Remove the last character from m.
      m = m.slice(0, m.length - 1)
      // ii. Decrease cut by 1.
      cut--
    }
    // c. If the last character of m is ".", then
    if (m[m.length - 1] === '.') {
      // i. Remove the last character from m.
      m = m.slice(0, m.length - 1)
    }
  }

  // 8. Return the Record { [[FormattedString]]: m, [[RoundedNumber]]: xFinal, [[IntegerDigitsCount]]: int, [[RoundingMagnitude]]: e }.
  return {
    formattedString: m,
    roundedNumber: xFinal,
    integerDigitsCount: int,
    roundingMagnitude: e,
  }
}

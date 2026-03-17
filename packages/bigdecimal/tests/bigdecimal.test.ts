import {describe, expect, it} from 'vitest'
import {BigDecimal} from '../index'

describe('BigDecimal', () => {
  // --- Constructor ---
  describe('constructor', () => {
    it('handles number 0', () => {
      const d = new BigDecimal(0)
      expect(d.toString()).toBe('0')
      expect(d.isZero()).toBe(true)
      expect(d.isPositive()).toBe(true)
    })

    it('handles -0', () => {
      const d = new BigDecimal(-0)
      expect(d.toString()).toBe('0')
      expect(d.isZero()).toBe(true)
      expect(d.isNegative()).toBe(true)
      expect(d.isPositive()).toBe(false)
    })

    it('handles positive integers', () => {
      expect(new BigDecimal(42).toString()).toBe('42')
      expect(new BigDecimal(1).toString()).toBe('1')
    })

    it('handles negative integers', () => {
      expect(new BigDecimal(-42).toString()).toBe('-42')
    })

    it('handles decimals', () => {
      expect(new BigDecimal(3.14).toString()).toBe('3.14')
      expect(new BigDecimal(0.001).toString()).toBe('0.001')
    })

    it('handles large numbers', () => {
      expect(new BigDecimal(1e41).toString()).toBe(
        '100000000000000000000000000000000000000000'
      )
    })

    it('handles small numbers', () => {
      expect(new BigDecimal(1e-10).toString()).toBe('0.0000000001')
    })

    it('handles NaN', () => {
      const d = new BigDecimal(NaN)
      expect(d.isNaN()).toBe(true)
      expect(d.toString()).toBe('NaN')
    })

    it('handles Infinity', () => {
      const d = new BigDecimal(Infinity)
      expect(d.isFinite()).toBe(false)
      expect(d.toString()).toBe('Infinity')
    })

    it('handles -Infinity', () => {
      const d = new BigDecimal(-Infinity)
      expect(d.isFinite()).toBe(false)
      expect(d.toString()).toBe('-Infinity')
    })

    it('handles MAX_SAFE_INTEGER', () => {
      expect(new BigDecimal(Number.MAX_SAFE_INTEGER).toString()).toBe(
        '9007199254740991'
      )
    })

    it('handles string "123.456"', () => {
      expect(new BigDecimal('123.456').toString()).toBe('123.456')
    })

    it('handles string "1e-14"', () => {
      expect(new BigDecimal('1e-14').toString()).toBe('0.00000000000001')
    })

    it('handles string "NaN"', () => {
      expect(new BigDecimal('NaN').isNaN()).toBe(true)
    })

    it('handles string "Infinity"', () => {
      expect(new BigDecimal('Infinity').isFinite()).toBe(false)
      expect(new BigDecimal('Infinity').isPositive()).toBe(true)
    })

    it('handles string "-Infinity"', () => {
      expect(new BigDecimal('-Infinity').isFinite()).toBe(false)
      expect(new BigDecimal('-Infinity').isNegative()).toBe(true)
    })

    it('handles string with high precision', () => {
      expect(new BigDecimal('1234567891234567.35').toString()).toBe(
        '1234567891234567.35'
      )
    })

    it('handles bigint', () => {
      expect(new BigDecimal(42n).toString()).toBe('42')
      expect(new BigDecimal(-100n).toString()).toBe('-100')
      expect(new BigDecimal(0n).toString()).toBe('0')
    })

    it('handles string with scientific notation', () => {
      expect(new BigDecimal('1.5e3').toString()).toBe('1500')
      expect(new BigDecimal('1.5e-3').toString()).toBe('0.0015')
      expect(new BigDecimal('1E+10').toString()).toBe('10000000000')
    })
  })

  // --- Arithmetic ---
  describe('times', () => {
    it('1 × 1 = 1', () => {
      expect(new BigDecimal(1).times(new BigDecimal(1)).toString()).toBe('1')
    })

    it('54 × -54 = -2916', () => {
      expect(new BigDecimal(54).times(new BigDecimal(-54)).toString()).toBe(
        '-2916'
      )
    })

    it('9.99 × -9.99 = -99.8001', () => {
      expect(
        new BigDecimal('9.99').times(new BigDecimal('-9.99')).toString()
      ).toBe('-99.8001')
    })

    it('1 × 8e5 = 800000', () => {
      expect(new BigDecimal(1).times(new BigDecimal(8e5)).toString()).toBe(
        '800000'
      )
    })

    it('0 × anything = 0', () => {
      expect(new BigDecimal(0).times(new BigDecimal(42)).toString()).toBe('0')
    })

    it('handles -0 sign', () => {
      const result = new BigDecimal(-0).times(new BigDecimal(1))
      expect(result.isZero()).toBe(true)
      expect(result.isNegative()).toBe(true)
    })

    it('Infinity × 2 = Infinity', () => {
      expect(new BigDecimal(Infinity).times(new BigDecimal(2)).toString()).toBe(
        'Infinity'
      )
    })

    it('Infinity × 0 = NaN', () => {
      expect(new BigDecimal(Infinity).times(new BigDecimal(0)).isNaN()).toBe(
        true
      )
    })
  })

  describe('div', () => {
    it('1 / 1 = 1', () => {
      expect(new BigDecimal(1).div(new BigDecimal(1)).toString()).toBe('1')
    })

    it('6 / 2 = 3', () => {
      expect(new BigDecimal(6).div(new BigDecimal(2)).toString()).toBe('3')
    })

    it('1 / -45 gives correct result', () => {
      const result = new BigDecimal(1).div(new BigDecimal(-45))
      // Should be approximately -0.0222...
      expect(result.toNumber()).toBeCloseTo(-1 / 45, 15)
    })

    it('handles precision', () => {
      const result = new BigDecimal(1).div(new BigDecimal(3))
      expect(result.toNumber()).toBeCloseTo(1 / 3, 15)
    })

    it('0 / 0 = NaN', () => {
      expect(new BigDecimal(0).div(new BigDecimal(0)).isNaN()).toBe(true)
    })

    it('1 / 0 = Infinity', () => {
      const result = new BigDecimal(1).div(new BigDecimal(0))
      expect(result.toString()).toBe('Infinity')
    })

    it('-1 / 0 = -Infinity', () => {
      const result = new BigDecimal(-1).div(new BigDecimal(0))
      expect(result.toString()).toBe('-Infinity')
    })
  })

  describe('plus', () => {
    it('1 + 0 = 1', () => {
      expect(new BigDecimal(1).plus(new BigDecimal(0)).toString()).toBe('1')
    })

    it('-1 + 1 = 0', () => {
      expect(new BigDecimal(-1).plus(new BigDecimal(1)).toString()).toBe('0')
    })

    it('0.1 + 0.2 = 0.3', () => {
      expect(new BigDecimal('0.1').plus(new BigDecimal('0.2')).toString()).toBe(
        '0.3'
      )
    })

    it('Infinity + (-Infinity) = NaN', () => {
      expect(
        new BigDecimal(Infinity).plus(new BigDecimal(-Infinity)).isNaN()
      ).toBe(true)
    })

    it('-0 + -0 = -0', () => {
      const result = new BigDecimal(-0).plus(new BigDecimal(-0))
      expect(result.isZero()).toBe(true)
      expect(result.isNegative()).toBe(true)
    })

    it('-0 + 0 = 0 (positive)', () => {
      const result = new BigDecimal(-0).plus(new BigDecimal(0))
      expect(result.isZero()).toBe(true)
      expect(result.isPositive()).toBe(true)
    })
  })

  describe('minus', () => {
    it('5 - 3 = 2', () => {
      expect(new BigDecimal(5).minus(new BigDecimal(3)).toString()).toBe('2')
    })

    it('3 - 5 = -2', () => {
      expect(new BigDecimal(3).minus(new BigDecimal(5)).toString()).toBe('-2')
    })

    it('0 - 0 = 0', () => {
      expect(new BigDecimal(0).minus(new BigDecimal(0)).toString()).toBe('0')
    })
  })

  describe('mod', () => {
    it('21 % 11 = 10', () => {
      expect(new BigDecimal(21).mod(new BigDecimal(11)).toString()).toBe('10')
    })

    it('999.99 % 3.01 = 0.67', () => {
      const result = new BigDecimal('999.99').mod(new BigDecimal('3.01'))
      expect(result.toString()).toBe('0.67')
    })

    it('1 % 0 = NaN', () => {
      expect(new BigDecimal(1).mod(new BigDecimal(0)).isNaN()).toBe(true)
    })

    it('10 % 3 = 1', () => {
      expect(new BigDecimal(10).mod(new BigDecimal(3)).toString()).toBe('1')
    })

    it('Infinity % 2 = NaN', () => {
      expect(new BigDecimal(Infinity).mod(new BigDecimal(2)).isNaN()).toBe(true)
    })

    it('5 % Infinity = 5', () => {
      const result = new BigDecimal(5).mod(new BigDecimal(Infinity))
      expect(result.toString()).toBe('5')
    })
  })

  describe('abs', () => {
    it('abs(-5) = 5', () => {
      expect(new BigDecimal(-5).abs().toString()).toBe('5')
    })

    it('abs(5) = 5', () => {
      expect(new BigDecimal(5).abs().toString()).toBe('5')
    })

    it('abs(-0) = 0 (positive)', () => {
      const result = new BigDecimal(-0).abs()
      expect(result.isZero()).toBe(true)
      expect(result.isPositive()).toBe(true)
    })

    it('abs(-Infinity) = Infinity', () => {
      expect(new BigDecimal(-Infinity).abs().toString()).toBe('Infinity')
    })
  })

  describe('negated', () => {
    it('negated(5) = -5', () => {
      expect(new BigDecimal(5).negated().toString()).toBe('-5')
    })

    it('negated(-5) = 5', () => {
      expect(new BigDecimal(-5).negated().toString()).toBe('5')
    })

    it('negated(0) = -0', () => {
      const result = new BigDecimal(0).negated()
      expect(result.isZero()).toBe(true)
      expect(result.isNegative()).toBe(true)
    })

    it('negated(-0) = 0', () => {
      const result = new BigDecimal(-0).negated()
      expect(result.isZero()).toBe(true)
      expect(result.isPositive()).toBe(true)
    })

    it('negated(Infinity) = -Infinity', () => {
      expect(new BigDecimal(Infinity).negated().toString()).toBe('-Infinity')
    })
  })

  describe('pow', () => {
    it('9^2 = 81', () => {
      expect(new BigDecimal(9).pow(2).toString()).toBe('81')
    })

    it('2^10 = 1024', () => {
      expect(new BigDecimal(2).pow(10).toString()).toBe('1024')
    })

    it('10^-3 = 0.001', () => {
      expect(new BigDecimal(10).pow(-3).toString()).toBe('0.001')
    })

    it('anything^0 = 1', () => {
      expect(new BigDecimal(42).pow(0).toString()).toBe('1')
    })

    it('BigDecimal.pow(10, 41) = 10^41', () => {
      expect(BigDecimal.pow(10, 41).toString()).toBe(
        '100000000000000000000000000000000000000000'
      )
    })

    it('BigDecimal.pow(10, 0) = 1', () => {
      expect(BigDecimal.pow(10, 0).toString()).toBe('1')
    })

    it('BigDecimal.pow(10, -3) = 0.001', () => {
      expect(BigDecimal.pow(10, -3).toString()).toBe('0.001')
    })
  })

  describe('floor', () => {
    it('floor(3.7) = 3', () => {
      expect(new BigDecimal('3.7').floor().toString()).toBe('3')
    })

    it('floor(-3.7) = -4', () => {
      expect(new BigDecimal('-3.7').floor().toString()).toBe('-4')
    })

    it('floor(5) = 5', () => {
      expect(new BigDecimal(5).floor().toString()).toBe('5')
    })

    it('floor(0) = 0', () => {
      expect(new BigDecimal(0).floor().toString()).toBe('0')
    })

    it('floor(0.5) = 0', () => {
      expect(new BigDecimal('0.5').floor().toString()).toBe('0')
    })

    it('floor(-0.5) = -1', () => {
      expect(new BigDecimal('-0.5').floor().toString()).toBe('-1')
    })

    it('floor(3.0) = 3', () => {
      expect(new BigDecimal('3.0').floor().toString()).toBe('3')
    })
  })

  describe('ceil', () => {
    it('ceil(3.2) = 4', () => {
      expect(new BigDecimal('3.2').ceil().toString()).toBe('4')
    })

    it('ceil(-3.2) = -3', () => {
      expect(new BigDecimal('-3.2').ceil().toString()).toBe('-3')
    })

    it('ceil(5) = 5', () => {
      expect(new BigDecimal(5).ceil().toString()).toBe('5')
    })

    it('ceil(0.1) = 1', () => {
      expect(new BigDecimal('0.1').ceil().toString()).toBe('1')
    })

    it('ceil(-0.1) = 0', () => {
      expect(new BigDecimal('-0.1').ceil().toString()).toBe('0')
    })
  })

  // --- log(10) chain tests (critical) ---
  describe('log(10)', () => {
    it('log10(1).floor() = 0', () => {
      expect(new BigDecimal(1).log(10).floor().toString()).toBe('0')
    })

    it('log10(9).floor() = 0', () => {
      expect(new BigDecimal(9).log(10).floor().toString()).toBe('0')
    })

    it('log10(10).floor() = 1', () => {
      expect(new BigDecimal(10).log(10).floor().toString()).toBe('1')
    })

    it('log10(99).floor() = 1', () => {
      expect(new BigDecimal(99).log(10).floor().toString()).toBe('1')
    })

    it('log10(100).floor() = 2', () => {
      expect(new BigDecimal(100).log(10).floor().toString()).toBe('2')
    })

    it('log10(500).floor() = 2', () => {
      expect(new BigDecimal(500).log(10).floor().toString()).toBe('2')
    })

    it('log10(0.1).floor() = -1', () => {
      expect(new BigDecimal('0.1').log(10).floor().toString()).toBe('-1')
    })

    it('log10(0.01).floor() = -2', () => {
      expect(new BigDecimal('0.01').log(10).floor().toString()).toBe('-2')
    })

    it('log10(1e41).floor() = 41', () => {
      expect(new BigDecimal(1e41).log(10).floor().toString()).toBe('41')
    })

    it('log10(1e-10).floor() = -10', () => {
      expect(new BigDecimal(1e-10).log(10).floor().toString()).toBe('-10')
    })

    it('log10(500).plus(3).minus(1).ceil() = 5', () => {
      expect(
        new BigDecimal(500)
          .log(10)
          .plus(new BigDecimal(3))
          .minus(new BigDecimal(1))
          .ceil()
          .toString()
      ).toBe('5')
    })

    it('log10(100).plus(3).minus(1).ceil() = 4', () => {
      expect(
        new BigDecimal(100)
          .log(10)
          .plus(new BigDecimal(3))
          .minus(new BigDecimal(1))
          .ceil()
          .toString()
      ).toBe('4')
    })

    it('log10(0) = -Infinity', () => {
      expect(new BigDecimal(0).log(10).toString()).toBe('-Infinity')
    })

    it('log10(-1) = NaN', () => {
      expect(new BigDecimal(-1).log(10).isNaN()).toBe(true)
    })

    it('log10(Infinity) = Infinity', () => {
      expect(new BigDecimal(Infinity).log(10).toString()).toBe('Infinity')
    })

    it('log10(NaN) = NaN', () => {
      expect(new BigDecimal(NaN).log(10).isNaN()).toBe(true)
    })

    it('log10(1000).floor() = 3', () => {
      expect(new BigDecimal(1000).log(10).floor().toString()).toBe('3')
    })

    it('log10(999).floor() = 2', () => {
      expect(new BigDecimal(999).log(10).floor().toString()).toBe('2')
    })

    it('log10(0.001).floor() = -3', () => {
      expect(new BigDecimal('0.001').log(10).floor().toString()).toBe('-3')
    })

    it('log10(0.0099).floor() = -3', () => {
      // log10(0.0099) ≈ -2.004 → floor = -3
      expect(new BigDecimal('0.0099').log(10).floor().toString()).toBe('-3')
    })

    it('log10 handles very large mantissa (>10^325) without overflow', () => {
      // Regression: Math.pow(10, shift) overflows to Infinity for shift > 308
      const big = '1' + '0'.repeat(350)
      expect(new BigDecimal(big).log(10).floor().toString()).toBe('350')
    })
  })

  // --- Comparison ---
  describe('comparison', () => {
    it('eq: 5 == 5', () => {
      expect(new BigDecimal(5).eq(new BigDecimal(5))).toBe(true)
    })

    it('eq: 5 != 6', () => {
      expect(new BigDecimal(5).eq(new BigDecimal(6))).toBe(false)
    })

    it('eq: 0 == -0', () => {
      expect(new BigDecimal(0).eq(new BigDecimal(-0))).toBe(true)
    })

    it('eq: NaN != NaN', () => {
      expect(new BigDecimal(NaN).eq(new BigDecimal(NaN))).toBe(false)
    })

    it('eq: Infinity == Infinity', () => {
      expect(new BigDecimal(Infinity).eq(new BigDecimal(Infinity))).toBe(true)
    })

    it('lessThan: 3 < 5', () => {
      expect(new BigDecimal(3).lessThan(new BigDecimal(5))).toBe(true)
    })

    it('lessThan: 5 < 3 = false', () => {
      expect(new BigDecimal(5).lessThan(new BigDecimal(3))).toBe(false)
    })

    it('lessThan: NaN < 1 = false', () => {
      expect(new BigDecimal(NaN).lessThan(new BigDecimal(1))).toBe(false)
    })

    it('greaterThan: 5 > 3', () => {
      expect(new BigDecimal(5).greaterThan(new BigDecimal(3))).toBe(true)
    })

    it('greaterThan: 3 > 5 = false', () => {
      expect(new BigDecimal(3).greaterThan(new BigDecimal(5))).toBe(false)
    })

    it('lessThanOrEqualTo: 3 <= 5', () => {
      expect(new BigDecimal(3).lessThanOrEqualTo(new BigDecimal(5))).toBe(true)
    })

    it('lessThanOrEqualTo: 5 <= 5', () => {
      expect(new BigDecimal(5).lessThanOrEqualTo(new BigDecimal(5))).toBe(true)
    })

    it('greaterThanOrEqualTo: 5 >= 3', () => {
      expect(new BigDecimal(5).greaterThanOrEqualTo(new BigDecimal(3))).toBe(
        true
      )
    })

    it('greaterThanOrEqualTo: 5 >= 5', () => {
      expect(new BigDecimal(5).greaterThanOrEqualTo(new BigDecimal(5))).toBe(
        true
      )
    })

    it('compares decimals correctly', () => {
      expect(new BigDecimal('1.5').lessThan(new BigDecimal('1.50001'))).toBe(
        true
      )
      expect(new BigDecimal('1.5').greaterThan(new BigDecimal('1.49999'))).toBe(
        true
      )
    })

    it('compares negative numbers correctly', () => {
      expect(new BigDecimal(-5).lessThan(new BigDecimal(-3))).toBe(true)
      expect(new BigDecimal(-3).greaterThan(new BigDecimal(-5))).toBe(true)
    })

    it('compares with infinity', () => {
      expect(new BigDecimal(1e100).lessThan(new BigDecimal(Infinity))).toBe(
        true
      )
      expect(new BigDecimal(-Infinity).lessThan(new BigDecimal(-1e100))).toBe(
        true
      )
    })
  })

  // --- Queries ---
  describe('queries', () => {
    it('isZero', () => {
      expect(new BigDecimal(0).isZero()).toBe(true)
      expect(new BigDecimal(-0).isZero()).toBe(true)
      expect(new BigDecimal(1).isZero()).toBe(false)
      expect(new BigDecimal(NaN).isZero()).toBe(false)
    })

    it('isNaN', () => {
      expect(new BigDecimal(NaN).isNaN()).toBe(true)
      expect(new BigDecimal(0).isNaN()).toBe(false)
      expect(new BigDecimal(Infinity).isNaN()).toBe(false)
    })

    it('isFinite', () => {
      expect(new BigDecimal(0).isFinite()).toBe(true)
      expect(new BigDecimal(42).isFinite()).toBe(true)
      expect(new BigDecimal(Infinity).isFinite()).toBe(false)
      expect(new BigDecimal(-Infinity).isFinite()).toBe(false)
      expect(new BigDecimal(NaN).isFinite()).toBe(false)
    })

    it('isNegative', () => {
      expect(new BigDecimal(-5).isNegative()).toBe(true)
      expect(new BigDecimal(-0).isNegative()).toBe(true)
      expect(new BigDecimal(0).isNegative()).toBe(false)
      expect(new BigDecimal(5).isNegative()).toBe(false)
      expect(new BigDecimal(NaN).isNegative()).toBe(false)
      expect(new BigDecimal(-Infinity).isNegative()).toBe(true)
    })

    it('isPositive', () => {
      expect(new BigDecimal(5).isPositive()).toBe(true)
      expect(new BigDecimal(0).isPositive()).toBe(true)
      expect(new BigDecimal(-0).isPositive()).toBe(false)
      expect(new BigDecimal(-5).isPositive()).toBe(false)
      expect(new BigDecimal(NaN).isPositive()).toBe(false)
      expect(new BigDecimal(Infinity).isPositive()).toBe(true)
    })

    it('isInteger', () => {
      expect(new BigDecimal(5).isInteger()).toBe(true)
      expect(new BigDecimal(0).isInteger()).toBe(true)
      expect(new BigDecimal('3.14').isInteger()).toBe(false)
      expect(new BigDecimal(Infinity).isInteger()).toBe(false)
      expect(new BigDecimal(NaN).isInteger()).toBe(false)
    })
  })

  // --- Conversion ---
  describe('toNumber', () => {
    it('converts integers', () => {
      expect(new BigDecimal(42).toNumber()).toBe(42)
      expect(new BigDecimal(-42).toNumber()).toBe(-42)
    })

    it('converts decimals', () => {
      expect(new BigDecimal('3.14').toNumber()).toBe(3.14)
    })

    it('converts 0 and -0', () => {
      expect(new BigDecimal(0).toNumber()).toBe(0)
      expect(Object.is(new BigDecimal(0).toNumber(), 0)).toBe(true)
      expect(Object.is(new BigDecimal(-0).toNumber(), -0)).toBe(true)
    })

    it('converts special values', () => {
      expect(new BigDecimal(NaN).toNumber()).toBeNaN()
      expect(new BigDecimal(Infinity).toNumber()).toBe(Infinity)
      expect(new BigDecimal(-Infinity).toNumber()).toBe(-Infinity)
    })
  })

  describe('toString', () => {
    it('never uses scientific notation', () => {
      // This is critical: must match decimal.js with toExpPos: 100
      expect(new BigDecimal(1e41).toString()).toBe(
        '100000000000000000000000000000000000000000'
      )
      expect(new BigDecimal(1e20).toString()).toBe('100000000000000000000')
    })

    it('formats decimals correctly', () => {
      expect(new BigDecimal('0.001').toString()).toBe('0.001')
      expect(new BigDecimal('1234567891234567.35').toString()).toBe(
        '1234567891234567.35'
      )
    })

    it('formats -0 as "0"', () => {
      expect(new BigDecimal(-0).toString()).toBe('0')
    })

    it('formats NaN', () => {
      expect(new BigDecimal(NaN).toString()).toBe('NaN')
    })

    it('formats Infinity', () => {
      expect(new BigDecimal(Infinity).toString()).toBe('Infinity')
      expect(new BigDecimal(-Infinity).toString()).toBe('-Infinity')
    })
  })

  // --- Static ---
  describe('static methods', () => {
    it('BigDecimal.pow(10, n) works for various n', () => {
      expect(BigDecimal.pow(10, 0).toString()).toBe('1')
      expect(BigDecimal.pow(10, 1).toString()).toBe('10')
      expect(BigDecimal.pow(10, 5).toString()).toBe('100000')
      expect(BigDecimal.pow(10, -2).toString()).toBe('0.01')
    })

    it('BigDecimal.set is a no-op', () => {
      // Should not throw
      BigDecimal.set({toExpPos: 100})
    })
  })

  // --- Integration validation vectors ---
  describe('integration vectors', () => {
    it('ToRawFixed-style: 9.99 × 10^1 floor div 10', () => {
      // Simulating ToRawFixed(9.99, 0, 1):
      // n = 9.99, f = 1 → n × 10^f = 99.9 → floor = 99 → ... → "10"
      const n = new BigDecimal('9.99')
      const scaled = n.times(BigDecimal.pow(10, 1))
      const floored = scaled.floor()
      expect(floored.toString()).toBe('99')
    })

    it('ToRawFixed-style: 1e41 preserves precision', () => {
      const n = new BigDecimal(1e41)
      expect(n.toString().length).toBe(42) // "1" + 41 zeros
    })

    it('ToRawPrecision-style: log10 chain for 9.99', () => {
      // e = log10(9.99).floor() = 0
      const n = new BigDecimal('9.99')
      const e = n.log(10).floor()
      expect(e.toString()).toBe('0')
    })

    it('ToRawPrecision-style: log10 chain for 1e-10', () => {
      const n = new BigDecimal(1e-10)
      const e = n.log(10).floor()
      expect(e.toString()).toBe('-10')
    })

    it('ApplyUnsignedRoundingMode-style: mod and comparisons', () => {
      // r1 = x mod d, r2 = d - r1
      const x = new BigDecimal('7.5')
      const d = new BigDecimal('5')
      const r1 = x.mod(d)
      const r2 = d.minus(r1)
      expect(r1.toString()).toBe('2.5')
      expect(r2.toString()).toBe('2.5')
      expect(r1.eq(r2)).toBe(true)
    })

    it('decimal-cache-style: pow(10, n) for various n', () => {
      expect(BigDecimal.pow(10, 0).toString()).toBe('1')
      expect(BigDecimal.pow(10, 10).toString()).toBe('10000000000')
      expect(BigDecimal.pow(10, -5).toString()).toBe('0.00001')
      expect(BigDecimal.pow(10, 41).toString()).toBe(
        '100000000000000000000000000000000000000000'
      )
    })
  })
})

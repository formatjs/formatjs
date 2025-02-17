import Decimal from 'decimal.js'
import {ApplyUnsignedRoundingMode} from '../NumberFormat/ApplyUnsignedRoundingMode'
import {describe, expect, it} from 'vitest'
describe('ApplyUnsignedRoundingMode', () => {
  it('return r1 for x = r1', () => {
    const result = ApplyUnsignedRoundingMode(
      new Decimal(1),
      new Decimal(1),
      new Decimal(2),
      'zero'
    )
    expect(result.toNumber()).toBe(1)
  })

  it('return r1 for unsignedRoundingMode zero', () => {
    const result = ApplyUnsignedRoundingMode(
      new Decimal(1),
      new Decimal(0),
      new Decimal(2),
      'zero'
    )
    expect(result.toNumber()).toBe(0)
  })

  it('return r2 for unsignedRoundingMode infinity', () => {
    const result = ApplyUnsignedRoundingMode(
      new Decimal(1),
      new Decimal(0),
      new Decimal(2),
      'infinity'
    )
    expect(result.toNumber()).toBe(2)
  })

  it('return r1 for less distance to x', () => {
    const result = ApplyUnsignedRoundingMode(
      new Decimal(1),
      new Decimal(0),
      new Decimal(4),
      'half-infinity'
    )
    expect(result.toNumber()).toBe(0)
  })

  it('return r2 for less distance to x', () => {
    const result = ApplyUnsignedRoundingMode(
      new Decimal(3),
      new Decimal(0),
      new Decimal(4),
      'half-infinity'
    )
    expect(result.toNumber()).toBe(4)
  })

  it('return r1 for unsignedRoundingMode half-zero', () => {
    const result = ApplyUnsignedRoundingMode(
      new Decimal(1),
      new Decimal(0),
      new Decimal(2),
      'half-zero'
    )
    expect(result.toNumber()).toBe(0)
  })

  it('return r2 for unsignedRoundingMode half-infinity', () => {
    const result = ApplyUnsignedRoundingMode(
      new Decimal(1),
      new Decimal(0),
      new Decimal(2),
      'half-infinity'
    )
    expect(result.toNumber()).toBe(2)
  })

  it('throws for unknown unsignedRoundingMode', () => {
    const executeFunction = () =>
      ApplyUnsignedRoundingMode(
        new Decimal(1),
        new Decimal(0),
        new Decimal(2),
        // @ts-ignore
        'half-foo'
      )
    expect(executeFunction).toThrow('unsignedRoundingMode should be half-even')
  })

  it('return r1 for cardinality = 0', () => {
    const result = ApplyUnsignedRoundingMode(
      new Decimal(1),
      new Decimal(0),
      new Decimal(2),
      'half-even'
    )
    expect(result.toNumber()).toBe(0)
  })

  it('return r2 for cardinality = 1', () => {
    const result = ApplyUnsignedRoundingMode(
      new Decimal(2),
      new Decimal(1),
      new Decimal(3),
      'half-even'
    )
    expect(result.toNumber()).toBe(3)
  })
})

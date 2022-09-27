import {ApplyUnsignedRoundingMode} from '../NumberFormat/ApplyUnsignedRoundingMode'

describe('ApplyUnsignedRoundingMode', () => {
  it('return r1 for x = r1', () => {
    const result = ApplyUnsignedRoundingMode(1, 1, 2, 'zero')
    expect(result).toBe(1)
  })

  it('throws for undefined unsignedRoundingMode', () => {
    // @ts-ignore
    const executeFunction = () => ApplyUnsignedRoundingMode(1, 0, 2, undefined)
    expect(executeFunction).toThrowError('unsignedRoundingMode is mandatory')
  })

  it('return r1 for unsignedRoundingMode zero', () => {
    const result = ApplyUnsignedRoundingMode(1, 0, 2, 'zero')
    expect(result).toBe(0)
  })

  it('return r2 for unsignedRoundingMode infinity', () => {
    const result = ApplyUnsignedRoundingMode(1, 0, 2, 'infinity')
    expect(result).toBe(2)
  })

  it('return r1 for less distance to x', () => {
    const result = ApplyUnsignedRoundingMode(1, 0, 4, 'half-infinity')
    expect(result).toBe(0)
  })

  it('return r2 for less distance to x', () => {
    const result = ApplyUnsignedRoundingMode(3, 0, 4, 'half-infinity')
    expect(result).toBe(4)
  })

  it('return r1 for unsignedRoundingMode half-zero', () => {
    const result = ApplyUnsignedRoundingMode(1, 0, 2, 'half-zero')
    expect(result).toBe(0)
  })

  it('return r2 for unsignedRoundingMode half-infinity', () => {
    const result = ApplyUnsignedRoundingMode(1, 0, 2, 'half-infinity')
    expect(result).toBe(2)
  })

  it('throws for unknown unsignedRoundingMode', () => {
    // @ts-ignore
    const executeFunction = () => ApplyUnsignedRoundingMode(1, 0, 2, 'half-foo')
    expect(executeFunction).toThrow(
      'Unexpected value for unsignedRoundingMode: half-foo'
    )
  })

  it('return r1 for cardinality = 0', () => {
    const result = ApplyUnsignedRoundingMode(1, 0, 2, 'half-even')
    expect(result).toBe(0)
  })

  it('return r2 for cardinality = 1', () => {
    const result = ApplyUnsignedRoundingMode(2, 1, 3, 'half-even')
    expect(result).toBe(3)
  })
})

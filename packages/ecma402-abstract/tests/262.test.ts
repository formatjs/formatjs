import {describe, expect, it} from 'vitest'
import {ToNumber} from '#packages/ecma262-abstract/ToNumber.js'
import {DefaultNumberOption} from '#packages/ecma402-abstract/DefaultNumberOption.js'
import {ToIntegerIfIntegral} from '#packages/ecma402-abstract/DurationFormat/ToIntegerIfIntegral.js'
import {DayFromYear} from '#packages/ecma262-abstract/DateOperations.js'

describe('262', () => {
  describe('DayFromYear', () => {
    it('calculates correct day number for year 1 AD', () => {
      expect(DayFromYear(1)).toBe(-719162)
    })

    it('calculates correct day number for year 1970 (Unix epoch)', () => {
      expect(DayFromYear(1970)).toBe(0)
    })

    it('calculates correct day number for year 2000', () => {
      expect(DayFromYear(2000)).toBe(10957)
    })
  })
})

describe('Number coercion', () => {
  it.each([1n, Object(1n), {valueOf: () => 1n}, Symbol('number')])(
    'rejects non-Number numeric inputs: %s',
    value => {
      expect(() => ToNumber(value)).toThrow(TypeError)
      expect(() => DefaultNumberOption(value, 0, 10, 0)).toThrow(TypeError)
    }
  )
  it.each([false, '', '  ', '0x10', '9007199254740993', null])(
    'uses ECMAScript Number conversion: %s',
    value => {
      expect(ToNumber(value)).toBe(Number(value))
    }
  )
  it.each(['getter', 'method', 'valueOf', 'toString'])(
    'preserves the exact exception from %s coercion',
    kind => {
      const error = new Error('coercion failed')
      const fail = () => {
        throw error
      }
      const value =
        kind === 'getter'
          ? Object.defineProperty({}, Symbol.toPrimitive, {get: fail})
          : kind === 'method'
            ? {[Symbol.toPrimitive]: fail}
            : kind === 'valueOf'
              ? {valueOf: fail}
              : {valueOf: () => ({}), toString: fail}
      for (const convert of [
        ToNumber,
        (input: unknown) => DefaultNumberOption(input, 0, 10, 0),
      ]) {
        let caught: unknown
        try {
          convert(value)
        } catch (error) {
          caught = error
        }
        expect(caught).toBe(error)
      }
    }
  )
  it('rejects invalid object coercion', () => {
    for (const value of [
      {[Symbol.toPrimitive]: 1},
      {[Symbol.toPrimitive]: () => ({})},
      {valueOf: () => ({}), toString: () => ({})},
    ]) {
      expect(() => ToNumber(value)).toThrow(TypeError)
    }
  })
  it('coerces an object once with a number hint', () => {
    const hints: string[] = []
    expect(
      ToNumber({
        [Symbol.toPrimitive](hint: string) {
          hints.push(hint)
          return '2'
        },
      })
    ).toBe(2)
    expect(hints).toEqual(['number'])
  })
})

it('returns primitive Numbers with IEEE-754 special values and string grammar', () => {
  for (const [input, expected] of [
    [-0, -0],
    [NaN, NaN],
    [undefined, NaN],
    [Infinity, Infinity],
    [-Infinity, -Infinity],
    [true, 1],
    ['-0', -0],
    ['0b11', 3],
    ['0o10', 8],
    ['0x10', 16],
    ['\u00a0\u2028', 0],
    ['1_000', NaN],
    ['1n', NaN],
    ['+0x10', NaN],
    ['1e309', Infinity],
    ['-1e-999', -0],
    ['9007199254740993', 9007199254740992],
  ] as const) {
    const result = ToNumber(input)
    expect(typeof result).toBe('number')
    expect(result).toBe(expected)
  }
})

it('validates duration integrality without private numeric objects', () => {
  for (const [input, expected] of [
    [-0, 0],
    ['-0', 0],
    [false, 0],
    [null, 0],
    ['0x10', 16],
    [1e100, 1e100],
    [Number.MAX_VALUE, Number.MAX_VALUE],
  ] as const)
    expect(ToIntegerIfIntegral(input)).toBe(expected)
  for (const input of [
    NaN,
    undefined,
    Infinity,
    -Infinity,
    0.5,
    Number.MIN_VALUE,
  ]) {
    expect(() => ToIntegerIfIntegral(input)).toThrow(RangeError)
  }
  for (const input of [1n, Object(1n), Symbol()]) {
    expect(() => ToIntegerIfIntegral(input)).toThrow(TypeError)
  }
})

it.each(['Number.isNaN', 'Object.is', 'BigInt'])(
  'converts before validating without mutable %s',
  intrinsic => {
    const target =
      intrinsic === 'Number.isNaN'
        ? Number
        : intrinsic === 'Object.is'
          ? Object
          : globalThis
    const key =
      intrinsic === 'Number.isNaN'
        ? 'isNaN'
        : intrinsic === 'Object.is'
          ? 'is'
          : 'BigInt'
    const descriptor = Object.getOwnPropertyDescriptor(target, key)!
    const define = Object.defineProperty
    const input = intrinsic === 'Object.is' ? -0 : 23
    let actual: unknown, error: unknown
    try {
      define(target, key, {
        ...descriptor,
        value() {
          throw new Error('Mutable numeric constructor helper reached')
        },
      })
      actual = [ToNumber(input), ToIntegerIfIntegral(input)]
    } catch (caught) {
      error = caught
    } finally {
      define(target, key, descriptor)
    }
    expect(error).toBeUndefined()
    expect(actual).toEqual([input, input === 0 ? 0 : input])
  }
)

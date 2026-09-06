import {describe, expect, it} from 'vitest'
import {ToNumber} from '#packages/ecma262-abstract/ToNumber.js'
import {DefaultNumberOption} from '#packages/ecma402-abstract/DefaultNumberOption.js'
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
      expect(ToNumber(value).toNumber()).toBe(Number(value))
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
      }).toNumber()
    ).toBe(2)
    expect(hints).toEqual(['number'])
  })
})

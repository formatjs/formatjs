import {runInThisContext} from 'node:vm'
import {setFlagsFromString} from 'node:v8'
import {expect, it} from 'vitest'
import {Type} from '#packages/ecma262-abstract/Type.js'
import {ToPrimitive} from '#packages/ecma262-abstract/ToPrimitive.js'

type HostExotic = Record<PropertyKey, unknown> &
  ((...args: unknown[]) => unknown)
function createHostExotic(): HostExotic {
  // V8's test object has document.all's undetectable/callable engine traits.
  setFlagsFromString('--allow-natives-syntax')
  try {
    return runInThisContext('%GetUndetectable()') as HostExotic
  } finally {
    setFlagsFromString('--no-allow-natives-syntax')
  }
}

it('classifies undetectable host values as objects', () => {
  const value = createHostExotic()
  expect(typeof value).toBe('undefined')
  expect(value === undefined).toBe(false)
  expect(Boolean(value)).toBe(false)
  expect(value()).toBe(null)
  expect(Type(value)).toBe('Object')
})

it('coerces host-exotic objects with the requested hint and receiver', () => {
  const value = createHostExotic()
  value[Symbol.toPrimitive] = function (hint: string) {
    expect(this).toBe(value)
    return hint
  }
  expect(ToPrimitive(value, 'number')).toBe('number')
})

it('rejects host-exotic objects returned by conversion hooks', () => {
  const value = createHostExotic()
  expect(() =>
    ToPrimitive(
      {
        [Symbol.toPrimitive]() {
          return value
        },
      },
      'number'
    )
  ).toThrow(TypeError)
})

it('calls callable host-exotic ordinary conversion methods', () => {
  const callable = createHostExotic()
  expect(
    ToPrimitive(
      {
        valueOf: callable,
        toString() {
          throw new Error('Wrong fallback')
        },
      },
      'number'
    )
  ).toBe(null)
})

it('rejects host-exotic ordinary conversion results before falling back', () => {
  const value = createHostExotic()
  const order: string[] = []
  expect(
    ToPrimitive(
      {
        valueOf() {
          order.push('valueOf')
          return value
        },
        toString() {
          order.push('toString')
          return 'fallback'
        },
      },
      'number'
    )
  ).toBe('fallback')
  expect(order).toEqual(['valueOf', 'toString'])
})

it('tests host callability without consulting a replaced Function.prototype.toString', () => {
  const callable = createHostExotic()
  const original = Function.prototype.toString
  let result: unknown
  try {
    Function.prototype.toString = function () {
      throw new Error('Mutable Function.prototype.toString reached')
    }
    result = ToPrimitive({valueOf: callable}, 'number')
  } finally {
    Function.prototype.toString = original
  }
  expect(result).toBe(null)
})

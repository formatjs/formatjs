import {expect, it} from 'vitest'
import {CreatePartsArray} from '#packages/ecma402-abstract/CreatePartsArray.js'

it('creates fresh ordinary parts with only own type/value data properties', () => {
  const record = Object.freeze({
    type: 'integer',
    value: '23',
    source: 'private',
  })
  const input = Object.freeze([record, record])
  const result = CreatePartsArray(input)
  expect(result).toEqual([
    {type: 'integer', value: '23'},
    {type: 'integer', value: '23'},
  ])
  expect(result).not.toBe(input)
  expect(result[0]).not.toBe(record)
  expect(result[0]).not.toBe(result[1])
  expect(Object.getPrototypeOf(result)).toBe(Array.prototype)
  expect(Object.getPrototypeOf(result[0])).toBe(Object.prototype)
  for (const [owner, key, value] of [
    [result, '0', result[0]],
    [result[0], 'type', 'integer'],
    [result[0], 'value', '23'],
  ] as const) {
    expect(Object.getOwnPropertyDescriptor(owner, key)).toEqual({
      value,
      writable: true,
      enumerable: true,
      configurable: true,
    })
  }
  expect(Object.keys(result[0])).toEqual(['type', 'value'])
  expect(Object.getOwnPropertyDescriptor(result, 'length')).toEqual({
    value: 2,
    writable: true,
    enumerable: false,
    configurable: false,
  })
  expect(CreatePartsArray(input)[0]).not.toBe(result[0])
  expect(CreatePartsArray([])).toEqual([])
})

it.each([
  'iterator',
  'push',
  'index setter',
  'type setter',
  'value setter',
  'descriptor getter',
  'defineProperty',
])('copies private records without observing %s', hook => {
  const input = [{type: 'literal', value: 'text'}]
  const define = Object.defineProperty
  const failure = Object.freeze({message: hook})
  const poison = () => {
    throw failure
  }
  let owner: object, key: PropertyKey, replacement: PropertyDescriptor
  if (hook === 'iterator' || hook === 'push') {
    owner = Array.prototype
    key = hook === 'iterator' ? Symbol.iterator : 'push'
    replacement = {
      __proto__: null,
      configurable: true,
      writable: true,
      value: poison,
    } as PropertyDescriptor
  } else if (hook === 'defineProperty') {
    owner = Object
    key = 'defineProperty'
    replacement = {
      __proto__: null,
      configurable: true,
      writable: true,
      value: poison,
    } as PropertyDescriptor
  } else {
    owner = hook === 'index setter' ? Array.prototype : Object.prototype
    key =
      hook === 'index setter'
        ? '0'
        : hook === 'type setter'
          ? 'type'
          : hook === 'value setter'
            ? 'value'
            : 'get'
    replacement =
      hook === 'descriptor getter'
        ? ({
            __proto__: null,
            configurable: true,
            get: poison,
          } as PropertyDescriptor)
        : ({
            __proto__: null,
            configurable: true,
            set: poison,
          } as PropertyDescriptor)
  }
  const descriptor = Object.getOwnPropertyDescriptor(owner, key)
  let actual: unknown, error: unknown
  try {
    define(owner, key, replacement)
    actual = CreatePartsArray(input)
  } catch (caught) {
    error = caught
  } finally {
    if (descriptor) define(owner, key, descriptor)
    else Reflect.deleteProperty(owner, key)
  }
  expect(error).toBeUndefined()
  expect(actual).toEqual([{type: 'literal', value: 'text'}])
})

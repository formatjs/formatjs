import {runInNewContext} from 'node:vm'
import {expect, it} from 'vitest'
import {ArrayCreate} from '#packages/ecma262-abstract/ArrayCreate.js'
import {IsObject} from '#packages/ecma262-abstract/IsObject.js'
import {SameValue} from '#packages/ecma262-abstract/SameValue.js'
import {ToObject} from '#packages/ecma262-abstract/ToObject.js'
import {Type} from '#packages/ecma262-abstract/Type.js'

it('creates array holes and the specified length descriptor', () => {
  const array = ArrayCreate(3)
  expect(Array.isArray(array)).toBe(true)
  expect(Object.getPrototypeOf(array)).toBe(Array.prototype)
  expect(Object.getOwnPropertyNames(array)).toEqual(['length'])
  expect(Object.getOwnPropertyDescriptor(array, 'length')).toEqual({
    value: 3,
    writable: true,
    enumerable: false,
    configurable: false,
  })
  array[4] = 23
  expect(array.length).toBe(5)
})

it('uses a custom prototype without reading its properties or traps', () => {
  const prototype = new Proxy(
    {},
    {
      get() {
        throw new Error('Prototype property read')
      },
      getPrototypeOf() {
        throw new Error('Prototype chain trap reached')
      },
    }
  )
  const array = ArrayCreate(2, prototype)
  expect(Array.isArray(array)).toBe(true)
  expect(Object.getPrototypeOf(array)).toBe(prototype)
  expect(Object.getOwnPropertyNames(array)).toEqual(['length'])
})

it('accepts maximum array length without invoking Array.from', () => {
  const original = Array.from
  let actual: unknown, error: unknown
  try {
    Array.from = () => {
      throw new Error('Mutable Array.from reached')
    }
    const array = ArrayCreate(4_294_967_295)
    actual = [array.length, Object.getOwnPropertyNames(array)]
  } catch (caught) {
    error = caught
  } finally {
    Array.from = original
  }
  expect(error).toBeUndefined()
  expect(actual).toEqual([4_294_967_295, ['length']])
  expect(() => ArrayCreate(4_294_967_296)).toThrow(RangeError)
})

it('does not consult an inherited iterator when creating an empty array', () => {
  const descriptor = Object.getOwnPropertyDescriptor(
    Object.prototype,
    Symbol.iterator
  )
  const define = Object.defineProperty
  let actual: unknown, error: unknown
  try {
    define(Object.prototype, Symbol.iterator, {
      configurable: true,
      get() {
        throw new Error('Private array-like iterator reached')
      },
    })
    actual = ArrayCreate(0)
  } catch (caught) {
    error = caught
  } finally {
    if (descriptor) define(Object.prototype, Symbol.iterator, descriptor)
    else Reflect.deleteProperty(Object.prototype, Symbol.iterator)
  }
  expect(error).toBeUndefined()
  expect(actual).toEqual([])
})

it.each(['Array', 'Object.setPrototypeOf'])(
  'retains intrinsic array allocation under replaced %s',
  intrinsic => {
    const owner = intrinsic === 'Array' ? globalThis : Object
    const key = intrinsic === 'Array' ? 'Array' : 'setPrototypeOf'
    const descriptor = Object.getOwnPropertyDescriptor(owner, key)!
    const define = Object.defineProperty,
      prototype = {}
    let actual: unknown, error: unknown
    try {
      define(owner, key, {
        ...descriptor,
        value() {
          throw new Error('Mutable array intrinsic reached')
        },
      })
      actual = ArrayCreate(0, prototype)
    } catch (caught) {
      error = caught
    } finally {
      define(owner, key, descriptor)
    }
    expect(error).toBeUndefined()
    expect(Object.getPrototypeOf(actual)).toBe(prototype)
  }
)

it('matches native SameValue across language types without consulting Object.is', () => {
  const original = Object.is
  const object = {},
    symbol = Symbol('same'),
    callable = () => {}
  const values = [
    undefined,
    null,
    false,
    true,
    -0,
    0,
    NaN,
    Infinity,
    -Infinity,
    23,
    23n,
    0n,
    '',
    '23',
    symbol,
    Symbol('same'),
    object,
    {},
    callable,
  ]
  const expected = values.flatMap(x => values.map(y => original(x, y)))
  let actual: boolean[] = [],
    error: unknown
  try {
    Object.is = () => {
      throw new Error('Mutable Object.is reached')
    }
    for (const x of values) for (const y of values) actual.push(SameValue(x, y))
  } catch (caught) {
    error = caught
  } finally {
    Object.is = original
  }
  expect(error).toBeUndefined()
  expect(actual).toEqual(expected)
})

it('boxes each primitive with its realm prototype and preserved slot value', () => {
  const fixtures: [unknown, object, Function][] = [
    [false, Boolean.prototype, Boolean.prototype.valueOf],
    [-0, Number.prototype, Number.prototype.valueOf],
    ['text', String.prototype, String.prototype.valueOf],
    [Symbol.for('boxed'), Symbol.prototype, Symbol.prototype.valueOf],
    [23n, BigInt.prototype, BigInt.prototype.valueOf],
  ]
  for (const [value, prototype, unwrap] of fixtures) {
    const boxed = ToObject(value)
    expect(typeof boxed).toBe('object')
    expect(Object.getPrototypeOf(boxed)).toBe(prototype)
    expect(Reflect.apply(unwrap, boxed, [])).toBe(value)
    expect(ToObject(value)).not.toBe(boxed)
  }
})

it('preserves foreign objects and revoked proxies without user code', () => {
  const foreign = runInNewContext('({})')
  const proxy = Proxy.revocable({}, {})
  proxy.revoke()
  for (const value of [foreign, proxy.proxy]) {
    expect(ToObject(value)).toBe(value)
    expect(IsObject(value)).toBe(true)
    expect(Type(value)).toBe('Object')
    expect(SameValue(value, value)).toBe(true)
  }
})

it('classifies all language types without primitive coercion', () => {
  const opaque = new Proxy(function () {}, {
    get() {
      throw new Error('Classification Get reached')
    },
  })
  for (const [value, type] of [
    [undefined, 'Undefined'],
    [null, 'Null'],
    [false, 'Boolean'],
    [-0, 'Number'],
    [NaN, 'Number'],
    ['', 'String'],
    [23n, 'BigInt'],
    [Symbol(), 'Symbol'],
    [opaque, 'Object'],
    [Object(23n), 'Object'],
  ] as const) {
    expect(Type(value)).toBe(type)
    expect(IsObject(value)).toBe(type === 'Object')
  }
})

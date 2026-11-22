import {runInNewContext} from 'node:vm'
import {ToObject} from '#packages/ecma262-abstract/ToObject.js'
import {expect, it} from 'vitest'
import {ToPrimitive} from '#packages/ecma262-abstract/ToPrimitive.js'
import {ToString} from '#packages/ecma262-abstract/ToString.js'

it.each(['Reflect.apply', 'Symbol', 'String', 'TypeError', 'Array iterator'])(
  'keeps primitive conversion independent of mutable %s',
  intrinsic => {
    const hook = Symbol.toPrimitive
    const symbol = Symbol('value')
    const failure = new Error('Mutable coercion helper reached')
    const poison = function () {
      throw failure
    }
    const overrides: [string, () => () => void][] = [
      [
        'Reflect.apply',
        () => {
          const original = Reflect.apply
          Reflect.apply = poison
          return () => {
            Reflect.apply = original
          }
        },
      ],
      ...(['Symbol', 'String', 'TypeError'] as const).map(
        name =>
          [
            name,
            () => {
              const original = globalThis[name]
              Reflect.set(globalThis, name, poison)
              return () => {
                Reflect.set(globalThis, name, original)
              }
            },
          ] as [string, () => () => void]
      ),
      [
        'Array iterator',
        () => {
          const original = Array.prototype[Symbol.iterator]
          Array.prototype[Symbol.iterator] = poison
          return () => {
            Array.prototype[Symbol.iterator] = original
          }
        },
      ],
    ]
    const cases: [string, () => unknown, unknown, boolean?][] = [
      [
        'exotic primitive',
        () =>
          ToPrimitive(
            {
              [hook]() {
                return 23n
              },
            },
            'number'
          ),
        23n,
      ],
      [
        'ordinary primitive',
        () =>
          ToPrimitive(
            {
              valueOf() {
                return {}
              },
              toString() {
                return '23'
              },
            },
            'number'
          ),
        '23',
      ],
      ['primitive input', () => ToPrimitive(23, 'number'), 23],
      [
        'string coercion',
        () =>
          ToString({
            [hook]() {
              return 23n
            },
          }),
        '23',
      ],
      ['symbol string rejection', () => ToString(symbol), undefined, true],
      [
        'exotic object rejection',
        () =>
          ToPrimitive(
            {
              [hook]() {
                return {}
              },
            },
            'number'
          ),
        undefined,
        true,
      ],
      [
        'ordinary object rejection',
        () =>
          ToPrimitive(
            {
              valueOf() {
                return {}
              },
              toString() {
                return {}
              },
            },
            'number'
          ),
        undefined,
        true,
      ],
    ]
    const override = overrides.find(([name]) => name === intrinsic)![1]
    for (const [name, convert, expected, rejects] of cases) {
      let actual: unknown, error: unknown
      const restore = override()
      try {
        actual = convert()
      } catch (caught) {
        error = caught
      } finally {
        restore()
      }
      if (rejects)
        expect(error, `${intrinsic}: ${name}`).toBeInstanceOf(TypeError)
      else {
        expect(error, `${intrinsic}: ${name}`).toBeUndefined()
        expect(actual, `${intrinsic}: ${name}`).toBe(expected)
      }
    }
  }
)

it('preserves receiver, hints, fallback order and abrupt completions', () => {
  const events: string[] = []
  const input = {
    get valueOf() {
      events.push('get valueOf')
      return function (this: unknown) {
        expect(this).toBe(input)
        events.push('call valueOf')
        return {}
      }
    },
    get toString() {
      events.push('get toString')
      return function (this: unknown) {
        expect(this).toBe(input)
        events.push('call toString')
        return 'value'
      }
    },
  }
  expect(ToPrimitive(input, 'number')).toBe('value')
  expect(events).toEqual([
    'get valueOf',
    'call valueOf',
    'get toString',
    'call toString',
  ])
  events.length = 0
  expect(ToPrimitive(input, 'string')).toBe('value')
  expect(events).toEqual(['get toString', 'call toString'])
  const exotic = {
    [Symbol.toPrimitive](hint: string) {
      expect(this).toBe(exotic)
      return hint
    },
  }
  expect(ToPrimitive(exotic, 'number')).toBe('number')
  expect(ToPrimitive(exotic, 'string')).toBe('string')
  expect(ToPrimitive(exotic, undefined as never)).toBe('default')
  const failure = new Error('coercion stopped')
  expect(() =>
    ToPrimitive(
      {
        get [Symbol.toPrimitive]() {
          throw failure
        },
      },
      'number'
    )
  ).toThrow(failure)
  expect(() => ToPrimitive({[Symbol.toPrimitive]: 1}, 'number')).toThrow(
    TypeError
  )
})

it('boxes primitives with the original Object intrinsic', () => {
  const define = Object.defineProperty
  const original = Object.getOwnPropertyDescriptor(globalThis, 'Object')!
  const record = Object.create(null)
  let actual: unknown[]
  try {
    define(globalThis, 'Object', {
      ...original,
      value() {
        throw new Error('Mutable Object constructor reached')
      },
    })
    actual = [ToObject(7), ToObject(record)]
  } finally {
    define(globalThis, 'Object', original)
  }
  expect(typeof actual![0]).toBe('object')
  expect(Number.prototype.valueOf.call(actual![0])).toBe(7)
  expect(actual![1]).toBe(record)
})

it('preserves every primitive type through conversion', () => {
  const symbol = Symbol('primitive')
  for (const value of [
    undefined,
    null,
    true,
    false,
    '',
    -0,
    NaN,
    Infinity,
    23n,
    symbol,
  ]) {
    expect(ToPrimitive(value, 'number')).toBe(value)
    expect(ToPrimitive(value, 'string')).toBe(value)
    expect(ToPrimitive({[Symbol.toPrimitive]: () => value}, 'number')).toBe(
      value
    )
  }
})

it.each(['number', 'string', undefined] as const)(
  'gets and calls conversion methods in order for hint %s',
  hint => {
    for (const absent of [null, undefined]) {
      const events: unknown[] = []
      const first = hint === 'string' ? 'toString' : 'valueOf'
      const second = first === 'toString' ? 'valueOf' : 'toString'
      const input = new Proxy(Object.create(null), {
        get(_target, key, receiver) {
          expect(receiver).toBe(input)
          events.push(key)
          if (key === Symbol.toPrimitive) return absent
          if (key === first) return 42 // Non-callable ordinary methods are skipped.
          if (key === second) {
            return new Proxy(function () {}, {
              get() {
                throw new Error('Call must not inspect method properties')
              },
              apply(_method, thisArgument, argumentsList) {
                expect(thisArgument).toBe(input)
                events.push(argumentsList)
                return 'converted'
              },
            })
          }
          throw new Error('Unexpected property access')
        },
      })
      expect(ToPrimitive(input, hint as 'number' | 'string')).toBe('converted')
      expect(events).toEqual([Symbol.toPrimitive, first, second, []])
    }
  }
)

it.each([
  'get exotic',
  'call exotic',
  'get first',
  'call first',
  'get second',
  'call second',
])('stops at abrupt completion: %s', stop => {
  const failure = Object.freeze({stop})
  const events: string[] = []
  const exotic = stop.endsWith('exotic')
  const input = new Proxy(Object.create(null), {
    get(_target, key) {
      const name =
        key === Symbol.toPrimitive
          ? 'exotic'
          : key === 'valueOf'
            ? 'first'
            : 'second'
      events.push(`get ${name}`)
      if (stop === `get ${name}`) throw failure
      if (name === 'exotic' && !exotic) return undefined
      return function () {
        events.push(`call ${name}`)
        if (stop === `call ${name}`) throw failure
        return {}
      }
    },
  })
  let caught: unknown
  try {
    ToPrimitive(input, 'number')
  } catch (error) {
    caught = error
  }
  expect(caught).toBe(failure)
  const sequence = exotic
    ? ['get exotic', 'call exotic']
    : ['get exotic', 'get first', 'call first', 'get second', 'call second']
  expect(events).toEqual(sequence.slice(0, sequence.indexOf(stop) + 1))
})

it('rejects non-callable exotic methods without ordinary fallback', () => {
  for (const method of [false, 0, '', 23n, Symbol(), {}]) {
    const events: PropertyKey[] = []
    const input = new Proxy(Object.create(null), {
      get(_target, key) {
        events.push(key)
        return method
      },
    })
    expect(() => ToPrimitive(input, 'string')).toThrow(TypeError)
    expect(events).toEqual([Symbol.toPrimitive])
  }
})

it('propagates callable Proxy and class constructor failures without fallback', () => {
  const revoked = Proxy.revocable(function () {}, {})
  revoked.revoke()
  for (const method of [revoked.proxy, class Conversion {}]) {
    for (const key of [Symbol.toPrimitive, 'valueOf']) {
      let fallback = false
      const input = {
        [key]: method,
        toString() {
          fallback = true
          return 'wrong'
        },
      }
      expect(() => ToPrimitive(input, 'number')).toThrow(TypeError)
      expect(fallback).toBe(false)
    }
  }
})

it('converts foreign-realm built-ins and preserves foreign thrown values', () => {
  const foreign = runInNewContext(`({
    date: new Date(0), number: new Number(-0), bigint: Object(23n),
    symbol: Object(Symbol.for('foreign')), error: new TypeError('foreign'),
    TypeError
  })`)
  expect(ToPrimitive(foreign.date, 'number')).toBe(0)
  expect(ToPrimitive(foreign.date, undefined as never)).toBe(
    foreign.date.toString()
  )
  expect(ToPrimitive(foreign.number, 'number')).toBe(-0)
  expect(ToPrimitive(foreign.bigint, 'number')).toBe(23n)
  expect(ToPrimitive(foreign.symbol, 'string')).toBe(Symbol.for('foreign'))
  const throwForeign = runInNewContext(
    '(error => ({[Symbol.toPrimitive]() {throw error}}))'
  )
  let caught: unknown
  try {
    ToPrimitive(throwForeign(foreign.error), 'number')
  } catch (error) {
    caught = error
  }
  expect(caught).toBe(foreign.error)
  try {
    ToPrimitive(runInNewContext('({[Symbol.toPrimitive]: 1})'), 'number')
  } catch (error) {
    expect(error).toBeInstanceOf(TypeError)
    expect(error).not.toBeInstanceOf(foreign.TypeError)
    return
  }
  throw new Error('Expected current-realm TypeError')
})

it('uses ToString rather than the String function Symbol exception', () => {
  const symbol = Symbol('value')
  const inputs: [unknown, string][] = [
    [undefined, 'undefined'],
    [null, 'null'],
    [true, 'true'],
    [false, 'false'],
    ['', ''],
    [-0, '0'],
    [NaN, 'NaN'],
    [Infinity, 'Infinity'],
    [-Infinity, '-Infinity'],
    [23n, '23'],
    [runInNewContext('Object(23n)'), '23'],
  ]
  for (const [value, expected] of inputs) expect(ToString(value)).toBe(expected)
  for (const value of [
    symbol,
    Object(symbol),
    {[Symbol.toPrimitive]: () => symbol},
  ]) {
    expect(() => ToString(value)).toThrow(TypeError)
  }
  const events: unknown[] = []
  const input = {
    [Symbol.toPrimitive](hint: string) {
      events.push(this, hint)
      return 23n
    },
  }
  expect(ToString(input)).toBe('23')
  expect(events).toEqual([input, 'string'])
})

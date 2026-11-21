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

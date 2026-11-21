import {setDataProperty} from '#packages/ecma262-abstract/intrinsics.js'
import {expect, it} from 'vitest'
import {
  Day,
  DayFromYear,
  YearFromTime,
  HourFromTime,
  MinFromTime,
  SecFromTime,
  WeekDay,
} from '#packages/ecma262-abstract/DateOperations.js'

it.each([
  ['negative day', () => Day(-1), -1],
  ['leap-year origin', () => DayFromYear(2000), 10957],
  ['negative epoch year', () => YearFromTime(-1), 1969],
  ['negative epoch hour', () => HourFromTime(-1), 23],
  ['negative epoch minute', () => MinFromTime(-1), 59],
  ['negative epoch second', () => SecFromTime(-1), 59],
  ['negative epoch weekday', () => WeekDay(-1), 3],
] as const)(
  'computes %s without consulting mutable Math.floor',
  (_name, run, expected) => {
    const original = Math.floor
    let actual: unknown
    try {
      Math.floor = function () {
        throw new Error('Mutable Math.floor reached')
      }
      actual = run()
    } finally {
      Math.floor = original
    }
    expect(actual).toBe(expected)
  }
)

it('creates own data fields without mutable definition or inherited descriptor hooks', () => {
  const define = Object.defineProperty
  const originalDefine = Object.getOwnPropertyDescriptor(
    Object,
    'defineProperty'
  )!
  const originalGet = Object.getOwnPropertyDescriptor(Object.prototype, 'get')
  const prototype = {
    set field(_value: unknown) {
      throw new Error('Inherited data setter reached')
    },
  }
  const target = Object.create(prototype)
  const key = Symbol('record field')
  const value = {}
  try {
    define(Object.prototype, 'get', {
      configurable: true,
      get() {
        throw new Error('Inherited descriptor getter reached')
      },
    })
    define(Object, 'defineProperty', {
      __proto__: null,
      configurable: true,
      get() {
        throw new Error('Mutable data definition reached')
      },
    } as PropertyDescriptor)
    setDataProperty(target, 'field', 0)
    setDataProperty(target, key, value)
    setDataProperty(target, '__proto__', value)
  } finally {
    Reflect.deleteProperty(Object.prototype, 'get')
    if (originalGet) define(Object.prototype, 'get', originalGet)
    define(Object, 'defineProperty', originalDefine)
  }
  expect(Object.getPrototypeOf(target)).toBe(prototype)
  expect(Object.getOwnPropertyDescriptor(target, 'field')).toEqual({
    value: 0,
    writable: true,
    enumerable: true,
    configurable: true,
  })
  expect(target[key]).toBe(value)
  expect(Object.getOwnPropertyDescriptor(target, '__proto__')!.value).toBe(
    value
  )
})

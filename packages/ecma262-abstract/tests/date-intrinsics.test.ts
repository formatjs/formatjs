import {setDataProperty} from '#packages/ecma262-abstract/intrinsics.js'
import {expect, it} from 'vitest'
import {
  Day,
  DayFromYear,
  DaysInYear,
  DayWithinYear,
  InLeapYear,
  MonthFromTime,
  DateFromTime,
  msFromTime,
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

it('matches builtin UTC fields at every month boundary across a Gregorian cycle', () => {
  let checked = 0
  for (let year = -200; year < 200; year++) {
    const origin = new Date(0)
    origin.setUTCFullYear(year, 0, 1)
    const next = new Date(0)
    next.setUTCFullYear(year + 1, 0, 1)
    const expectedDays = (next.getTime() - origin.getTime()) / 86_400_000
    expect(DayFromYear(year)).toBe(origin.getTime() / 86_400_000)
    expect(DaysInYear(year)).toBe(expectedDays)
    for (let month = 0; month < 12; month++) {
      const boundary = new Date(0)
      boundary.setUTCFullYear(year, month, 1)
      for (const delta of [-1, 0, 1, 14 * 86_400_000 + 47_655_987]) {
        const time = boundary.getTime() + delta
        const expected = new Date(time)
        const enclosingOrigin = new Date(0)
        enclosingOrigin.setUTCFullYear(expected.getUTCFullYear(), 0, 1)
        const followingOrigin = new Date(0)
        followingOrigin.setUTCFullYear(expected.getUTCFullYear() + 1, 0, 1)
        const leap =
          followingOrigin.getTime() - enclosingOrigin.getTime() ===
          366 * 86_400_000
        const midnight = new Date(time)
        midnight.setUTCHours(0, 0, 0, 0)
        // The contract returns mathematical integers; both JS zero signs represent zero.
        expect(
          [
            Day(time) + 0,
            YearFromTime(time),
            DayWithinYear(time) + 0,
            InLeapYear(time),
            MonthFromTime(time),
            DateFromTime(time),
            WeekDay(time),
            HourFromTime(time),
            MinFromTime(time),
            SecFromTime(time),
            msFromTime(time),
          ],
          String(time)
        ).toEqual([
          midnight.getTime() / 86_400_000,
          expected.getUTCFullYear(),
          Math.floor((time - enclosingOrigin.getTime()) / 86_400_000),
          leap ? 1 : 0,
          expected.getUTCMonth(),
          expected.getUTCDate(),
          expected.getUTCDay(),
          expected.getUTCHours(),
          expected.getUTCMinutes(),
          expected.getUTCSeconds(),
          expected.getUTCMilliseconds(),
        ])
        checked++
      }
    }
  }
  expect(checked).toBe(19_200)
})

it.each([
  -8_640_000_000_000_000, -8_639_999_999_999_999, -2_208_988_800_001,
  -2_208_988_800_000, -1, -0, 0, 1, 951_782_399_999, 951_782_400_000,
  4_102_444_799_999, 4_102_444_800_000, 8_639_999_999_999_999,
  8_640_000_000_000_000,
])('extracts UTC fields at time-value boundary %s', time => {
  const expected = new Date(time)
  expect([
    YearFromTime(time),
    MonthFromTime(time),
    DateFromTime(time),
    WeekDay(time),
    HourFromTime(time),
    MinFromTime(time),
    SecFromTime(time),
    msFromTime(time),
  ]).toEqual([
    expected.getUTCFullYear(),
    expected.getUTCMonth(),
    expected.getUTCDate(),
    expected.getUTCDay(),
    expected.getUTCHours(),
    expected.getUTCMinutes(),
    expected.getUTCSeconds(),
    expected.getUTCMilliseconds(),
  ])
})

it('counts year origins beyond Date constructor clipping', () => {
  // The minimum Date is April 20; 109 days precede it in this common year.
  expect(DayFromYear(-271821)).toBe(-100_000_109)
  const lastYearOrigin = new Date(0)
  lastYearOrigin.setUTCFullYear(275760, 0, 1)
  expect(DayFromYear(275760)).toBe(lastYearOrigin.getTime() / 86_400_000)
})

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

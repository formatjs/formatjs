import {runfiles} from '@bazel/runfiles'
import {readFileSync} from 'node:fs'
import {expect, it} from 'vitest'
import {checkArithmeticCalendarOracle} from '#packages/temporal/tests/arithmetic-calendar-oracle.js'
import {
  arithmeticCalendars,
  calendarFromEpochDay,
  calendarToEpochDay,
  addCalendarDate,
  calendarDateUntilRaw,
} from '#packages/temporal/calendar.js'

it('matches independent ICU arithmetic calendars in both directions', () => {
  const file = runfiles.resolve(
    `${process.env.TEST_WORKSPACE || '_main'}/conformance-tests/icu4j/temporal-arithmetic-calendar-fixtures.tsv`
  )
  const counts = checkArithmeticCalendarOracle(
    readFileSync(file, 'utf8'),
    (actual, expected, line) => expect(actual, line).toBe(expected)
  )
  expect(counts.calendars).toBe(13)
  expect(counts.fields).toBe(34366)
  expect(counts.additions).toBe(32352)
  expect(counts.bounds).toBe(176)
  expect(counts.differences).toBe(32352)
}, 30_000)

it('preserves proleptic conversions across the full range', () => {
  for (const calendar of arithmeticCalendars)
    for (let epoch = -100000001; epoch <= 100000000; epoch += 98731) {
      const value = calendarFromEpochDay(calendar, epoch)
      expect(
        calendarToEpochDay(calendar, value, 'reject'),
        `${calendar} ${epoch}`
      ).toBe(epoch)
      const next = addCalendarDate(calendar, value, {days: 1}, 'constrain')
      expect(calendarToEpochDay(calendar, next, 'reject')).toBe(epoch + 1)
    }
}, 30_000)

it('balances calendar differences with one sign and exact endpoints', () => {
  for (const calendar of arithmeticCalendars)
    for (const one of [-719529, -35428, 0, 11016, 19782])
      for (const days of [-800, -365, -29, -1, 1, 29, 365, 800])
        for (const largest of ['year', 'month', 'week', 'day']) {
          const two = one + days
          const difference = calendarDateUntilRaw(calendar, one, two, largest)
          const label = `${calendar} ${one} ${two} ${largest}`
          for (const value of Object.values(difference)) {
            expect(value * Math.sign(days), label).toBeGreaterThanOrEqual(0)
            expect(Object.is(value, -0), label).toBe(false)
          }
          const result = addCalendarDate(
            calendar,
            calendarFromEpochDay(calendar, one),
            difference
          )
          expect(calendarToEpochDay(calendar, result), label).toBe(two)
        }
})

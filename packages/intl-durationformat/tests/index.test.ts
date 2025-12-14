import {DurationFormat} from '../src/core'
import {test, expect} from 'vitest'
test('Intl.DurationFormat resolvedOptions', function () {
  expect(new DurationFormat('en').resolvedOptions()).toEqual({
    days: 'short',
    daysDisplay: 'auto',
    fractionalDigits: undefined,
    hours: 'short',
    hoursDisplay: 'auto',
    locale: 'en',
    microseconds: 'short',
    microsecondsDisplay: 'auto',
    milliseconds: 'short',
    millisecondsDisplay: 'auto',
    minutes: 'short',
    minutesDisplay: 'auto',
    months: 'short',
    monthsDisplay: 'auto',
    nanoseconds: 'short',
    nanosecondsDisplay: 'auto',
    numberingSystem: 'latn',
    seconds: 'short',
    secondsDisplay: 'auto',
    style: 'short',
    weeks: 'short',
    weeksDisplay: 'auto',
    years: 'short',
    yearsDisplay: 'auto',
  })
})

test('Intl.DurationFormat format', function () {
  expect(new DurationFormat('en').format({years: 1})).toBe('1 yr')
  expect(new DurationFormat('en').format({years: 1, months: 2})).toBe(
    '1 yr, 2 mths'
  )
  expect(new DurationFormat('en').format({years: 1, months: 2, days: 3})).toBe(
    '1 yr, 2 mths, 3 days'
  )
  expect(
    new DurationFormat('en').format({years: 1, months: 2, days: 3, hours: 4})
  ).toBe('1 yr, 2 mths, 3 days, 4 hr')
  expect(
    new DurationFormat('en').format({
      years: 1,
      months: 2,
      days: 3,
      hours: 4,
      minutes: 5,
    })
  ).toBe('1 yr, 2 mths, 3 days, 4 hr, 5 min')
  expect(
    new DurationFormat('en').format({
      years: 1,
      months: 2,
      days: 3,
      hours: 4,
      minutes: 5,
      seconds: 6,
    })
  ).toBe('1 yr, 2 mths, 3 days, 4 hr, 5 min, 6 sec')
  expect(
    new DurationFormat('en').format({
      years: 1,
      months: 2,
      days: 3,
      hours: 4,
      minutes: 5,
      seconds: 6,
      milliseconds: 7,
    })
  ).toBe('1 yr, 2 mths, 3 days, 4 hr, 5 min, 6 sec, 7 ms')
})

test('Intl.DurationFormat format digital', function () {
  expect(new DurationFormat('en', {style: 'digital'}).format({years: 1})).toBe(
    '1 yr, 0:00:00'
  )
})

test('Intl.DurationFormat hours with 2-digit', function () {
  expect(
    new DurationFormat('en', {
      hours: '2-digit',
      minutes: '2-digit',
      seconds: '2-digit',
    }).format({
      hours: 5,
      minutes: 30,
      seconds: 15,
    })
  ).toBe('05:30:15')
})

// TODO: even Node 18 doesn't have NFv3 yet
test.skip('Intl.DurationFormat format with NumberFormatV3', function () {
  expect(
    new DurationFormat('en').format({
      years: 1,
      months: 2,
      days: 3,
      hours: 4,
      minutes: 5,
      seconds: 6,
      milliseconds: 7,
      microseconds: 8,
    })
  ).toBe('1 yr, 2 mths, 3 days, 4 hr, 5 min, 6 sec, 7 ms, 8 μs')
  expect(
    new DurationFormat('en').format({
      years: 1,
      months: 2,
      days: 3,
      hours: 4,
      minutes: 5,
      seconds: 6,
      milliseconds: 7,
      microseconds: 8,
      nanoseconds: 9,
    })
  ).toBe('1 yr, 2 mths, 3 days, 4 hr, 5 min, 6 sec, 7 ms, 8 μs, 9 ns')
})

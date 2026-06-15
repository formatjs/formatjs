import {DurationFormat} from '#packages/intl-durationformat/core.js'
import {type DurationFormatOptions} from '#packages/intl-durationformat/index.js'
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
  const customFormatterOptions: DurationFormatOptions = {style: 'digital'}

  expect(
    new DurationFormat('en', customFormatterOptions).format({years: 1})
  ).toBe('1 yr, 0:00:00')
  expect(
    new DurationFormat('en', customFormatterOptions).resolvedOptions()
      .milliseconds
  ).toBe('numeric')
  expect(
    new DurationFormat('en', customFormatterOptions).format({
      seconds: 1,
      milliseconds: 234,
    })
  ).toBe('0:00:01.234')
})

test('Intl.DurationFormat sub-second rollup is exact (#6462)', function () {
  // 1s + 473ms is exactly 1.473s. Float arithmetic — `1 + 473/1e3` —
  // lands on `1.4729999999999998650`, which `roundingMode: 'trunc'`
  // truncated to `1.472999999s` before the BigDecimal rewrite.
  expect(
    new DurationFormat('en', {
      milliseconds: 'numeric',
      style: 'narrow',
    }).format({milliseconds: 473, seconds: 1})
  ).toBe('1.473s')
  // Same kind of failure modes for milliseconds → microseconds and
  // microseconds → nanoseconds rollups.
  expect(
    new DurationFormat('en', {
      microseconds: 'numeric',
      style: 'narrow',
    }).format({milliseconds: 1, microseconds: 473})
  ).toBe('1.473ms')
  expect(
    new DurationFormat('en', {
      nanoseconds: 'numeric',
      style: 'narrow',
    }).format({microseconds: 1, nanoseconds: 473})
  ).toBe('1.473μs')
})

test('Intl.DurationFormat respects numberingSystem option (#6794)', function () {
  for (const locale of ['my-MM', 'bn-BD', 'ne-NP']) {
    const df = new DurationFormat(locale, {numberingSystem: 'latn'})
    expect(df.resolvedOptions().numberingSystem).toBe('latn')
    expect(
      df.formatToParts({years: 1}).find(part => part.type === 'integer')?.value
    ).toBe('1')
  }
  expect(
    new DurationFormat('my-MM', {
      hours: 'numeric',
      minutes: '2-digit',
      numberingSystem: 'latn',
      seconds: '2-digit',
      style: 'digital',
    }).format({
      hours: 1,
      minutes: 2,
      seconds: 3,
    })
  ).toBe('1:02:03')
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

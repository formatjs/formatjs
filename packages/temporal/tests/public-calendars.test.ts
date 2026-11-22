import {runfiles} from '@bazel/runfiles'
import {readFileSync} from 'node:fs'
import {expect, it} from 'vitest'
import {Temporal} from '#packages/temporal/index.js'
import {
  checkPublicCalendarOracle,
  checkCalendarDifferencePolicy,
  checkDifferenceOptionOrder,
  checkDateDifferenceUnitGroup,
} from '#packages/temporal/tests/public-calendar-oracle.js'

it('exposes ICU calendar fields, inverse bags and arithmetic through public classes', () => {
  const file = runfiles.resolve(
    `${process.env.TEST_WORKSPACE || '_main'}/conformance-tests/icu4j/temporal-arithmetic-calendar-fixtures.tsv`
  )
  const counts = checkPublicCalendarOracle(
    Temporal,
    readFileSync(file, 'utf8'),
    (actual, expected, line) => expect(actual, line).toBe(expected)
  )
  expect(counts.fields).toBe(34366)
  expect(counts.additions).toBe(32352)
  expect(counts.bounds).toBe(176)
  expect(counts.differences).toBe(32352)
  expect(counts.bridges).toBe(2021)
  expect(counts.windows).toBe(5408)
}, 60_000)

it('merges Hebrew years by monthCode and MonthDay updates without a reference year', () => {
  const value = Temporal.PlainDate.from({
    calendar: 'hebrew',
    year: 5784,
    monthCode: 'M06',
    day: 15,
  })
  const next = value.with({year: 5783})
  expect([next.year, next.month, next.monthCode, next.day]).toEqual([
    5783,
    6,
    'M06',
    15,
  ])
  const monthDay = Temporal.PlainMonthDay.from({
    calendar: 'hebrew',
    monthCode: 'M06',
    day: 1,
  })
  expect(monthDay.with({monthCode: 'M05L'}).monthCode).toBe('M05L')
})

it('resolves signed and regnal era years, rejects incomplete/conflicting eras', () => {
  const value = Temporal.PlainDate.from({
    calendar: 'japanese',
    era: 'reiwa',
    eraYear: 1,
    month: 1,
    day: 1,
  })
  expect([value.year, value.era, value.eraYear]).toEqual([2019, 'heisei', 31])
  expect(value.with({month: 5}).era).toBe('reiwa')
  const bce = Temporal.PlainDate.from({
    calendar: 'gregory',
    era: 'bc',
    eraYear: 2,
    monthCode: 'M02',
    day: 3,
  })
  expect([bce.year, bce.era, bce.eraYear]).toEqual([-1, 'bce', 2])
  expect(() => bce.with({eraYear: 3})).toThrow(TypeError)
  expect(() =>
    Temporal.PlainDate.from({
      calendar: 'gregory',
      year: 2020,
      era: 'bce',
      eraYear: 2,
      month: 1,
      day: 1,
    })
  ).toThrow(RangeError)
  expect(() =>
    Temporal.PlainDate.from({
      calendar: 'gregory',
      year: 2020,
      era: 'ce',
      month: 1,
      day: 1,
    })
  ).toThrow(TypeError)
  expect(() =>
    Temporal.PlainDate.from({
      calendar: 'gregory',
      era: 'CE',
      eraYear: 2020,
      month: 1,
      day: 1,
    })
  ).toThrow(RangeError)
  expect(
    Temporal.PlainDate.from({
      calendar: 'ethiopic',
      era: 'aa',
      eraYear: 5500,
      month: 1,
      day: 1,
    }).year
  ).toBe(0)
})

it('reads calendar-specific fields alphabetically and ignores eras for ISO', () => {
  const calls: string[] = []
  const bag = new Proxy(
    {calendar: 'buddhist', era: 'be', eraYear: 2567, month: 2, day: 29},
    {
      get(target, key, receiver) {
        calls.push(String(key))
        return Reflect.get(target, key, receiver)
      },
    }
  )
  expect(Temporal.PlainDate.from(bag).toString()).toBe(
    '2024-02-29[u-ca=buddhist]'
  )
  expect(calls).toEqual([
    'calendar',
    'day',
    'era',
    'eraYear',
    'month',
    'monthCode',
    'year',
  ])
  const iso = {
    year: 2024,
    month: 2,
    day: 29,
    get era() {
      throw new Error('ISO must not read era')
    },
    get eraYear() {
      throw new Error('ISO must not read eraYear')
    },
  }
  expect(Temporal.PlainDate.from(iso).day).toBe(29)
  expect(Temporal.PlainDateTime.from(iso).day).toBe(29)
  expect(Temporal.PlainYearMonth.from(iso).month).toBe(2)
  expect(Temporal.PlainMonthDay.from(iso).day).toBe(29)
  const zoned = Object.create(null, Object.getOwnPropertyDescriptors(iso))
  zoned.timeZone = 'UTC'
  expect(Temporal.ZonedDateTime.from(zoned).day).toBe(29)
  expect(
    Temporal.Duration.from('P1D').total({unit: 'hour', relativeTo: iso})
  ).toBe(24)
})

it('canonicalizes calendar aliases and preserves fixed 13-month arithmetic', () => {
  expect(new Temporal.PlainDate(2024, 1, 1, 'islamicc').calendarId).toBe(
    'islamic-civil'
  )
  expect(
    new Temporal.PlainDate(2024, 1, 1, 'ETHIOPIC-AMETE-ALEM').calendarId
  ).toBe('ethioaa')
  const date = Temporal.PlainDate.from({
    calendar: 'coptic',
    year: 1739,
    monthCode: 'M13',
    day: 6,
  })
  expect(date.add({days: 1}).monthCode).toBe('M01')
  expect(date.toPlainYearMonth().add({months: 1}).month).toBe(1)
  const monthDay = Temporal.PlainMonthDay.from({
    calendar: 'coptic',
    monthCode: 'M13',
    day: 99,
  })
  expect(monthDay.day).toBe(6)
  expect(() =>
    Temporal.PlainMonthDay.from(
      {calendar: 'coptic', monthCode: 'M13', day: 7},
      {overflow: 'reject'}
    )
  ).toThrow(RangeError)
  expect(() =>
    Temporal.PlainMonthDay.from({calendar: 'gregory', month: 2, day: 29})
  ).toThrow(TypeError)
})

it('checks missing fields before era consistency and supports extended YearMonth references', () => {
  expect(() =>
    Temporal.PlainDate.from({
      calendar: 'japanese',
      era: 'invalid',
      eraYear: 1,
      month: 1,
    })
  ).toThrow(TypeError)
  expect(() =>
    Temporal.PlainYearMonth.from({
      calendar: 'japanese',
      era: 'invalid',
      eraYear: 1,
    })
  ).toThrow(TypeError)
  const value = new Temporal.PlainYearMonth(-271821, 4, 'gregory', 1)
  expect([value.era, value.eraYear]).toEqual(['bce', 271822])
})

it('keeps branded calendars when converting zoned and short-date values', () => {
  const date = Temporal.PlainDate.from({
    calendar: 'coptic',
    year: 1739,
    monthCode: 'M13',
    day: 6,
  })
  const zoned = date.toZonedDateTime('UTC')
  Object.defineProperty(zoned, 'calendar', {
    get() {
      throw new Error('Branded calendar must use internal slot')
    },
  })
  const yearMonth = Temporal.PlainYearMonth.from(zoned)
  const monthDay = Temporal.PlainMonthDay.from(zoned)
  expect([
    yearMonth.calendarId,
    yearMonth.monthCode,
    monthDay.calendarId,
    monthDay.monthCode,
  ]).toEqual(['coptic', 'M13', 'coptic', 'M13'])
  Object.defineProperty(yearMonth, 'calendar', {
    get() {
      throw new Error('Branded calendar must use internal slot')
    },
  })
  Object.assign(yearMonth, {day: 6})
  expect(Temporal.PlainDate.from(yearMonth).toString()).toBe(date.toString())
  expect(Temporal.PlainDateTime.from(yearMonth).toPlainDate().toString()).toBe(
    date.toString()
  )
})

it('compares calendar difference prefixes before clamping month ends and leap months', () => {
  for (const calendar of [
    'iso8601',
    'gregory',
    'buddhist',
    'japanese',
    'roc',
  ]) {
    const start = new Temporal.PlainDate(1970, 1, 29, calendar)
    const end = new Temporal.PlainDate(1970, 2, 28, calendar)
    expect(start.until(end, {largestUnit: 'year'}).toString()).toBe('P30D')
    expect(end.since(start, {largestUnit: 'month'}).toString()).toBe('P30D')
  }
  const leap = Temporal.PlainDate.from({
    calendar: 'hebrew',
    year: 5784,
    monthCode: 'M05L',
    day: 1,
  })
  const common = Temporal.PlainDate.from({
    calendar: 'hebrew',
    year: 5783,
    monthCode: 'M06',
    day: 1,
  })
  expect(leap.until(common, {largestUnit: 'year'}).toString()).toBe('-P12M')
  const last = Temporal.PlainDate.from({
    calendar: 'coptic',
    year: 1739,
    monthCode: 'M13',
    day: 6,
  })
  const next = Temporal.PlainDate.from({
    calendar: 'coptic',
    year: 1740,
    monthCode: 'M13',
    day: 5,
  })
  expect(last.until(next, {largestUnit: 'year'}).toString()).toBe('P12M29D')
})

it('keeps rounded month quanta while unrounded month-end differences keep days', () => {
  const start = Temporal.PlainDate.from('2020-01-31'),
    end = Temporal.PlainDate.from('2020-02-29')
  expect(start.until(end, {largestUnit: 'month'}).toString()).toBe('P29D')
  expect(
    start.until(end, {largestUnit: 'month', smallestUnit: 'month'}).toString()
  ).toBe('P1M')
  expect(
    Temporal.PlainDateTime.from('2020-01-31T23:30')
      .until('2020-03-01T00:15', {largestUnit: 'year'})
      .toString()
  ).toBe('P29DT45M')
})

it('keeps leap-month difference policy separate from constrained year addition', () => {
  checkCalendarDifferencePolicy(Temporal, (actual, expected, context) =>
    expect(actual, context).toBe(expected)
  )
})

it('validates difference unit spellings before later option getters', () => {
  checkDifferenceOptionOrder(Temporal, (actual, expected, context) =>
    expect(actual, context).toBe(expected)
  )
})

it('rejects date unit groups without reading a private negative array index', () => {
  checkDateDifferenceUnitGroup(Temporal, (actual, expected, context) =>
    expect(actual, context).toBe(expected)
  )
})

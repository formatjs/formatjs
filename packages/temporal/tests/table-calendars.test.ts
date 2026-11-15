import {runfiles} from '@bazel/runfiles'
import {readFileSync} from 'node:fs'
import {expect, it} from 'vitest'
import {Temporal} from '#packages/temporal/index.js'
import {
  calendarFromEpochDayRaw,
  calendarDateUntilRaw,
} from '#packages/temporal/calendar.js'
import {checkPublicCalendarOracle} from '#packages/temporal/tests/public-calendar-oracle.js'

it('matches independent ICU, HKO and KASI fields, arithmetic and relative totals', () => {
  const file = runfiles.resolve(
    `${process.env.TEST_WORKSPACE || '_main'}/conformance-tests/icu4j/temporal-table-calendar-fixtures.tsv`
  )
  const counts = checkPublicCalendarOracle(
    readFileSync(file, 'utf8'),
    (actual, expected, line) => expect(actual, line).toBe(expected)
  )
  expect(counts).toEqual({
    fields: 15932,
    additions: 6720,
    bounds: 0,
    bridges: 937,
    differences: 6720,
    windows: 1248,
  })
}, 60_000)

it('constrains absent leap months backward and uses prescribed MonthDay references', () => {
  for (const calendar of ['chinese', 'dangi']) {
    const leap = Temporal.PlainDate.from({
      calendar,
      year: 2023,
      monthCode: 'M02L',
      day: 29,
    })
    expect(leap.monthCode).toBe('M02L')
    expect(leap.add({years: 1}).monthCode).toBe('M02')
    expect(() => leap.add({years: 1}, {overflow: 'reject'})).toThrow(RangeError)
    expect(
      Temporal.PlainMonthDay.from({calendar, monthCode: 'M11L', day: 15})
        .toString()
        .startsWith('2034-')
    ).toBe(true)
    expect(
      Temporal.PlainMonthDay.from({calendar, monthCode: 'M02L', day: 30})
        .monthCode
    ).toBe('M02')
  }
})

it('matches all published HKO month starts, lengths and month additions', () => {
  const file = runfiles.resolve(
    `${process.env.TEST_WORKSPACE || '_main'}/conformance-tests/calendar-authorities/hko-month-starts.tsv`
  )
  const rows = readFileSync(file, 'utf8')
    .trim()
    .split('\n')
    .filter(line => !line.startsWith('#'))
    .map(line => line.split('\t'))
  expect(rows).toHaveLength(2474)
  for (let index = 0; index < rows.length; index++) {
    const [epoch, year, code] = rows[index],
      value = new Temporal.PlainDate(1970, 1, 1)
        .add({days: +epoch})
        .withCalendar('chinese')
    expect(
      [value.year, value.monthCode, value.day],
      rows[index].join('\t')
    ).toEqual([+year, code, 1])
    if (index + 1 < rows.length) {
      const length = +rows[index + 1][0] - +epoch
      expect(value.daysInMonth).toBe(length)
      expect(value.add({months: 1}).toString()).toBe(
        new Temporal.PlainDate(1970, 1, 1)
          .add({days: +rows[index + 1][0]})
          .withCalendar('chinese')
          .toString()
      )
    }
  }
}, 60_000)

it('uses KASI 2017 month boundaries and leap month 5', () => {
  const february = new Temporal.PlainDate(2017, 2, 26, 'dangi')
  expect([february.monthCode, february.day, february.daysInMonth]).toEqual([
    'M02',
    1,
    30,
  ])
  const first = new Temporal.PlainDate(2017, 6, 24, 'dangi')
  expect([first.year, first.monthCode, first.day]).toEqual([2017, 'M05L', 1])
  expect(first.add({days: 28}).day).toBe(29)
  expect(first.add({days: 29}).monthCode).toBe('M06')
})

it('retains full public ranges and internal rounding coordinates for table calendars', () => {
  for (const calendar of ['chinese', 'dangi', 'islamic-umalqura'] as const) {
    for (const epoch of [-100000001, -100000000, 0, 99999999, 100000000]) {
      const iso = calendarFromEpochDayRaw('iso8601', epoch),
        value = new Temporal.PlainDate(iso.year, iso.month, iso.day, calendar)
      expect(
        Temporal.PlainDate.from({
          calendar,
          year: value.year,
          monthCode: value.monthCode,
          day: value.day,
        }).toString()
      ).toBe(value.toString())
      expect(value.add({days: 0}).toString()).toBe(value.toString())
    }
    expect(
      calendarDateUntilRaw(calendar, -110000000, 110000000, 'year').years
    ).toBeGreaterThan(600000)
  }
})

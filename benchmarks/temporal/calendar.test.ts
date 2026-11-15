import {runfiles} from '@bazel/runfiles'
import {readFileSync} from 'node:fs'
import {expect, it} from 'vitest'
import {Temporal} from 'temporal-polyfill/full/implementation'
import {
  addCalendarDate,
  calendarDaysUntil,
  calendarFromEpochDay,
  calendarToEpochDay,
  daysInMonth,
  type CalendarId,
  type DateDuration,
} from './calendar.js'

it('matches independent ICU Hebrew fields in both directions across the oracle range', () => {
  const path = runfiles.resolve(
    `${process.env.TEST_WORKSPACE || '_main'}/conformance-tests/icu4j/temporal-calendar-fixtures.tsv`
  )
  let samples = 0
  for (const line of readFileSync(path, 'utf8').trim().split('\n')) {
    if (line.startsWith('#')) continue
    const [epoch, year, month, monthCode, day] = line.split('\t')
    const fields = {year: +year, month: +month, monthCode, day: +day}
    expect(calendarFromEpochDay('hebrew', +epoch), epoch).toEqual(fields)
    expect(calendarToEpochDay('hebrew', fields, 'reject'), epoch).toBe(+epoch)
    const iso = calendarFromEpochDay('iso8601', +epoch)
    expect(calendarToEpochDay('iso8601', iso, 'reject'), epoch).toBe(+epoch)
    samples++
  }
  expect(samples).toBeGreaterThan(6000)
  console.log(
    `${samples} independent ICU calendar conversions, both directions`
  )
})
it('handles Hebrew leap months, variable month lengths and overflow', () => {
  expect(calendarFromEpochDay('hebrew', 0)).toEqual({
    year: 5730,
    month: 4,
    monthCode: 'M04',
    day: 23,
  })
  expect(
    addCalendarDate(
      'hebrew',
      {year: 5784, monthCode: 'M05L', day: 30},
      {years: 1}
    )
  ).toEqual({year: 5785, month: 6, monthCode: 'M06', day: 29})
  expect(() =>
    addCalendarDate(
      'hebrew',
      {year: 5784, monthCode: 'M05L', day: 30},
      {years: 1},
      'reject'
    )
  ).toThrow(RangeError)
  expect(() =>
    calendarToEpochDay('hebrew', {
      year: 5784,
      month: 6,
      monthCode: 'M06',
      day: 1,
    })
  ).toThrow(RangeError)
  expect(() =>
    calendarToEpochDay('iso8601', {year: 2024, monthCode: 'M05L', day: 1})
  ).toThrow(RangeError)
  expect(daysInMonth('iso8601', 1900, 2)).toBe(28)
  expect(daysInMonth('iso8601', 2000, 2)).toBe(29)
  expect(
    addCalendarDate(
      'iso8601',
      {year: 2000, month: 2, day: 29},
      {years: 1, months: 1}
    )
  ).toMatchObject({year: 2001, month: 3, day: 29})
  expect(() =>
    addCalendarDate(
      'iso8601',
      {year: 2000, month: 1, day: 1},
      {years: 1, days: -1}
    )
  ).toThrow(RangeError)
  for (const epoch of [-100000002, 100000001])
    expect(() => calendarFromEpochDay('hebrew', epoch)).toThrow(RangeError)
})
it.each(['iso8601', 'hebrew'] as CalendarId[])(
  'matches forced polyfill %s calendar arithmetic across leap cycles',
  calendar => {
    const durations: DateDuration[] = [
      {years: 1},
      {years: -1},
      {months: 1},
      {months: -13},
      {months: 235},
      {years: 2, months: 3, weeks: 1, days: 2},
      {years: -2, months: -3, weeks: -1, days: -2},
    ]
    for (let epoch = 10957; epoch < 19723; epoch += 113) {
      const iso = calendarFromEpochDay('iso8601', epoch)
      const reference = Temporal.PlainDate.from({
        ...iso,
        calendar: 'iso8601',
      }).withCalendar(calendar)
      const fields = calendarFromEpochDay(calendar, epoch)
      expect(fields).toEqual({
        year: reference.year,
        month: reference.month,
        monthCode: reference.monthCode,
        day: reference.day,
      })
      for (const duration of durations) {
        const expected = reference.add(duration)
        const actual = addCalendarDate(calendar, fields, duration)
        expect(actual, `${epoch} ${JSON.stringify(duration)}`).toEqual({
          year: expected.year,
          month: expected.month,
          monthCode: expected.monthCode,
          day: expected.day,
        })
        expect(calendarDaysUntil(calendar, fields, actual)).toBe(
          expected
            .withCalendar('iso8601')
            .since(reference.withCalendar('iso8601'), {largestUnit: 'days'})
            .days
        )
      }
    }
  }
)

it('round-trips and matches forced Hebrew arithmetic at full-range boundaries', () => {
  for (const epoch of [
    -100000001, -100000000, -99999969, -2000000, -1, 0, 99999969, 100000000,
  ]) {
    const iso = calendarFromEpochDay('iso8601', epoch)
    const reference = new Temporal.PlainDate(
      iso.year,
      iso.month,
      iso.day,
      'hebrew'
    )
    const fields = calendarFromEpochDay('hebrew', epoch)
    expect(fields, String(epoch)).toEqual({
      year: reference.year,
      month: reference.month,
      monthCode: reference.monthCode,
      day: reference.day,
    })
    expect(calendarToEpochDay('hebrew', fields, 'reject')).toBe(epoch)
  }
})

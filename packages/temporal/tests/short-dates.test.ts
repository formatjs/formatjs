import {it, expect} from 'vitest'
import {readFileSync} from 'node:fs'
import {runfiles} from '@bazel/runfiles'
import {Temporal as reference} from 'temporal-polyfill/implementation'
import {Temporal as fullReference} from 'temporal-polyfill/full/implementation'
import {Temporal} from '#packages/temporal/index.js'
import type {RoundingMode} from '#packages/temporal/rounding.js'

it('does not observe array iteration while preparing builtin calendar fields', () => {
  const original = Array.prototype[Symbol.iterator]
  let added: ReturnType<typeof Temporal.PlainYearMonth.from> | undefined
  let subtracted: ReturnType<typeof Temporal.PlainYearMonth.from> | undefined
  let since: ReturnType<typeof Temporal.Duration.from> | undefined
  let rounded: ReturnType<typeof Temporal.Duration.from> | undefined
  Array.prototype[Symbol.iterator] = function () {
    throw new Error('Observable Array iterator')
  }
  try {
    const value = new Temporal.PlainYearMonth(2023, 5)
    added = value.add('P1M')
    subtracted = value.subtract({years: 5, months: 2})
    since = value.since({year: 2005, month: 3})
    rounded = value.since(
      {year: 2005, month: 3},
      {largestUnit: 'month', smallestUnit: 'month', roundingIncrement: 3}
    )
  } finally {
    Array.prototype[Symbol.iterator] = original
  }
  expect(added!.toJSON()).toBe('2023-06')
  expect(subtracted!.toJSON()).toBe('2018-03')
  expect(since!.toJSON()).toBe('P18Y2M')
  expect(rounded!.toJSON()).toBe('P216M')
})

it('matches independent ICU arithmetic, metadata, reference years and calendar-span rounding', () => {
  const path = runfiles.resolve(
    `${process.env.TEST_WORKSPACE || '_main'}/conformance-tests/icu4j/temporal-short-date-fixtures.tsv`
  )
  let count = 0
  for (const line of readFileSync(path, 'utf8').trim().split('\n')) {
    if (line.startsWith('#')) continue
    const fields = line.split('\t'),
      values = fields.map(Number)
    if (fields[0] === 'ym') {
      const start = new Temporal.PlainYearMonth(
        values[1],
        values[2],
        'iso8601',
        values[3]
      )
      const run = () => start.add({years: values[4], months: values[5]})
      if (fields[10] === 'false') expect(run, line).toThrow(RangeError)
      else {
        const actual = run()
        expect(
          [actual.year, actual.month, actual.daysInMonth, actual.daysInYear],
          line
        ).toEqual(values.slice(6, 10))
        expect(
          actual.equals(new Temporal.PlainYearMonth(values[6], values[7])),
          line
        ).toBe(true)
      }
    } else if (fields[0] === 'md') {
      const start = new Temporal.PlainMonthDay(
        values[1],
        values[2],
        'iso8601',
        values[3]
      )
      const run = () => start.toPlainDate({year: values[4]})
      if (fields[6] === 'false') expect(run, line).toThrow(RangeError)
      else {
        const actual = run()
        expect([actual.year, actual.month, actual.day], line).toEqual([
          values[4],
          values[1],
          values[5],
        ])
      }
    } else {
      const start = new Temporal.PlainYearMonth(values[1], values[2]),
        end = new Temporal.PlainYearMonth(values[3], values[4])
      const options = {
        largestUnit: fields[5],
        smallestUnit: fields[5],
        roundingIncrement: values[6],
        roundingMode: fields[7] as RoundingMode,
      }
      const until = start.until(end, options),
        since = start.since(end, options)
      expect(until.years * 12 + until.months, line).toBe(values[8])
      expect(since.years * 12 + since.months, line).toBe(values[9])
    }
    count++
  }
  expect(count).toBeGreaterThan(2000)
  console.log(`${count} independent ICU short-date cases`)
})

it('preserves reference fields, normalizes parsed strings and ignores public date overrides', () => {
  for (const text of [
    '2020-02',
    '+275760-09-30',
    '-271821-04',
    '2020-02-29T12:34:56+05:30',
  ]) {
    expect(
      Temporal.PlainYearMonth.from(text).toString({calendarName: 'always'})
    ).toBe(
      reference.PlainYearMonth.from(text).toString({calendarName: 'always'})
    )
  }
  for (const text of [
    '02-29',
    '--0229',
    '2000-02-29',
    '+999999-10-01',
    '-999999-10-01',
  ]) {
    expect(
      Temporal.PlainMonthDay.from(text).toString({calendarName: 'always'})
    ).toBe(
      reference.PlainMonthDay.from(text).toString({calendarName: 'always'})
    )
  }
  const date = new Temporal.PlainDate(2020, 2, 29)
  Object.defineProperty(date, 'year', {
    get() {
      throw new Error('public getter')
    },
  })
  expect(date.toPlainYearMonth().toJSON()).toBe('2020-02')
  expect(date.toPlainMonthDay().toJSON()).toBe('02-29')
  expect(
    new Temporal.PlainYearMonth(2020, 2, 'iso8601', 2).equals(
      new Temporal.PlainYearMonth(2020, 2)
    )
  ).toBe(false)
  expect(
    new Temporal.PlainMonthDay(2, 29, 'iso8601', 2000).equals(
      new Temporal.PlainMonthDay(2, 29)
    )
  ).toBe(false)
})

it('preserves Hebrew month codes through short-date conversion and leap years', () => {
  for (const text of [
    '1900-01-01',
    '1972-01-01',
    '1972-12-31',
    '2023-03-01',
    '2024-03-01',
    '2024-10-03',
    '2100-12-31',
  ]) {
    const date = Temporal.PlainDate.from(text).withCalendar('hebrew')
    const control = fullReference.PlainDate.from(text).withCalendar('hebrew')
    const ym = date.toPlainYearMonth(),
      md = date.toPlainMonthDay()
    expect(ym.toJSON(), text).toBe(control.toPlainYearMonth().toJSON())
    expect(md.toJSON(), text).toBe(control.toPlainMonthDay().toJSON())
    expect(ym.add('P1Y1M').toJSON(), text).toBe(
      control.toPlainYearMonth().add('P1Y1M').toJSON()
    )
    expect(md.toPlainDate({year: 5785}).toJSON(), text).toBe(
      control.toPlainMonthDay().toPlainDate({year: 5785}).toJSON()
    )
  }
})

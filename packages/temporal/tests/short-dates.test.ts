import {checkDateOutputOracle} from '#packages/temporal/tests/date-output-oracle.js'
import {it, expect} from 'vitest'
import {readFileSync} from 'node:fs'
import {runfiles} from '@bazel/runfiles'
import {Temporal as reference} from 'temporal-polyfill/implementation'
import {Temporal as fullReference} from 'temporal-polyfill/full/implementation'
import {Temporal} from '#packages/temporal/index.js'

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

it('matches independent ICU short dates and serialization controls', () => {
  const fixture = readFileSync(
    runfiles.resolve(
      `${process.env.TEST_WORKSPACE || '_main'}/conformance-tests/icu4j/temporal-short-date-fixtures.tsv`
    ),
    'utf8'
  )
  checkDateOutputOracle(Temporal, fixture, (actual, expected, context) =>
    expect(actual, context).toBe(expected)
  )
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

import {it, expect} from 'vitest'
import {readFileSync} from 'node:fs'
import {runfiles} from '@bazel/runfiles'
import {Temporal as reference} from 'temporal-polyfill/implementation'
import {Temporal} from '#packages/temporal/index.js'
import {
  epochNanosecondsToISO,
  isoToEpochNanoseconds,
} from '#packages/temporal/kernel.js'

it('matches independent ICU proleptic Gregorian arithmetic and date metadata', () => {
  const file = runfiles.resolve(
    `${process.env.TEST_WORKSPACE || '_main'}/conformance-tests/icu4j/temporal-date-arithmetic-fixtures.tsv`
  )
  let count = 0
  for (const line of readFileSync(file, 'utf8').trim().split('\n')) {
    if (line.startsWith('#')) continue
    const values = line.split('\t'),
      numeric = values.map(Number)
    const input = Temporal.PlainDateTime.from(
      epochNanosecondsToISO(BigInt(values[0]))
    )
    const duration = {
      years: numeric[1],
      months: numeric[2],
      weeks: numeric[3],
      days: numeric[4],
      nanoseconds: numeric[5],
    }
    const expected = BigInt(values[6]),
      limit = 8_640_000_000_000_000_000_000n + 86_400_000_000_000n
    if (expected <= -limit || expected >= limit)
      expect(() => input.add(duration), line).toThrow(RangeError)
    else {
      const actual = input.add(duration)
      const fields = {
        year: actual.year,
        month: actual.month,
        day: actual.day,
        hour: actual.hour,
        minute: actual.minute,
        second: actual.second,
        millisecond: actual.millisecond,
        microsecond: actual.microsecond,
        nanosecond: actual.nanosecond,
      }
      expect(isoToEpochNanoseconds(fields), line).toBe(expected)
      expect(
        [
          actual.year,
          actual.month,
          actual.day,
          actual.dayOfWeek,
          actual.dayOfYear,
          actual.weekOfYear,
          actual.yearOfWeek,
        ],
        line
      ).toEqual(numeric.slice(7))
    }
    count++
  }
  expect(count).toBe(840)
  console.log(`${count} independent ICU calendar arithmetic/metadata cases`)
})

it('preserves private slots during conversions and rounds across midnight', () => {
  const value = new Temporal.PlainDateTime(
    2020,
    2,
    29,
    23,
    59,
    59,
    999,
    999,
    999
  )
  Object.defineProperty(value, 'year', {
    get() {
      throw new Error('public getter')
    },
  })
  expect(Temporal.PlainDate.from(value).toJSON()).toBe('2020-02-29')
  expect(Temporal.PlainTime.from(value).toJSON()).toBe('23:59:59.999999999')
  expect(value.round('second').toJSON()).toBe('2020-03-01T00:00:00')
  expect(() => Temporal.PlainTime.from('12:00').with(value)).toThrow(TypeError)
  expect(() => value.add('P1Y', {overflow: 'reject'})).toThrow(RangeError)
  for (const text of [
    '2020-02-29T23:59:59.999999999',
    '1970-01-01T00',
    '-000001-12-31T12:34',
    '2000-01-31T23',
  ]) {
    for (const duration of ['P1Y1M', '-P1M', 'PT25H', '-PT0.000000001S']) {
      expect(Temporal.PlainDateTime.from(text).add(duration).toJSON()).toBe(
        reference.PlainDateTime.from(text).add(duration).toJSON()
      )
    }
  }
})

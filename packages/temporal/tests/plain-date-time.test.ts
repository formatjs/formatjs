import {it, expect, vi} from 'vitest'
import {readFileSync} from 'node:fs'
import {runfiles} from '@bazel/runfiles'
import {Temporal as reference} from 'temporal-polyfill/implementation'
import {Temporal} from '#packages/temporal/index.js'
import {checkPlainArithmeticOracle} from '#packages/temporal/tests/plain-arithmetic-oracle.js'

it('matches independent ICU arithmetic, metadata and clock carry', () => {
  const fixture = (name: string) =>
    readFileSync(
      runfiles.resolve(
        `${process.env.TEST_WORKSPACE || '_main'}/conformance-tests/icu4j/temporal-${name}-fixtures.tsv`
      ),
      'utf8'
    )
  const rows = (name: string) =>
    fixture(name)
      .trim()
      .split('\n')
      .filter(line => !line.startsWith('#'))
      .map(line => line.split('\t'))
  checkPlainArithmeticOracle(
    Temporal,
    fixture('date-arithmetic'),
    rows('time-carry'),
    rows('duration'),
    (actual, expected, context) => expect(actual, context).toBe(expected)
  )
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
it('reads clock fields without inherited native metadata', () => {
  const value = new Temporal.PlainDateTime(
    2024,
    2,
    29,
    12,
    34,
    56,
    123,
    456,
    789
  )
  const original = Object.getOwnPropertyDescriptor(
    Object.prototype,
    'properties'
  )
  let fields: number[] | undefined
  Object.defineProperty(Object.prototype, 'properties', {
    configurable: true,
    get() {
      throw new Error('Inherited native metadata')
    },
  })
  try {
    fields = [
      value.hour,
      value.minute,
      value.second,
      value.millisecond,
      value.microsecond,
      value.nanosecond,
    ]
  } finally {
    if (original)
      Object.defineProperty(Object.prototype, 'properties', original)
    else Reflect.deleteProperty(Object.prototype, 'properties')
  }
  expect(fields).toEqual([12, 34, 56, 123, 456, 789])
})

it('combines a date and time without calling the public PlainTime.from', () => {
  const from = vi.spyOn(Temporal.PlainTime, 'from').mockImplementation(() => {
    throw new Error('public PlainTime.from called')
  })
  try {
    const date = new Temporal.PlainDate(2000, 1, 2)
    const dt = date.toPlainDateTime('23:59:59.123456789')
    expect(dt.toString()).toBe('2000-01-02T23:59:59.123456789')
    expect(dt.withPlainTime({hour: 5}).hour).toBe(5)
    expect(dt.withPlainTime().hour).toBe(0)
    expect(() => dt.withPlainTime(null)).toThrow(TypeError)
    expect(from).not.toHaveBeenCalled()
  } finally {
    from.mockRestore()
  }
})

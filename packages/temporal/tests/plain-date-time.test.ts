import {it, expect} from 'vitest'
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

it('rejects malformed month codes before reading later fields', () => {
  const later = new Error('year getter reached')
  const convert = [
    (fields: object) => Temporal.PlainDate.from(fields),
    (fields: object) => Temporal.PlainDateTime.from(fields),
    (fields: object) => Temporal.PlainYearMonth.from(fields),
    (fields: object) => Temporal.PlainMonthDay.from(fields),
    (fields: object) => new Temporal.PlainDate(2020, 1, 1).with(fields),
    (fields: object) => new Temporal.PlainDateTime(2020, 1, 1).with(fields),
  ]
  for (const monthCode of ['M00', 'M01\n', 'M01\r', 'M01\u2028', 'M01\u2029']) {
    for (const from of convert) {
      expect(
        () =>
          from({
            day: 1,
            monthCode,
            get year(): never {
              throw later
            },
          }),
        JSON.stringify(monthCode)
      ).toThrow(RangeError)
    }
  }
})

it('defers calendar-specific month code checks until after field preparation', () => {
  const later = new Error('year getter reached')
  for (const monthCode of ['M00L', 'M13', 'M99', 'M99L']) {
    expect(
      () =>
        Temporal.PlainDate.from({
          day: 1,
          monthCode,
          get year(): never {
            throw later
          },
        }),
      monthCode
    ).toThrow(later)
  }
})

it('reads string overflow after syntax and calendar but before range checks', () => {
  const reached = new Error('overflow getter reached')
  for (const from of [Temporal.PlainDate.from, Temporal.PlainDateTime.from]) {
    for (const text of ['+999999-01-01', '+275760-09-14T12:34']) {
      expect(() =>
        from(text, {
          get overflow(): never {
            throw reached
          },
        })
      ).toThrow(reached)
      expect(() => from(text, 1 as never)).toThrow(TypeError)
    }
    for (const text of [
      '2020-02-30',
      '2020-01-01T24:00',
      '2020-01-01[u-ca=unknown]',
    ]) {
      expect(() =>
        from(text, {
          get overflow(): never {
            throw reached
          },
        })
      ).toThrow(RangeError)
    }
    let reads = 0
    from('2020-02-29T12:34', {
      get overflow() {
        reads++
        return 'reject' as const
      },
    })
    expect(reads).toBe(1)
  }
  expect(Temporal.PlainDate.from('-271821-04-19T23:59').toString()).toBe(
    '-271821-04-19'
  )
  expect(() =>
    Temporal.PlainDateTime.from('-271821-04-19T00:00', {
      get overflow(): never {
        throw reached
      },
    })
  ).toThrow(reached)
})

it('extracts calendars from valid strings outside the Temporal date range', () => {
  const date = Temporal.PlainDate.from('2020-02-29')
  const datetime = Temporal.PlainDateTime.from('2020-02-29T12:34')
  const zoned = Temporal.ZonedDateTime.from('2020-02-29T12:34[UTC]')
  for (const text of [
    '+999999-01-01',
    '-999999-12-31T23:59:60.123456789Z[Unknown/Zone]',
    '+275760-09-14T12:34+23:59[u-ca=ISO8601]',
  ]) {
    expect(date.withCalendar(text).toString(), text).toBe('2020-02-29')
    expect(datetime.withCalendar(text).toString(), text).toBe(
      '2020-02-29T12:34:00'
    )
    expect(zoned.withCalendar(text).toString(), text).toBe(
      '2020-02-29T12:34:00+00:00[UTC]'
    )
    expect(
      Temporal.PlainDate.from({
        calendar: text,
        year: 2020,
        month: 2,
        day: 29,
      }).toString(),
      text
    ).toBe('2020-02-29')
  }
  expect(date.withCalendar('+999999-01-01[u-ca=gregory]').calendarId).toBe(
    'gregory'
  )
  for (const text of [
    '+999999-02-29',
    '-000000-01-01',
    '+999999-01-01T24:00',
    '+999999-01-01[u-ca=unknown]',
    '+999999-01-01[!unknown=value]',
  ])
    expect(() => date.withCalendar(text), text).toThrow(RangeError)
})

it('uses calendar slots and defaults only field-bag calendars', () => {
  const date = new Temporal.PlainDate(2020, 2, 29)
  const datetime = new Temporal.PlainDateTime(2020, 2, 29)
  const zoned = new Temporal.ZonedDateTime(0n, 'UTC')
  for (const calendar of [
    new Temporal.PlainDate(2020, 2, 29, 'gregory'),
    Temporal.PlainDateTime.from('2020-02-29T12:34[u-ca=gregory]'),
    new Temporal.PlainYearMonth(2020, 2, 'gregory'),
    new Temporal.PlainMonthDay(2, 29, 'gregory', 2020),
    new Temporal.ZonedDateTime(0n, 'UTC', 'gregory'),
  ]) {
    for (const key of [
      'calendar',
      'calendarId',
      'toString',
      Symbol.toPrimitive,
    ]) {
      Object.defineProperty(calendar, key, {
        get() {
          throw new Error('Public calendar read')
        },
      })
    }
    for (const value of [date, datetime, zoned]) {
      expect(value.withCalendar(calendar).calendarId).toBe('gregory')
    }
    expect(
      Temporal.PlainDate.from({calendar, year: 2020, month: 2, day: 29})
        .calendarId
    ).toBe('gregory')
  }
  for (const value of [date, datetime, zoned]) {
    for (const calendar of [
      undefined,
      null,
      1,
      1n,
      true,
      Symbol('calendar'),
      {
        toString() {
          throw new Error('Coercion reached')
        },
      },
    ]) {
      expect(() => value.withCalendar(calendar)).toThrow(TypeError)
    }
    expect(() => Reflect.apply(value.withCalendar, value, [])).toThrow(
      TypeError
    )
  }
  let reads = 0
  expect(
    Temporal.PlainDate.from({
      year: 2020,
      month: 2,
      day: 29,
      get calendar() {
        reads++
        return undefined
      },
    }).calendarId
  ).toBe('iso8601')
  expect(reads).toBe(1)
  expect(
    Temporal.PlainDateTime.from({year: 2020, month: 2, day: 29}).calendarId
  ).toBe('iso8601')
})

it.each([
  [
    true,
    '-271821-04-19T00:00:00.000000001',
    [-271821, 4, 19, 0, 0, 0, 0, 0, 1],
  ],
  [
    true,
    '+275760-09-13T23:59:59.999999999',
    [275760, 9, 13, 23, 59, 59, 999, 999, 999],
  ],
  [false, '-271821-04-19T00:00', [-271821, 4, 19, 0, 0, 0, 0, 0, 0]],
  [false, '+275760-09-14T00:00', [275760, 9, 14, 0, 0, 0, 0, 0, 0]],
] as const)(
  'keeps strict local limits across input forms: %s %s',
  (accepted, text, values) => {
    const [
      year,
      month,
      day,
      hour,
      minute,
      second,
      millisecond,
      microsecond,
      nanosecond,
    ] = values
    const fields = {
      year,
      month,
      day,
      hour,
      minute,
      second,
      millisecond,
      microsecond,
      nanosecond,
    }
    for (const create of [
      () => Temporal.PlainDateTime.from(text),
      () => Temporal.PlainDateTime.from(fields),
      () =>
        new Temporal.PlainDateTime(
          year,
          month,
          day,
          hour,
          minute,
          second,
          millisecond,
          microsecond,
          nanosecond
        ),
    ]) {
      if (accepted) expect(create().toString()).toBe(text)
      else expect(create).toThrow(RangeError)
    }
  }
)

import {runfiles} from '@bazel/runfiles'
import {readFileSync} from 'node:fs'
import {expect, it} from 'vitest'
import {Temporal as reference} from 'temporal-polyfill/implementation'
import {Instant, Temporal} from '#packages/temporal/index.js'
import {formatInstant} from '#packages/temporal/instant-format.js'

it('matches independent ICU decimal rounding across modes, increments and epoch signs', () => {
  const path = runfiles.resolve(
    `${process.env.TEST_WORKSPACE || '_main'}/conformance-tests/icu4j/temporal-rounding-fixtures.tsv`
  )
  let count = 0
  for (const line of readFileSync(path, 'utf8').trim().split('\n')) {
    if (line.startsWith('#')) continue
    const [value, smallestUnit, increment, roundingMode, expected] =
      line.split('\t')
    expect(
      new Instant(BigInt(value)).round({
        smallestUnit,
        roundingIncrement: +increment,
        roundingMode,
      }).epochNanoseconds,
      line
    ).toBe(BigInt(expected))
    count++
  }
  expect(count).toBeGreaterThan(1500)
  console.log(`${count} independent ICU decimal rounding cases`)
})

it('serializes UTC, fixed and named zones across transitions and range boundaries', () => {
  const values = [
    -8640000000000000000000n,
    -1n,
    0n,
    1n,
    8640000000000000000000n,
    1636264800000000000n,
  ]
  for (const value of values) {
    for (const timeZone of [
      undefined,
      'UTC',
      '+23:59',
      '-23:59',
      'America/New_York',
      'US/Eastern',
      'europe/paris',
    ]) {
      for (const smallestUnit of [
        'minute',
        'second',
        'millisecond',
        'nanosecond',
      ] as const) {
        const options = {timeZone, smallestUnit}
        expect(
          new Instant(value).toString(options),
          `${value} ${timeZone} ${smallestUnit}`
        ).toBe(new reference.Instant(value).toString(options))
      }
    }
    expect(Instant.from(new Instant(value).toJSON()).epochNanoseconds).toBe(
      value
    )
  }
})

it('uses the full historical offset for fields but rounds its label to minutes', () => {
  expect(formatInstant(0n, 'auto', -1_000_000_000n)).toBe(
    '1969-12-31T23:59:59+00:00'
  )
  expect(formatInstant(0n, 'auto', 30_000_000_000n)).toBe(
    '1970-01-01T00:00:30+00:01'
  )
})

it('accepts every ISO string grammar used for timezone extraction', () => {
  for (const timeZone of [
    '0230[UTC]',
    '202013[UTC]',
    '2020[UTC]',
    '1970-01-01[UTC]',
    '1970-01[UTC]',
    '--01-01[UTC]',
    'T01:00+01',
    '01:00+01',
    '+999999-01-01T00Z',
  ]) {
    const expected = timeZone.includes('+01')
      ? '1970-01-01T01:00:00+01:00'
      : '1970-01-01T00:00:00+00:00'
    expect(new Instant(0n).toString({timeZone}), timeZone).toBe(expected)
  }
  for (const timeZone of [
    'T00Z',
    '1215-05',
    '02-30[UTC]',
    '1970-13[UTC]',
    '1970-01[UTC][u-ca=hebrew]',
  ])
    expect(() => new Instant(0n).toString({timeZone}), timeZone).toThrow(
      RangeError
    )
})

const unitNameCases: readonly [
  string,
  string,
  () => (unit: unknown) => unknown,
  unknown,
][] = [
  [
    'Instant.round',
    'minutes',
    () => {
      const value = new Temporal.Instant(90_000_000_000n)
      return unit => value.round({smallestUnit: unit}).epochNanoseconds
    },
    120_000_000_000n,
  ],
  [
    'PlainTime.round',
    'minutes',
    () => {
      const value = new Temporal.PlainTime(12, 34, 45)
      return unit => value.round({smallestUnit: unit}).minute
    },
    35,
  ],
  [
    'PlainDateTime.round',
    'minutes',
    () => {
      const value = new Temporal.PlainDateTime(2000, 1, 2, 12, 34, 45)
      return unit => value.round({smallestUnit: unit}).minute
    },
    35,
  ],
  [
    'ZonedDateTime.round',
    'minutes',
    () => {
      const value = Temporal.ZonedDateTime.from('2000-01-02T12:34:45Z[UTC]')
      return unit => value.round({smallestUnit: unit}).epochNanoseconds
    },
    946_816_500_000_000_000n,
  ],
  [
    'Duration.round',
    'hours',
    () => {
      const value = new Temporal.Duration(0, 0, 0, 0, 1, 30)
      return unit => value.round({smallestUnit: unit}).hours
    },
    2,
  ],
  [
    'Duration.total',
    'minutes',
    () => {
      const value = new Temporal.Duration(0, 0, 0, 0, 1, 30)
      return unit => value.total({unit})
    },
    90,
  ],
  [
    'PlainDate.until',
    'days',
    () => {
      const one = new Temporal.PlainDate(2024, 2, 28),
        two = new Temporal.PlainDate(2024, 3, 1)
      return unit =>
        one.until(two, {largestUnit: unit, smallestUnit: 'days'}).days
    },
    2,
  ],
  [
    'PlainYearMonth.until',
    'months',
    () => {
      const one = new Temporal.PlainYearMonth(2024, 1),
        two = new Temporal.PlainYearMonth(2024, 3)
      return unit => one.until(two, {largestUnit: unit}).months
    },
    2,
  ],
]
it.each(
  unitNameCases.flatMap(([name, text, prepare, expected]) =>
    (['endsWith', 'slice'] as const).map(key => ({
      name,
      text,
      prepare,
      expected,
      key,
    }))
  )
)(
  '$name matches units without String.prototype.$key',
  ({text, prepare, expected, key}) => {
    const run = prepare()
    const hints: string[] = []
    const value = {
      [Symbol.toPrimitive](hint: string) {
        hints.push(hint)
        return text
      },
    }
    const original = Object.getOwnPropertyDescriptor(String.prototype, key)!
    let actual: unknown
    try {
      Object.defineProperty(String.prototype, key, {
        configurable: true,
        get() {
          throw new Error('Private unit string hook reached')
        },
      })
      actual = run(value)
    } finally {
      Object.defineProperty(String.prototype, key, original)
    }
    expect(actual).toEqual(expected)
    expect(hints).toEqual(['string'])
  }
)

it('recognizes exactly both forms of all ten normal unit names', () => {
  const one = new Temporal.PlainDate(2024, 1, 1),
    two = new Temporal.PlainDate(2025, 2, 3)
  for (const [singular, plural, field, expected] of [
    ['year', 'years', 'years', 1],
    ['month', 'months', 'months', 13],
    ['week', 'weeks', 'weeks', 57],
    ['day', 'days', 'days', 399],
  ] as const) {
    for (const name of [singular, plural])
      expect(one.until(two, {largestUnit: name})[field], name).toBe(expected)
  }
  const hour = new Temporal.Duration(0, 0, 0, 0, 1)
  for (const [singular, plural, expected] of [
    ['hour', 'hours', 1],
    ['minute', 'minutes', 60],
    ['second', 'seconds', 3600],
    ['millisecond', 'milliseconds', 3_600_000],
    ['microsecond', 'microseconds', 3_600_000_000],
    ['nanosecond', 'nanoseconds', 3_600_000_000_000],
  ] as const) {
    for (const name of [singular, plural])
      expect(hour.total(name), name).toBe(expected)
  }
  for (const name of [
    'Minutes',
    'minutess',
    'minutes\n',
    'constructor',
    '__proto__',
    'toString',
    'auto',
  ]) {
    expect(() => hour.total(name), name).toThrow(RangeError)
  }
})

it('preserves one unit Get, string coercion and the exact abrupt completion', () => {
  const value = new Temporal.Instant(0n)
  const failure = {}
  const events: string[] = []
  let actual: unknown
  try {
    value.round({
      get smallestUnit() {
        events.push('get')
        return {
          [Symbol.toPrimitive](hint: string) {
            events.push(hint)
            throw failure
          },
        }
      },
    })
  } catch (error) {
    actual = error
  }
  expect(actual).toBe(failure)
  expect(events).toEqual(['get', 'string'])
})

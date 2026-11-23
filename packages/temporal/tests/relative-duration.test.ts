import {runfiles} from '@bazel/runfiles'
import {readFileSync} from 'node:fs'
import {expect, it} from 'vitest'
import {Temporal} from '#packages/temporal/index.js'
import {Temporal as reference} from 'temporal-polyfill/implementation'

it('checks the next week when day rounding leaves an exact week count', () => {
  const options = {
    largestUnit: 'week',
    smallestUnit: 'day',
    roundingIncrement: 2,
  } as const
  for (const [start, end, inward, expected] of [
    ['-271821-04-26', '-271821-04-19', 7, '-P1W'],
    ['+275760-09-06', '+275760-09-13', -7, 'P1W'],
  ] as const) {
    const first = Temporal.PlainDate.from(start)
    const last = Temporal.PlainDate.from(end)
    expect(() => first.until(last, options)).toThrow(RangeError)
    expect(() => first.since(last, options)).toThrow(RangeError)
    const firstTime = first.toPlainDateTime({nanosecond: 1})
    const lastTime = last.toPlainDateTime({nanosecond: 1})
    expect(() =>
      firstTime.until(lastTime, {
        largestUnit: 'week',
        smallestUnit: 'hour',
      })
    ).toThrow(RangeError)
    expect(
      first
        .add({days: inward})
        .until(last.add({days: inward}), options)
        .toString()
    ).toBe(expected)
  }
})

it('matches independent ICU spans through Duration round/total', () => {
  const file = runfiles.resolve(
    `${process.env.TEST_WORKSPACE || '_main'}/conformance-tests/icu4j/temporal-zoned-difference-fixtures.tsv`
  )
  let rounds = 0,
    totals = 0
  for (const line of readFileSync(file, 'utf8').trim().split('\n')) {
    if (line.startsWith('#')) continue
    const [zone, start, end, unit, increment, roundingMode, expected, , total] =
      line.split('\t')
    const a = new Temporal.ZonedDateTime(BigInt(start), zone),
      b = new Temporal.ZonedDateTime(BigInt(end), zone)
    const duration = a.until(b, {largestUnit: unit})
    expect(
      duration
        .round({
          relativeTo: a,
          largestUnit: unit,
          smallestUnit: unit,
          roundingIncrement: +increment,
          roundingMode,
        })
        .toString(),
      line
    ).toBe(Temporal.Duration.from({[unit + 's']: +expected}).toString())
    rounds++
    if (total !== 'null') {
      expect(duration.total({relativeTo: a, unit}), line).toBe(+total)
      totals++
    }
  }
  expect(rounds).toBe(19440)
  expect(totals).toBe(6480)
})

it('preserves calendar prefixes when rounding to weeks', () => {
  for (const relativeTo of [
    '2020-01-01',
    '2020-01-31',
    '2020-02-29',
    '2020-01-31T12:00-05:00[America/New_York]',
  ]) {
    for (const days of [24, 27, 31, 55, 59, 66, -24, -59]) {
      const options = {
        relativeTo,
        largestUnit: 'year',
        smallestUnit: 'week',
        roundingMode: 'ceil',
      } as const
      expect(Temporal.Duration.from({days}).round(options).toString()).toBe(
        reference.Duration.from({days}).round(options).toString()
      )
    }
  }
})

it('keeps relative arithmetic independent of user array iteration', () => {
  const original = Array.prototype[Symbol.iterator]
  let result: number | undefined
  try {
    Array.prototype[Symbol.iterator] = () => {
      throw new Error('Array should not be iterated')
    }
    result = Temporal.Duration.from({months: 1, days: 5})
      .negated()
      .abs()
      .round({
        relativeTo: '2020-01-01[UTC]',
        largestUnit: 'month',
        smallestUnit: 'day',
      })
      .total({relativeTo: '2020-01-01[UTC]', unit: 'day'})
  } finally {
    Array.prototype[Symbol.iterator] = original
  }
  expect(result).toBe(36)
})

it('matches forced full-polyfill Hebrew controls through leap months', async () => {
  const {Temporal: full} = await import('temporal-polyfill/full/implementation')
  for (const relativeTo of [
    '2024-03-01[u-ca=hebrew]',
    '2023-09-16[u-ca=hebrew]',
  ]) {
    for (const text of ['P1Y2M3D', 'P3M5D', '-P1Y2M3D']) {
      const value = Temporal.Duration.from(text),
        expected = full.Duration.from(text)
      for (const unit of ['year', 'month', 'week', 'day'] as const) {
        expect(value.total({relativeTo, unit})).toBeCloseTo(
          expected.total({relativeTo, unit}),
          12
        )
        for (const roundingMode of ['halfExpand', 'floor', 'ceil'] as const) {
          const options = {
            relativeTo,
            largestUnit: unit,
            smallestUnit: unit,
            roundingMode,
          }
          expect(value.round(options).toString()).toBe(
            expected.round(options).toString()
          )
        }
      }
    }
  }
})

it('uses internal date-time fields for relativeTo', () => {
  for (const [text, days] of [
    ['2020-01-31T23:59:59.123456789', 29],
    ['1969-11-30T23:59:59.123456789', 30],
  ] as const) {
    const relativeTo = Temporal.PlainDateTime.from(text)
    for (const key of ['calendar', 'year', 'hour', 'timeZone']) {
      Object.defineProperty(relativeTo, key, {
        get() {
          throw new Error(`Unexpected ${key} read`)
        },
      })
    }
    expect(Temporal.Duration.compare('P1M', {days}, {relativeTo})).toBe(0)
    expect(Temporal.Duration.from('P1M').total({relativeTo, unit: 'day'})).toBe(
      days
    )
  }
})

it('validates the full calendar window for exact totals at the date limits', () => {
  for (const [date, duration, unit] of [
    ['+275759-09-13', 'P1Y', 'year'],
    ['+275760-08-13', 'P1M', 'month'],
    ['+275760-09-06', 'P1W', 'week'],
    ['-271821-05-20', '-P1M', 'month'],
  ] as const) {
    for (const relativeTo of [date, `${date}T00:00[UTC]`]) {
      expect(
        () => Temporal.Duration.from(duration).total({relativeTo, unit}),
        `${duration} ${relativeTo} ${unit}`
      ).toThrow(RangeError)
    }
  }
})

it.each([
  ['-271821-05-20', '-P29DT12H', 'month', -59 / 60],
  ['-271821-04-27', '-P6DT12H', 'week', -13 / 14],
  ['-271820-04-20', '-P365DT12H', 'year', -731 / 732],
] as const)(
  'borrows the trailing clock before validating %s total endpoints',
  (relativeTo, duration, unit, expected) => {
    expect(Temporal.Duration.from(duration).total({relativeTo, unit})).toBe(
      expected
    )
  }
)

it('validates zero zoned calendar totals while preserving the plain zero shortcut', () => {
  const zero = new Temporal.Duration()
  const maximum = new Temporal.ZonedDateTime(
    8_640_000_000_000_000_000_000n,
    'UTC'
  )
  const minimum = new Temporal.ZonedDateTime(
    -8_640_000_000_000_000_000_000n,
    'UTC'
  )
  for (const unit of ['year', 'month', 'week'] as const) {
    expect(() => zero.total({relativeTo: maximum, unit}), unit).toThrow(
      RangeError
    )
    expect(zero.total({relativeTo: minimum, unit})).toBe(0)
    expect(zero.total({relativeTo: '+275760-09-13', unit})).toBe(0)
    expect(zero.total({relativeTo: '-271821-04-19', unit})).toBe(0)
  }
  expect(zero.total({relativeTo: maximum, unit: 'hour'})).toBe(0)
  expect(
    Temporal.Duration.from('P1M').total({
      relativeTo: '+275760-08-13',
      unit: 'day',
    })
  ).toBe(31)
})

it('rejects malformed relativeTo annotations without an extra RegExp test hook', () => {
  const duration = Temporal.Duration.from('PT1H')
  const descriptor = Object.getOwnPropertyDescriptor(RegExp.prototype, 'test')!
  const sentinel = new Error('Observable relativeTo classification')
  let hooks = 0
  let unitReads = 0
  let caught: unknown
  try {
    Object.defineProperty(RegExp.prototype, 'test', {
      configurable: true,
      get() {
        hooks++
        throw sentinel
      },
    })
    try {
      duration.total({
        relativeTo: '[[]',
        get unit() {
          unitReads++
          return 'hour'
        },
      })
    } catch (error) {
      caught = error
    }
  } finally {
    Object.defineProperty(RegExp.prototype, 'test', descriptor)
  }
  expect(hooks).toBe(0)
  expect(caught).toBeInstanceOf(RangeError)
  expect(unitReads).toBe(0)
})

it('preserves legacy RegExp state before malformed relativeTo annotation rejection', () => {
  const duration = Temporal.Duration.from('PT1H')
  ;/(relative marker)/.exec('relative marker')
  const expected = [RegExp.$1, RegExp.lastMatch, RegExp.input]
  let caught: unknown
  try {
    duration.total({relativeTo: '[[]', unit: 'hour'})
  } catch (error) {
    caught = error
  }
  const actual = [RegExp.$1, RegExp.lastMatch, RegExp.input]
  expect(caught).toBeInstanceOf(RangeError)
  expect(actual).toEqual(expected)
})

import {runfiles} from '@bazel/runfiles'
import {readFileSync} from 'node:fs'
import {expect, it} from 'vitest'
import {Temporal} from '#packages/temporal/index.js'

import {checkZonedArithmeticOracle} from '#packages/temporal/tests/zoned-arithmetic-oracle.js'

it('matches independent ICU zoned spans, boundaries and all rounding modes', () => {
  const fixture = (name: string) =>
    readFileSync(
      runfiles.resolve(
        `${process.env.TEST_WORKSPACE || '_main'}/conformance-tests/icu4j/temporal-${name}-fixtures.tsv`
      ),
      'utf8'
    )
  checkZonedArithmeticOracle(
    Temporal,
    fixture('zoned-difference'),
    fixture('zoned-rounding'),
    (actual, expected, context) => expect(actual, context).toBe(expected)
  )
})

it.each(['ZonedDateTime', 'PlainDateTime'] as const)(
  'rounds %s differences before converting nanoseconds to Number',
  kind => {
    const [start, end] =
      kind === 'ZonedDateTime'
        ? [
            new Temporal.ZonedDateTime(0n, 'UTC'),
            new Temporal.ZonedDateTime(9_007_199_254_741_005n, 'UTC'),
          ]
        : [
            Temporal.PlainDateTime.from('1970-01-01T00:00'),
            Temporal.PlainDateTime.from('1970-04-15T05:59:59.254741005'),
          ]
    // The exact span ends in 5 ns, halfway between two 10 ns multiples.
    for (const [roundingMode, positive, negative] of [
      ['halfExpand', 9_007_199_254_741_010, -9_007_199_254_741_010],
      ['halfTrunc', 9_007_199_254_741_000, -9_007_199_254_741_000],
      ['ceil', 9_007_199_254_741_010, -9_007_199_254_741_000],
      ['floor', 9_007_199_254_741_000, -9_007_199_254_741_010],
    ] as const) {
      const options = {
        largestUnit: 'nanosecond',
        smallestUnit: 'nanosecond',
        roundingIncrement: 10,
        roundingMode,
      }
      expect(start.until(end, options).nanoseconds, roundingMode).toBe(positive)
      expect(end.until(start, options).nanoseconds, roundingMode).toBe(negative)
      expect(start.since(end, options).nanoseconds, roundingMode).toBe(negative)
      expect(end.since(start, options).nanoseconds, roundingMode).toBe(positive)
    }
  }
)

it.each([
  ['microsecond', 1000n, 8],
  ['millisecond', 1_000_000n, 7],
] as const)(
  'rounds exact leading %s fields above Number precision',
  (unit, factor, field) => {
    const halfSpan = (9_007_199_254_741_005n * factor) / 2n
    const start = new Temporal.ZonedDateTime(-halfSpan, 'UTC')
    const end = new Temporal.ZonedDateTime(halfSpan, 'UTC')
    const expected = Array(10).fill(0)
    expected[field] = 9_007_199_254_741_010
    for (const [first, last] of [
      [start, end],
      [start.toPlainDateTime(), end.toPlainDateTime()],
    ] as const) {
      const result = first.until(last, {
        largestUnit: unit,
        smallestUnit: unit,
        roundingIncrement: 10,
        roundingMode: 'halfExpand',
      })
      expect([
        result.years,
        result.months,
        result.weeks,
        result.days,
        result.hours,
        result.minutes,
        result.seconds,
        result.milliseconds,
        result.microseconds,
        result.nanoseconds,
      ]).toEqual(expected)
    }
  }
)

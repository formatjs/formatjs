import {checkPlainRelativeEndpointBounds} from '#packages/temporal/tests/plain-relative-oracle.js'
import {checkPlainRelativeOracle} from '#packages/temporal/tests/plain-relative-oracle.js'
import {runfiles} from '@bazel/runfiles'
import {readFileSync} from 'node:fs'
import {expect, it} from 'vitest'
import {Temporal} from '#packages/temporal/index.js'
import {Temporal as reference} from 'temporal-polyfill/implementation'

it('matches independent ICU plain calendar rounding, totals and comparisons', () => {
  const fixture = readFileSync(
    runfiles.resolve(
      `${process.env.TEST_WORKSPACE || '_main'}/conformance-tests/icu4j/temporal-plain-relative-fixtures.tsv`
    ),
    'utf8'
  )
  const counts = checkPlainRelativeOracle(
    Temporal,
    fixture,
    (actual, expected, line) => expect(actual, line).toBe(expected)
  )
  expect(counts).toEqual({
    rounds: 51840,
    totals: 17280,
    dates: 20736,
    comparisons: 4224,
  })
}, 30_000)

it('rejects unrepresentable plain endpoints before clock rounding or totals', () => {
  for (const seconds of [Number.MAX_SAFE_INTEGER, Number.MIN_SAFE_INTEGER]) {
    const value = Temporal.Duration.from({seconds})
    const expected = reference.Duration.from({seconds})
    for (const unit of ['day', 'hour', 'second'] as const) {
      const options = {
        relativeTo: '2020-01-01',
        largestUnit: unit,
        smallestUnit: 'nanosecond',
      } as const
      expect(() => expected.round(options)).toThrow(RangeError)
      expect(() => value.round(options)).toThrow(RangeError)
      expect(() =>
        expected.total({relativeTo: options.relativeTo, unit})
      ).toThrow(RangeError)
      expect(() => value.total({relativeTo: options.relativeTo, unit})).toThrow(
        RangeError
      )
    }
  }
})

it('balances rounded differences across both plain date limits', () => {
  const first = '2000-01-31T12:34:56'
  for (const [last, roundingMode, results] of [
    [
      '+275760-09-13T23:59:59.999999999',
      'ceil',
      [
        ['year', 'P273760Y7M13DT12H'],
        ['month', 'P3285127M13DT12H'],
        ['week', 'P14284144W5DT12H'],
        ['day', 'P99989013DT12H'],
      ],
    ],
    [
      '-271821-04-19T00:00:00.000000001',
      'floor',
      [
        ['year', '-P273820Y9M11DT13H'],
        ['month', '-P3285849M11DT13H'],
        ['week', '-P14287284WT13H'],
        ['day', '-P100010988DT13H'],
      ],
    ],
  ] as const)
    for (const [largestUnit, result] of results) {
      const options = {largestUnit, smallestUnit: 'hour', roundingMode} as const
      const expected = reference.PlainDateTime.from(first)
        .until(reference.PlainDateTime.from(last), options)
        .toString()
      expect(expected).toBe(result)
      expect(
        Temporal.PlainDateTime.from(first)
          .until(Temporal.PlainDateTime.from(last), options)
          .toString()
      ).toBe(result)
    }
})

it('rejects the excluded lower destination midnight but preserves adjacent values and zero', () => {
  checkPlainRelativeEndpointBounds(Temporal, (actual, expected, context) =>
    expect(actual, context).toBe(expected)
  )
})

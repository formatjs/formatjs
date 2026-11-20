import {runfiles} from '@bazel/runfiles'
import {readFileSync} from 'node:fs'
import {expect, it} from 'vitest'
import {Temporal} from '#packages/temporal/index.js'
import {Temporal as reference} from 'temporal-polyfill/implementation'

it('compares equal date fields without hiding zoned endpoint overflow', () => {
  const relativeTo = new Temporal.ZonedDateTime(
    8_640_000_000_000_000_000_000n,
    'UTC'
  )
  expect(() =>
    Temporal.Duration.compare('P1D', 'P1DT1S', {relativeTo})
  ).toThrow(RangeError)
  expect(Temporal.Duration.compare('P1D', 'P1D', {relativeTo})).toBe(0)
  expect(Temporal.Duration.compare('PT1S', 'PT2S', {relativeTo})).toBe(-1)
})

it('compares plain days as 24-hour units, but validates the calendar part', () => {
  const relativeTo = '+275760-09-13'
  expect(Temporal.Duration.compare('P1D', 'PT24H', {relativeTo})).toBe(0)
  expect(() =>
    Temporal.Duration.compare('P1M', 'P1MT1S', {relativeTo})
  ).toThrow(RangeError)
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

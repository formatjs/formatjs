import {runfiles} from '@bazel/runfiles'
import {readFileSync} from 'node:fs'
import {expect, it} from 'vitest'
import {Temporal as reference} from 'temporal-polyfill/implementation'
import {Instant} from '#packages/temporal/index.js'
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

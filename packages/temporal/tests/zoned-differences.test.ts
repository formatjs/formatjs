import {runfiles} from '@bazel/runfiles'
import {readFileSync} from 'node:fs'
import {expect, it} from 'vitest'
import {Temporal} from '#packages/temporal/index.js'

it('matches ICU zoned spans and BigDecimal rounding for all units/modes/directions', () => {
  const file = runfiles.resolve(
    `${process.env.TEST_WORKSPACE || '_main'}/conformance-tests/icu4j/temporal-zoned-difference-fixtures.tsv`
  )
  let count = 0
  for (const line of readFileSync(file, 'utf8').trim().split('\n')) {
    if (line.startsWith('#')) continue
    const [zone, start, end, unit, increment, roundingMode, until, since] =
      line.split('\t')
    const a = new Temporal.ZonedDateTime(BigInt(start), zone),
      b = new Temporal.ZonedDateTime(BigInt(end), zone)
    const options = {
      largestUnit: unit,
      smallestUnit: unit,
      roundingIncrement: +increment,
      roundingMode,
    }
    expect(a.until(b, options).toString(), line).toBe(
      Temporal.Duration.from({[unit + 's']: +until}).toString()
    )
    expect(a.since(b, options).toString(), line).toBe(
      Temporal.Duration.from({[unit + 's']: +since}).toString()
    )
    count++
  }
  expect(count).toBe(19440)
})

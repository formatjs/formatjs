import {runfiles} from '@bazel/runfiles'
import {readFileSync} from 'node:fs'
import {expect, it} from 'vitest'
import {
  epochNanosecondsToISO,
  isoToEpochNanoseconds,
} from '#packages/temporal/kernel.js'

it('matches independent ICU Gregorian fields across the full instant range', () => {
  const path = runfiles.resolve(
    `${process.env.TEST_WORKSPACE || '_main'}/conformance-tests/icu4j/temporal-iso-fixtures.tsv`
  )
  let count = 0
  for (const line of readFileSync(path, 'utf8').trim().split('\n')) {
    if (line.startsWith('#')) continue
    const [epoch, year, month, day, hour, minute, second, millisecond] = line
      .split('\t')
      .map(Number)
    const fields = {
      year,
      month,
      day,
      hour,
      minute,
      second,
      millisecond,
      microsecond: 0,
      nanosecond: 0,
    }
    const nanoseconds = BigInt(epoch) * 1_000_000n
    expect(epochNanosecondsToISO(nanoseconds), line).toEqual(fields)
    expect(isoToEpochNanoseconds(fields), line).toBe(nanoseconds)
    count++
  }
  expect(count).toBeGreaterThan(25000)
  console.log(`${count} independent ICU Gregorian samples, both directions`)
})

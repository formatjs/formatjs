import {runfiles} from '@bazel/runfiles'
import {spawnSync} from 'node:child_process'
import {expect, it} from 'vitest'
import {
  YearFromTime,
  MonthFromTime,
  DateFromTime,
  WeekDay,
  HourFromTime,
  MinFromTime,
  SecFromTime,
} from '#packages/ecma262-abstract/DateOperations.js'

it('matches TS Gregorian arithmetic throughout the Date range and local offset crossings', () => {
  const values: bigint[] = []
  const day = 86_400_000_000_000n
  for (let index = -100_000_000n; index <= 100_000_000n; index += 97_753n)
    for (const fraction of [-1n, 0n, 1n, 123_456_789n])
      values.push(index * day + fraction)
  for (const index of [
    -100_000_001n,
    -100_000_000n,
    -719_528n,
    -25_568n,
    -1n,
    0n,
    11_016n,
    100_000_000n,
    100_000_001n,
  ])
    values.push(index * day)
  const executable = runfiles.resolve(
    `${process.env.TEST_WORKSPACE || '_main'}/crates/intl_datetimeformat/civil_conformance`
  )
  const result = spawnSync(executable, [], {
    input: values.join('\n') + '\n',
    encoding: 'utf8',
    maxBuffer: 4 * 1024 * 1024,
  })
  if (result.error) throw result.error
  expect(result.status, result.stderr).toBe(0)
  const records = result.stdout
    .trim()
    .split('\n')
    .map(line => JSON.parse(line))
  expect(records.length).toBe(values.length)
  for (let index = 0; index < values.length; index++) {
    const value = values[index]
    const milliseconds = Number(
      value / 1_000_000n - (value < 0n && value % 1_000_000n !== 0n ? 1n : 0n)
    )
    const nanosecond = Number(
      ((value % 1_000_000_000n) + 1_000_000_000n) % 1_000_000_000n
    )
    expect(records[index], String(value)).toEqual([
      YearFromTime(milliseconds),
      MonthFromTime(milliseconds) + 1,
      DateFromTime(milliseconds),
      WeekDay(milliseconds),
      HourFromTime(milliseconds),
      MinFromTime(milliseconds),
      SecFromTime(milliseconds),
      nanosecond,
    ])
  }
})

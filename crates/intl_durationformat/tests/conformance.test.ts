import {runfiles} from '@bazel/runfiles'
import {spawnSync} from 'node:child_process'
import {expect, it} from 'vitest'
import {DurationFormat} from '@formatjs/intl-durationformat'
import {ToDurationRecord} from '#packages/ecma402-abstract/DurationFormat/ToDurationRecord.js'
const units = [
  'years',
  'months',
  'weeks',
  'days',
  'hours',
  'minutes',
  'seconds',
  'milliseconds',
  'microseconds',
  'nanoseconds',
] as const
function run(requests: object[]): any[] {
  const path = runfiles.resolve(
    `${process.env.TEST_WORKSPACE || '_main'}/crates/intl_durationformat/conformance`
  )
  const result = spawnSync(path, [], {
    input: requests.map(item => JSON.stringify(item)).join('\n') + '\n',
    encoding: 'utf8',
    maxBuffer: 32 * 1024 * 1024,
  })
  if (result.error) throw result.error
  expect(result.status, result.stderr).toBe(0)
  return result.stdout
    .trim()
    .split('\n')
    .map(line => JSON.parse(line))
}
function safely(callback: () => unknown): unknown {
  try {
    return callback()
  } catch (error) {
    return {error: (error as Error).name}
  }
}
it('matches unit option propagation, rejection and property order', () => {
  const cases: Record<string, unknown>[] = []
  for (const style of ['long', 'short', 'narrow', 'digital']) {
    cases.push({style})
    for (const unit of units)
      for (const fieldStyle of [
        'long',
        'short',
        'narrow',
        'numeric',
        '2-digit',
        'fractional',
        'invalid',
      ])
        for (const display of [undefined, 'auto', 'always'])
          cases.push({style, [unit]: fieldStyle, [unit + 'Display']: display})
    for (const first of ['numeric', '2-digit', 'long'])
      for (const second of [undefined, 'long', 'numeric', '2-digit'])
        cases.push({style, hours: first, minutes: second})
    for (const fractionalDigits of [-1, 0, 1, 2.9, 9, 9.1, 10])
      cases.push({style, fractionalDigits})
  }
  const native = run(cases.map(options => ({method: 'options', options})))
  for (let index = 0; index < cases.length; index++) {
    const expected = safely(() => {
      const {locale, numberingSystem, ...resolved} = new DurationFormat(
        'en',
        cases[index]
      ).resolvedOptions()
      void locale
      void numberingSystem
      return resolved
    })
    expect(native[index], JSON.stringify(cases[index])).toEqual(expected)
    expect(Object.keys(native[index])).toEqual(Object.keys(expected as object))
  }
})
it('matches exact normalized-second bounds, mixed signs and Number integers', () => {
  const cases: (number | undefined)[][] = [
    Array(10),
    [0],
    [1, 0, 0, 0, 0, 0, -1],
    [-1, 0, 0, 0, 0, 0, 1],
    [-0],
  ]
  for (let unit = 0; unit < units.length; unit++) {
    for (const value of [
      0,
      -0,
      1,
      -1,
      1.5,
      NaN,
      Infinity,
      -Infinity,
      2 ** 32 - 1,
      2 ** 32,
      2 ** 53 - 1,
      2 ** 53,
      1e18 + 100,
      1e23,
      1e300,
    ]) {
      const values = Array<number | undefined>(10).fill(undefined)
      values[unit] = value
      cases.push(values)
    }
  }
  for (const sign of [-1, 1])
    for (const nanos of [0, 999999999, 1000000000]) {
      const values = Array<number | undefined>(10).fill(0)
      values[6] = sign * (2 ** 53 - 1)
      values[9] = sign * nanos
      cases.push(values)
    }
  const native = run(
    cases.map(values => ({
      method: 'record',
      values: Array.from({length: 10}, (_, index) =>
        values[index] === undefined ? null : String(values[index])
      ),
    }))
  )
  for (let index = 0; index < cases.length; index++) {
    const input = Object.fromEntries(
      units.map((unit, field) => [unit, cases[index][field]])
    )
    const expected = safely(() => {
      const record = ToDurationRecord(input)
      return {
        values: units.map(unit => BigInt(record[unit]).toString()),
        negative: units.some(unit => record[unit] < 0),
      }
    })
    expect(native[index], JSON.stringify(input)).toEqual(expected)
  }
})

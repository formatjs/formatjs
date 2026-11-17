import {runfiles} from '@bazel/runfiles'
import {spawnSync} from 'node:child_process'
import {readFileSync} from 'node:fs'
import {expect, it} from 'vitest'
import packed from '@formatjs_generated/tz/all-tz.js'
import {unpack} from '#packages/intl-datetimeformat/unpack.js'
import {TimeZoneOffset} from '#packages/ecma402-abstract/DateTimeFormat/TimeZoneOffset.js'

const resolve = (file: string) =>
  runfiles.resolve(`${process.env.TEST_WORKSPACE || '_main'}/${file}`)

it('matches ICU future offsets at seasonal samples and transition boundaries', () => {
  const zones = unpack(packed)
  const fixtures = readFileSync(
    resolve('conformance-tests/icu4j/temporal-timezone-fixtures.tsv'),
    'utf8'
  )
  const cases = new Map<string, {instants: string[]; expected: number[]}>()
  const mismatches: string[] = []
  for (const line of fixtures.trim().split('\n')) {
    if (line.startsWith('#')) {
      console.log(line)
      continue
    }
    const [name, milliseconds, offset] = line.split('\t')
    if (!Object.hasOwn(zones, name)) continue
    const instant = Number(milliseconds)
    const expected = Number(offset)
    const actual = TimeZoneOffset(instant, zones[name])[0]
    if (actual !== expected)
      mismatches.push(`${name} ${milliseconds}: TS ${actual}, ICU ${expected}`)
    let entry = cases.get(name)
    if (!entry) cases.set(name, (entry = {instants: [], expected: []}))
    entry.instants.push(String(BigInt(milliseconds) * 1_000_000n))
    entry.expected.push(expected)
  }
  expect(mismatches).toEqual([])
  expect(cases.size).toBeGreaterThan(400)
  for (const name of [
    'America/New_York',
    'Europe/Dublin',
    'Australia/Lord_Howe',
    'Australia/Sydney',
    'Asia/Kolkata',
    'Pacific/Apia',
  ])
    expect(cases.has(name), name).toBe(true)
  const entries = [...cases].map(([name, entry]) => ({
    name,
    instants: entry.instants,
  }))
  const rust = spawnSync(
    resolve('crates/intl_datetimeformat/timezone_conformance'),
    [resolve('packages/intl-datetimeformat/tz-all.json')],
    {
      input: entries.map(entry => JSON.stringify(entry)).join('\n') + '\n',
      encoding: 'utf8',
      maxBuffer: 32 * 1024 * 1024,
    }
  )
  if (rust.error) throw rust.error
  expect(rust.status, rust.stderr).toBe(0)
  const rows = rust.stdout
    .trim()
    .split('\n')
    .map(line => JSON.parse(line) as {samples: number[][]})
  expect(rows).toHaveLength(entries.length)
  let samples = 0
  for (let i = 0; i < entries.length; i++) {
    expect(
      rows[i].samples.map(sample => sample[8]),
      entries[i].name
    ).toEqual(cases.get(entries[i].name)!.expected)
    samples += entries[i].instants.length
  }
  console.log(
    `${cases.size} shared zones, ${samples} ICU future samples; total offsets only`
  )
}, 120_000)

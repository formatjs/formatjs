import {runfiles} from '@bazel/runfiles'
import {spawnSync} from 'node:child_process'
import {readFileSync} from 'node:fs'
import {runInNewContext} from 'node:vm'
import {expect, it} from 'vitest'
import links from '@formatjs_generated/tz/links.js'
import fullData from '@formatjs_generated/tz/all-tz.js'
import {unpack} from '#packages/intl-datetimeformat/unpack.js'
import {ToLocalTime} from '#packages/ecma402-abstract/DateTimeFormat/ToLocalTime.js'
import {CanonicalizeTimeZoneName} from '#packages/ecma402-abstract/CanonicalizeTimeZoneName.js'
import {IsValidTimeZoneName} from '#packages/ecma402-abstract/IsValidTimeZoneName.js'

const resolve = (path: string) =>
  runfiles.resolve(`${process.env.TEST_WORKSPACE || '_main'}/${path}`)
interface Case {
  name: string
  instants: string[]
}
interface Result {
  name?: string
  samples?: Array<number[] | null>
  error?: string
}
const uppercaseLinks = Object.fromEntries(
  Object.entries(links).map(([alias, target]) => [alias.toUpperCase(), target])
)
const identifiers = Object.fromEntries(
  [...Object.keys(links), ...Object.values(links)].map(name => [
    name.toUpperCase(),
    name,
  ])
)
const minimum = -8_640_000_000_000_000_000_000n,
  maximum = -minimum
function run(pack: string, cases: Case[]): Result[] {
  const result = spawnSync(
    resolve('crates/intl_datetimeformat/timezone_conformance'),
    [pack],
    {
      input: cases.map(entry => JSON.stringify(entry)).join('\n') + '\n',
      encoding: 'utf8',
      maxBuffer: 64 * 1024 * 1024,
    }
  )
  if (result.error) throw result.error
  expect(result.status, result.stderr).toBe(0)
  const rows = result.stdout
    .trim()
    .split('\n')
    .map(line => JSON.parse(line) as Result)
  expect(rows.length).toBe(cases.length)
  return rows
}
it.each(['all', 'golden'])(
  'matches every %s-zone transition against TS at nanosecond boundaries',
  selection => {
    const path = resolve(`packages/intl-datetimeformat/tz-${selection}.json`)
    const packed = JSON.parse(readFileSync(path, 'utf8')) as typeof fullData
    if (selection === 'all') expect(packed).toEqual(fullData)
    let scriptData: typeof fullData | undefined
    runInNewContext(
      readFileSync(
        resolve(
          `packages/intl-datetimeformat/add-${selection === 'all' ? 'all' : 'golden'}-tz.js`
        ),
        'utf8'
      ),
      {
        Intl: {
          DateTimeFormat: {
            __addTZData(data: typeof fullData) {
              scriptData = data
            },
          },
        },
      }
    )
    expect(scriptData).toEqual(packed)

    const tzData = unpack(packed),
      names = Object.keys(tzData)
    const cases: Case[] = names.map(name => {
      const instants = new Set<string>([
        String(minimum),
        String(maximum),
        '-1',
        '0',
        '1',
        '4102444800000000000',
        String(BigInt(Date.parse('2500-01-15T12:00:00Z')) * 1_000_000n),
        String(BigInt(Date.parse('2500-07-15T12:00:00Z')) * 1_000_000n),
        String(BigInt(Date.parse('2500-03-14T07:00:00Z')) * 1_000_000n - 1n),
        String(BigInt(Date.parse('2500-03-14T07:00:00Z')) * 1_000_000n),
      ])
      for (const [timestamp] of tzData[name]) {
        if (!Number.isFinite(timestamp)) continue
        const instant = BigInt(timestamp) * 1_000_000_000n
        for (const value of [instant - 1n, instant, instant + 1n])
          if (value >= minimum && value <= maximum) instants.add(String(value))
      }
      return {name, instants: [...instants]}
    })
    const actual = run(path, cases)
    let samples = 0
    for (let index = 0; index < cases.length; index++) {
      const entry = cases[index]
      const canonical = CanonicalizeTimeZoneName(entry.name, {
        zoneNames: names,
        uppercaseLinks,
      })
      expect(actual[index].name, entry.name).toBe(
        identifiers[entry.name.toUpperCase()] ?? canonical
      )
      expect(actual[index].samples!.length).toBe(entry.instants.length)
      for (let position = 0; position < entry.instants.length; position++) {
        const instant = BigInt(entry.instants[position])
        const expected = ToLocalTime(instant, 'gregory', canonical, {tzData})
        const nanosecond = Number(
          ((instant % 1_000_000_000n) + 1_000_000_000n) % 1_000_000_000n
        )
        expect(
          actual[index].samples![position],
          entry.name + ' ' + instant
        ).toEqual([
          expected.year,
          expected.month + 1,
          expected.day,
          expected.weekday,
          expected.hour,
          expected.minute,
          expected.second,
          nanosecond,
          expected.timeZoneOffset / 1000,
          Number(expected.inDST),
        ])
        samples++
      }
    }
    console.log(
      `${selection}: ${names.length} zones, ${samples} transition/boundary samples`
    )
  },
  180_000
)
it('matches aliases, ASCII case folding, fixed offsets and invalid names', () => {
  const path = resolve('packages/intl-datetimeformat/tz-all.json')
  const tzData = unpack(fullData),
    names = Object.keys(tzData)
  const inputs = [
    ...Object.keys(links),
    ...names.map(name => name.toLowerCase()),
    '+00',
    '-00',
    '+0530',
    '-2359',
    '+23:59',
    '-01:30',
    '+24',
    '+00:60',
    '+01:00:00',
    '+01:00:00.0',
    '+０１:00',
    'Aſia/Tokyo',
    'No/Such_Zone',
    '',
  ]
  const cases = inputs.map(name => ({
    name,
    instants: ['-1', '0', '1000000000000'],
  }))
  const actual = run(path, cases)
  for (let index = 0; index < cases.length; index++) {
    const entry = cases[index]
    if (
      !IsValidTimeZoneName(entry.name, {
        zoneNamesFromData: names,
        uppercaseLinks,
      })
    ) {
      expect(actual[index].error, entry.name).toBe('InvalidTimeZone')
      continue
    }
    const canonical = CanonicalizeTimeZoneName(entry.name, {
      zoneNames: names,
      uppercaseLinks,
    })
    expect(actual[index].name, entry.name).toBe(
      identifiers[entry.name.toUpperCase()] ?? canonical
    )
    for (let position = 0; position < entry.instants.length; position++) {
      const expected = ToLocalTime(
        BigInt(entry.instants[position]),
        'gregory',
        canonical,
        {tzData}
      )
      expect(actual[index].samples![position]!.slice(-2), entry.name).toEqual([
        expected.timeZoneOffset / 1000,
        Number(expected.inDST),
      ])
    }
  }
})

it('adds fractional offsets before flooring negative submilliseconds', () => {
  for (const [instant, zone] of [
    [-1n, '+00:00:00.000000001'],
    [1n, '-00:00:00.000000001'],
    [-999999n, '+00:00:00.000999999'],
    [999999n, '-00:00:00.000999999'],
  ] as const) {
    expect(ToLocalTime(instant, 'gregory', zone, {tzData: {}})).toMatchObject({
      year: 1970,
      month: 0,
      day: 1,
      hour: 0,
      minute: 0,
      second: 0,
      millisecond: 0,
    })
  }
})

it.each(['Number', 'isSafeInteger', 'iterator'] as const)(
  'computes local records without mutable %s hooks',
  hook => {
    const owner =
      hook === 'Number'
        ? globalThis
        : hook === 'isSafeInteger'
          ? Number
          : Array.prototype
    const key = hook === 'iterator' ? Symbol.iterator : hook
    const descriptor = Object.getOwnPropertyDescriptor(owner, key)!
    const define = Object.defineProperty
    const details = {
      tzData: {UTC: [[-Infinity, '', 0, false]]} as ReturnType<typeof unpack>,
    }
    const expected = ToLocalTime(-1n, 'gregory', '+01:30', details)
    const expectedNamed = ToLocalTime(-1n, 'gregory', 'UTC', details)
    let actual: unknown, named: unknown, error: unknown
    try {
      define(owner, key, {
        ...descriptor,
        value: () => {
          throw new Error(`Mutable ${hook}`)
        },
      })
      actual = ToLocalTime(-1n, 'gregory', '+01:30', details)
      named = ToLocalTime(-1n, 'gregory', 'UTC', details)
    } catch (caught) {
      error = caught
    } finally {
      define(owner, key, descriptor)
    }
    expect(error).toBeUndefined()
    expect(actual).toEqual(expected)
    expect(named).toEqual(expectedNamed)
  }
)

it('retains nanosecond carries for fractional offsets near Date limits', () => {
  const offsets = [
    ['+23:59:59.999999999', 86_399_999_999_999n],
    ['-23:59:59.999999999', -86_399_999_999_999n],
    ['+12:34:56.123456789', 45_296_123_456_789n],
    ['-12:34:56.123456789', -45_296_123_456_789n],
    ['+23:59:59,999999999', 86_399_999_999_999n],
    ['-23:59:59,999999999', -86_399_999_999_999n],
    ['+12:34:56,123456789', 45_296_123_456_789n],
    ['-12:34:56,123456789', -45_296_123_456_789n],
  ] as const
  for (const anchor of [0, -8_639_999_913_600_000, 8_639_999_913_600_000]) {
    for (const [zone, offset] of offsets) {
      for (const delta of [-1n, 0n, 1n]) {
        const instant = BigInt(anchor) * 1_000_000n - offset + delta
        const expected = new Date(anchor + (delta < 0n ? -1 : 0))
        const year = expected.getUTCFullYear()
        expect(
          ToLocalTime(instant, 'gregory', zone, {tzData: {}}),
          `${instant} ${zone}`
        ).toMatchObject({
          year,
          month: expected.getUTCMonth(),
          day: expected.getUTCDate(),
          weekday: expected.getUTCDay(),
          hour: expected.getUTCHours(),
          minute: expected.getUTCMinutes(),
          second: expected.getUTCSeconds(),
          millisecond: expected.getUTCMilliseconds(),
        })
      }
    }
  }
})

it.each(['gregory', 'iso8601'])(
  'keeps signed %s local-time fields across BCE and offset boundaries',
  calendar => {
    for (const anchor of [
      -8_639_999_913_600_000, -62_198_755_200_000, -62_167_219_200_000,
      -62_135_596_800_000, 0, 8_639_999_913_600_000,
    ]) {
      for (const [zone, offset] of [
        ['+00:00', 0],
        ['+01:30', 5_400_000],
        ['-01:30', -5_400_000],
      ] as const) {
        for (const delta of [-1n, 0n, 1n]) {
          const expected = new Date(anchor + (delta < 0n ? -1 : 0))
          const epoch = BigInt(anchor - offset) * 1_000_000n + delta
          expect(
            ToLocalTime(epoch, calendar, zone, {tzData: {}}),
            `${calendar} ${epoch} ${zone}`
          ).toEqual({
            era: expected.getUTCFullYear() < 1 ? 'BC' : 'AD',
            year: expected.getUTCFullYear(),
            month: expected.getUTCMonth(),
            day: expected.getUTCDate(),
            weekday: expected.getUTCDay(),
            hour: expected.getUTCHours(),
            minute: expected.getUTCMinutes(),
            second: expected.getUTCSeconds(),
            millisecond: expected.getUTCMilliseconds(),
            inDST: false,
            timeZoneOffset: offset,
          })
        }
      }
    }
  }
)

import {UnpackTimeZoneData} from '#packages/ecma402-abstract/DateTimeFormat/UnpackTimeZoneData.js'
import {runfiles} from '@bazel/runfiles'
import {readFileSync} from 'node:fs'
import {expect, it} from 'vitest'
import packed from '@formatjs_generated/tz/all-tz.js'
import {Temporal} from '#packages/temporal/index.js'
import {
  createTimeZone,
  isoToEpochNanoseconds,
} from '#packages/temporal/kernel.js'
import type {UnpackedTimeZoneData} from '#packages/ecma402-abstract/types/date-time.js'

it('matches independent ICU strict next/previous transitions', () => {
  const file = runfiles.resolve(
    `${process.env.TEST_WORKSPACE || '_main'}/conformance-tests/icu4j/temporal-transition-fixtures.tsv`
  )
  const names = new Set(
    packed.zones.map(zone => zone.slice(0, zone.indexOf('|')))
  )
  let count = 0
  for (const line of readFileSync(file, 'utf8').trim().split('\n')) {
    if (line.startsWith('#')) continue
    const [name, milliseconds, next, previous] = line.split('\t')
    if (!names.has(name)) continue
    const value = new Temporal.ZonedDateTime(
      BigInt(milliseconds) * 1_000_000n,
      name
    )
    for (const [direction, expected] of [
      ['next', next],
      ['previous', previous],
    ] as const) {
      const result = value.getTimeZoneTransition(direction)
      expect(result?.epochNanoseconds ?? null, line + ' ' + direction).toBe(
        expected === 'null' ? null : BigInt(expected) * 1_000_000n
      )
      if (result) {
        expect(result.timeZoneId).toBe(value.timeZoneId)
        expect(
          new Temporal.ZonedDateTime(
            result.epochNanoseconds + (direction === 'next' ? -1n : 1n),
            name
          ).getTimeZoneTransition(direction)?.epochNanoseconds
        ).toBe(result.epochNanoseconds)
        const other = result.getTimeZoneTransition(direction)
        expect(
          other === null ||
            (direction === 'next'
              ? other.epochNanoseconds > result.epochNanoseconds
              : other.epochNanoseconds < result.epochNanoseconds)
        ).toBe(true)
      }
    }
    count++
  }
  expect(count).toBeGreaterThan(10000)
  console.log(
    `${count} ICU transition queries, both directions and nanosecond boundaries`
  )
})

it('skips abbreviation-only changes and resolves multiple nearby gaps', () => {
  const data: UnpackedTimeZoneData = [
    [-Infinity, '', 0, false],
    [0, 'same', 0, true],
    [3600, '', 3600, true],
    [7200, '', 7200, true],
  ]
  const zone = createTimeZone(data)
  expect(zone.transition(-1n, 'next')).toBe(3600_000_000_000n)
  expect(zone.transition(3600_000_000_000n, 'previous')).toBe(null)
  expect(
    zone.resolve({year: 1970, month: 1, day: 1, hour: 1, minute: 30})
  ).toBe(5400_000_000_000n)
  expect(
    zone.resolve({year: 1970, month: 1, day: 1, hour: 1, minute: 30}, 'earlier')
  ).toBe(1800_000_000_000n)
  expect(
    zone.resolve({year: 1970, month: 1, day: 1, hour: 3, minute: 30})
  ).toBe(9000_000_000_000n)
})

it('finds leap-only recurring changes across a non-leap century', () => {
  const data: UnpackedTimeZoneData = [[-Infinity, '', 3600, true]]
  data.future = {
    standardOffset: 0,
    daylightOffset: 3600,
    start: {kind: 'julian', day: 60, seconds: 0},
    end: {kind: 'day', day: 59, seconds: 3600},
  }
  const zone = createTimeZone(data),
    query = isoToEpochNanoseconds({year: 2100, month: 6, day: 1})
  expect(zone.transition(query, 'next')).toBe(
    isoToEpochNanoseconds({year: 2104, month: 2, day: 29})
  )
  expect(zone.transition(query, 'previous')).toBe(
    isoToEpochNanoseconds({year: 2096, month: 3, day: 1})
  )
})

it('keeps timezone operations independent of user array iteration', () => {
  const original = Array.prototype[Symbol.iterator]
  let result: string | undefined
  try {
    Array.prototype[Symbol.iterator] = () => {
      throw new Error('Array should not be iterated')
    }
    const data = UnpackTimeZoneData({
      abbrvs: 'A|B',
      offsets: '0|2s0',
      zones: ['Test|,0,0,0|2s,1,1,1'],
    })
    if (createTimeZone(data.Test).transition(-1n, 'next') !== 100_000_000_000n)
      throw new Error('Wrong transition')
    const zoned =
      Temporal.Instant.fromEpochNanoseconds(0n).toZonedDateTimeISO('US/Pacific')
    const next = zoned.getTimeZoneTransition('next')!
    result = zoned.until(next, {largestUnit: 'day'}).toString()
  } finally {
    Array.prototype[Symbol.iterator] = original
  }
  expect(result).toBe('P115DT10H')
})

it('keeps cold offset collection and fold candidates private', () => {
  const fields = {year: 1970, month: 1, day: 1, minute: 30}
  const data: UnpackedTimeZoneData = [
    [-Infinity, '', 3600, false],
    [1000, '', 0, false],
  ]
  const profiles: [object, PropertyKey][] = [
    [Set.prototype, 'add'],
    [Set.prototype, Symbol.iterator],
    [Array.prototype, 'push'],
    [Array.prototype, 'sort'],
    [Array.prototype, Symbol.iterator],
  ]
  for (let index = 0; index < profiles.length; index++) {
    const [target, key] = profiles[index]
    const original = Object.getOwnPropertyDescriptor(target, key)!
    let calls = 0
    let actual: bigint[] | undefined
    let error: unknown
    try {
      Object.defineProperty(target, key, {
        configurable: true,
        writable: true,
        value() {
          calls++
          throw new Error('Observable kernel collection')
        },
      })
      try {
        actual = createTimeZone(data).possibleInstants(fields)
      } catch (caught) {
        error = caught
      }
    } finally {
      Object.defineProperty(target, key, original)
    }
    if (error) throw error
    expect(calls).toBe(0)
    expect(actual).toEqual([-1_800_000_000_000n, 1_800_000_000_000n])
  }
})

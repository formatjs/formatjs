import {readFileSync} from 'node:fs'
import {runfiles} from '@bazel/runfiles'
import {expect, it} from 'vitest'
import packed from '@formatjs_generated/tz/all-tz.js'
import {Temporal} from '#packages/temporal/index.js'
import {createNow} from '#packages/temporal/now.js'
import {epochNanosecondsToISO} from '#packages/temporal/kernel.js'

it('converts host clock samples with independent ICU timezone expectations', () => {
  const file = runfiles.resolve(
    `${process.env.TEST_WORKSPACE || '_main'}/conformance-tests/icu4j/temporal-timezone-fixtures.tsv`
  )
  const names = new Set(
    packed.zones.map(zone => zone.slice(0, zone.indexOf('|')))
  )
  let count = 0
  for (const line of readFileSync(file, 'utf8').trim().split('\n')) {
    if (line.startsWith('#')) continue
    const [name, milliseconds, seconds] = line.split('\t')
    if (!names.has(name)) continue
    const epochNanoseconds = BigInt(milliseconds) * 1_000_000n + 123n,
      local = epochNanosecondsToISO(
        epochNanoseconds + BigInt(seconds) * 1_000_000_000n
      ),
      now = createNow({
        epochNanoseconds: () => epochNanoseconds,
        timeZoneId: () => name,
      })
    expect(now.instant().epochNanoseconds, line).toBe(epochNanoseconds)
    expect(now.zonedDateTimeISO().epochNanoseconds, line).toBe(epochNanoseconds)
    expect(now.plainDateTimeISO().toString(), line).toBe(
      Temporal.PlainDateTime.from(local).toString()
    )
    expect(now.plainDateISO().toString(), line).toBe(
      Temporal.PlainDate.from(local).toString()
    )
    expect(now.plainTimeISO().toString(), line).toBe(
      Temporal.PlainTime.from(local).toString()
    )
    count++
  }
  expect(count).toBe(13160)
})

it('validates zones before reading the clock; explicit zones skip the default', () => {
  const reads: string[] = [],
    now = createNow({
      timeZoneId() {
        reads.push('zone')
        return 'America/New_York'
      },
      epochNanoseconds() {
        reads.push('clock')
        return -1n
      },
    })
  expect(now.plainDateTimeISO().toString()).toBe(
    '1969-12-31T18:59:59.999999999'
  )
  expect(reads.splice(0)).toEqual(['zone', 'clock'])
  expect(now.zonedDateTimeISO('+01:00').toString()).toBe(
    '1970-01-01T00:59:59.999999999+01:00[+01:00]'
  )
  expect(reads.splice(0)).toEqual(['clock'])
  expect(() => now.plainDateISO('Invalid/Zone')).toThrow(RangeError)
  expect(() =>
    now.plainTimeISO({
      toString() {
        throw new Error('must not coerce')
      },
    })
  ).toThrow(TypeError)
  expect(reads).toEqual([])
  const instant = now.instant
  expect(instant.call(null).epochNanoseconds).toBe(-1n)
})

it('clamps clock bounds while preserving local range extensions and nanoseconds', () => {
  const limit = 8_640_000_000_000_000_000_000n
  for (const sign of [-1n, 1n]) {
    const now = createNow({
      epochNanoseconds: () => sign * (limit + 1n),
      timeZoneId: () => 'UTC',
    })
    expect(now.instant().epochNanoseconds).toBe(sign * limit)
    expect(now.zonedDateTimeISO('+23:59').epochNanoseconds).toBe(sign * limit)
    const plain = now.plainDateTimeISO('+23:59')
    expect(plain.calendarId).toBe('iso8601')
    expect(plain.microsecond).toBe(0)
  }
})

it('reads the real host wall clock and ignores mutable public Now methods', () => {
  const before = BigInt(Date.now()) * 1_000_000n,
    instant = Temporal.Now.instant(),
    after = BigInt(Date.now()) * 1_000_000n
  expect(
    instant.epochNanoseconds >= before && instant.epochNanoseconds <= after
  ).toBe(true)
  const now = createNow({epochNanoseconds: () => 0n, timeZoneId: () => 'UTC'})
  now.instant = () => {
    throw new Error('public instant called')
  }
  now.timeZoneId = () => {
    throw new Error('public zone called')
  }
  expect(now.plainDateTimeISO().toString()).toBe('1970-01-01T00:00:00')
})

it('uses a primary system-zone ID while preserving explicit aliases', () => {
  const now = createNow({
    epochNanoseconds: () => 0n,
    timeZoneId: () => 'US/Eastern',
  })
  expect(now.timeZoneId()).toBe('America/New_York')
  expect(now.zonedDateTimeISO().timeZoneId).toBe('America/New_York')
  expect(now.zonedDateTimeISO('US/Eastern').timeZoneId).toBe('US/Eastern')
})

it('treats a missing or unknown system zone as UTC instead of throwing', () => {
  for (const value of [undefined, null, 0, '', 'Etc/Unknown', '+05:30:15']) {
    const now = createNow({
      epochNanoseconds: () => 0n,
      timeZoneId: () => value as string,
    })
    expect(now.timeZoneId(), String(value)).toBe('UTC')
    expect(now.zonedDateTimeISO().toString(), String(value)).toBe(
      '1970-01-01T00:00:00+00:00[UTC]'
    )
    expect(now.plainDateISO().toString(), String(value)).toBe('1970-01-01')
  }
  const now = createNow({
    epochNanoseconds: () => 0n,
    timeZoneId: () => 'asia/kolkata',
  })
  expect(now.timeZoneId()).toBe('Asia/Kolkata')
})

it('uses UTC when the host system-zone lookup throws', () => {
  const now = createNow({
    epochNanoseconds: () => 0n,
    timeZoneId() {
      throw new Error('Host system zone unavailable')
    },
  })
  expect(now.timeZoneId()).toBe('UTC')
  expect(now.zonedDateTimeISO().toString()).toBe(
    '1970-01-01T00:00:00+00:00[UTC]'
  )
  expect(now.plainDateTimeISO().toString()).toBe('1970-01-01T00:00:00')
  expect(now.plainDateISO().toString()).toBe('1970-01-01')
  expect(now.plainTimeISO().toString()).toBe('00:00:00')
  expect(now.zonedDateTimeISO('+01:00').timeZoneId).toBe('+01:00')
  expect(() => now.zonedDateTimeISO('Invalid/Zone')).toThrow(RangeError)
})

it('uses the runtime wall clock when the configured clock throws', () => {
  const now = createNow({
    epochNanoseconds() {
      throw new Error('Host wall clock unavailable')
    },
    timeZoneId: () => 'UTC',
  })
  const before = Date.now()
  const instant = now.instant()
  const zoned = now.zonedDateTimeISO()
  const after = Date.now()
  expect(instant.epochMilliseconds).toBeGreaterThanOrEqual(before)
  expect(instant.epochMilliseconds).toBeLessThanOrEqual(after)
  expect(zoned.epochMilliseconds).toBeGreaterThanOrEqual(before)
  expect(zoned.epochMilliseconds).toBeLessThanOrEqual(after)
})

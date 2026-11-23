import {runfiles} from '@bazel/runfiles'
import {readFileSync} from 'node:fs'
import {expect, it} from 'vitest'
import packed from '@formatjs_generated/tz/all-tz.js'
import links from '@formatjs_generated/tz/links.js'
import primary from '@formatjs_generated/tz/primary.js'
import {Temporal} from '#packages/temporal/index.js'
import {
  primaryTimeZoneIdentifier,
  timeZoneIdentifier,
  timeZoneEquals,
  timeZone,
} from '#packages/temporal/zones.js'
import {createNow} from '#packages/temporal/now.js'

it('compares all available identity mappings with independent ICU IANA IDs', () => {
  const names = new Set([
    ...packed.zones.map(zone => zone.slice(0, zone.indexOf('|'))),
    ...Object.keys(links),
    ...Object.keys(primary),
    'UTC',
  ])
  const fixture = readFileSync(
    runfiles.resolve(
      `${process.env.TEST_WORKSPACE || '_main'}/conformance-tests/icu4j/temporal-timezone-identity-fixtures.tsv`
    ),
    'utf8'
  )
  const differences: string[] = []
  const controls: {
    id: string
    primary: string
    value: InstanceType<typeof Temporal.ZonedDateTime>
  }[] = []
  let count = 0
  for (const line of fixture.trim().split('\n')) {
    if (line.startsWith('#')) continue
    const [id, expected] = line.split('\t')
    if (!names.has(id)) continue
    const actual = primaryTimeZoneIdentifier(timeZoneIdentifier(id))
    if (actual !== expected) differences.push(`${id}\t${actual}\t${expected}`)
    expect(timeZoneIdentifier(id.toLowerCase()), id).toBe(id)
    expect(() => timeZone(id), id).not.toThrow()
    controls.push({
      id,
      primary: expected,
      value: new Temporal.ZonedDateTime(0n, id),
    })
    count++
  }
  console.log('ICU primary identities', count, 'differences', differences)
  expect(count).toBe(597)
  expect(differences).toEqual([])
  let pairs = 0
  for (let i = 0; i < controls.length; i++)
    for (let j = 0; j <= i; j++) {
      const one = controls[i],
        two = controls[j]
      expect(one.value.equals(two.value), `${one.id} / ${two.id}`).toBe(
        one.primary === two.primary
      )
      pairs++
    }
  expect(pairs).toBe(178503)
  for (const [id, target] of Object.entries(primary))
    expect(names.has(target), id).toBe(true)
})

it('keeps geopolitical primaries distinct while matching genuine aliases', () => {
  for (const [one, two] of [
    ['Africa/Accra', 'Africa/Abidjan'],
    ['Europe/Bratislava', 'Europe/Prague'],
    ['Arctic/Longyearbyen', 'Europe/Berlin'],
    ['Atlantic/Reykjavik', 'Africa/Abidjan'],
  ]) {
    const first = new Temporal.ZonedDateTime(0n, one),
      second = new Temporal.ZonedDateTime(0n, two)
    expect(first.equals(second)).toBe(false)
    expect(() =>
      first.until(second.add({hours: 24}), {largestUnit: 'day'})
    ).toThrow(RangeError)
    expect(
      first.until(second.add({hours: 24}), {largestUnit: 'hour'}).toString()
    ).toBe('PT24H')
    const now = createNow({epochNanoseconds: () => 0n, timeZoneId: () => one})
    expect(now.timeZoneId()).toBe(one)
    expect(timeZoneEquals(one, two)).toBe(false)
  }
  for (const [one, two] of [
    ['US/Eastern', 'America/New_York'],
    ['Pacific/Truk', 'Pacific/Chuuk'],
    ['Atlantic/Jan_Mayen', 'Arctic/Longyearbyen'],
    ['Etc/UTC', 'UTC'],
    ['Etc/GMT', 'UTC'],
  ]) {
    expect(
      new Temporal.ZonedDateTime(0n, one).equals(
        new Temporal.ZonedDateTime(0n, two)
      )
    ).toBe(true)
    expect(timeZoneEquals(one, two)).toBe(true)
  }
  expect(timeZoneEquals('UTC', '+00:00')).toBe(false)
})

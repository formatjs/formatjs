import {runfiles} from '@bazel/runfiles'
import {readFileSync} from 'node:fs'
import {expect, it} from 'vitest'
import packed from '@formatjs_generated/tz/all-tz.js'
import {Temporal} from '#packages/temporal/index.js'
import {epochNanosecondsToISO} from '#packages/temporal/kernel.js'

it('matches independent ICU offsets and local fields through future transitions', () => {
  const file = runfiles.resolve(
    `${process.env.TEST_WORKSPACE || '_main'}/conformance-tests/icu4j/temporal-timezone-fixtures.tsv`
  )
  const names = new Set(
    packed.zones.map(zone => zone.slice(0, zone.indexOf('|')))
  )
  let count = 0,
    transitions = 0
  let previous: {name: string; instant: bigint; offset: bigint} | undefined
  for (const line of readFileSync(file, 'utf8').trim().split('\n')) {
    if (line.startsWith('#')) continue
    const [name, milliseconds, seconds] = line.split('\t')
    if (!names.has(name)) continue
    const instant = BigInt(milliseconds) * 1_000_000n,
      offset = BigInt(seconds) * 1_000_000_000n
    const zoned = new Temporal.ZonedDateTime(instant, name)
    expect(zoned.offsetNanoseconds, line).toBe(Number(offset))
    const expected = epochNanosecondsToISO(instant + offset)
    expect(zoned.toPlainDateTime().toString()).toBe(
      Temporal.PlainDateTime.from(expected).toString()
    )
    if (
      previous?.name === name &&
      instant === previous.instant + 1_000_000n &&
      offset !== previous.offset
    ) {
      const fields = epochNanosecondsToISO(
        instant + (offset + previous.offset) / 2n + 123n
      )
      const candidates = [
        instant + (offset + previous.offset) / 2n + 123n - offset,
        instant + (offset + previous.offset) / 2n + 123n - previous.offset,
      ].sort((a, b) => (a < b ? -1 : 1))
      const bag = {...fields, timeZone: name}
      expect(
        Temporal.ZonedDateTime.from(bag, {disambiguation: 'earlier'})
          .epochNanoseconds
      ).toBe(candidates[0])
      expect(
        Temporal.ZonedDateTime.from(bag, {disambiguation: 'later'})
          .epochNanoseconds
      ).toBe(candidates[1])
      expect(Temporal.ZonedDateTime.from(bag).epochNanoseconds).toBe(
        candidates[offset > previous.offset ? 1 : 0]
      )
      expect(() =>
        Temporal.ZonedDateTime.from(bag, {disambiguation: 'reject'})
      ).toThrow(RangeError)
      const before = new Temporal.ZonedDateTime(
        instant - 43_200_000_000_000n,
        name
      )
      expect(before.add({days: 1}).epochNanoseconds).toBe(
        before.epochNanoseconds + 86_400_000_000_000n + previous.offset - offset
      )
      expect(before.add({hours: 24}).epochNanoseconds).toBe(
        before.epochNanoseconds + 86_400_000_000_000n
      )
      transitions++
    }
    previous = {name, instant, offset}
    count++
  }
  expect(count).toBe(13160)
  expect(transitions).toBe(1340)
})

it('preserves variable-length days, offsets, references and private conversions', () => {
  const value = Temporal.ZonedDateTime.from(
    '2020-03-07T12:00-05:00[america/new_york]'
  )
  expect(value.timeZoneId).toBe('America/New_York')
  expect(value.add({days: 1}).toString()).toBe(
    '2020-03-08T12:00:00-04:00[America/New_York]'
  )
  expect(value.add({hours: 24}).toString()).toBe(
    '2020-03-08T13:00:00-04:00[America/New_York]'
  )
  expect(value.add({days: 1}).hoursInDay).toBe(23)
  expect(
    Temporal.ZonedDateTime.from('2020-11-01T12:00-05:00[America/New_York]')
      .hoursInDay
  ).toBe(25)
  expect(() =>
    Temporal.ZonedDateTime.from('2020-03-08T12:00-05:00[America/New_York]')
  ).toThrow(RangeError)
  const shifted = Temporal.ZonedDateTime.from(
    '2020-03-08T12:00-05:00[America/New_York]',
    {offset: 'use'}
  )
  expect(shifted.hour).toBe(13)
  expect(Temporal.Instant.from(value).epochNanoseconds).toBe(
    value.epochNanoseconds
  )
  expect(Temporal.PlainDate.from(value).toString()).toBe('2020-03-07')
  expect(Temporal.PlainTime.from(value).toString()).toBe('12:00:00')
  expect(Temporal.PlainDateTime.from(value).toString()).toBe(
    '2020-03-07T12:00:00'
  )
  const alias = new Temporal.ZonedDateTime(value.epochNanoseconds, 'US/Eastern')
  expect(alias.timeZoneId).toBe('US/Eastern')
  expect(alias.equals(value)).toBe(true)
  expect(
    Temporal.Instant.from('1970-01-01T00:00Z')
      .toZonedDateTimeISO('-0130')
      .toJSON()
  ).toBe('1969-12-31T22:30:00-01:30[-01:30]')
  const skipped = Temporal.ZonedDateTime.from('2011-12-30[Pacific/Apia]')
  expect(skipped.toPlainDate().toString()).toBe('2011-12-31')
  const historical = Temporal.ZonedDateTime.from(
    '1900-01-01T00:00+00:09[Europe/Paris]'
  )
  expect(historical.offset).toBe('+00:09:21')
  expect(historical.toString()).toBe('1900-01-01T00:00:00+00:09[Europe/Paris]')
})

it('uses first valid instant for date-only gaps regardless of disambiguation', () => {
  const value = Temporal.ZonedDateTime.from('1986-01-01[Asia/Kathmandu]', {
    disambiguation: 'reject',
  })
  expect(value.toString()).toBe('1986-01-01T00:15:00+05:45[Asia/Kathmandu]')
  expect(value.startOfDay().epochNanoseconds).toBe(value.epochNanoseconds)
  const skipped = Temporal.ZonedDateTime.from('2011-12-30[Pacific/Apia]', {
    disambiguation: 'reject',
  })
  expect(skipped.toString()).toBe('2011-12-31T00:00:00+14:00[Pacific/Apia]')
})

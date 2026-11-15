import {expect, it} from 'vitest'
import {Temporal} from 'temporal-polyfill/implementation'
import {
  addISODays,
  epochNanosecondsToISO,
  isoToEpochNanoseconds,
  type Disambiguation,
  type ISODateTime,
} from './kernel.js'
import {timeZone} from './zones.js'

const instant = (text: string) => Temporal.Instant.from(text).epochNanoseconds
it('keeps nanoseconds across negative epochs, leap days and instant bounds', () => {
  const limit = 8_640_000_000_000_000_000_000n
  for (const value of [-limit, -1_000_001n, -1n, 0n, 1n, 1_000_001n, limit]) {
    const fields = epochNanosecondsToISO(value)
    expect(isoToEpochNanoseconds(fields)).toBe(value)
    const reference = new Temporal.Instant(value).toZonedDateTimeISO('UTC')
    for (const key of Object.keys(fields) as (keyof ISODateTime)[])
      expect(fields[key], `${value} ${key}`).toBe(reference[key])
  }
  expect(
    addISODays({year: 2000, month: 2, day: 28, nanosecond: 1}, 1)
  ).toMatchObject({year: 2000, month: 2, day: 29, nanosecond: 1})
  expect(addISODays({year: 1900, month: 3, day: 1}, -1)).toMatchObject({
    year: 1900,
    month: 2,
    day: 28,
  })
  expect(() => isoToEpochNanoseconds({year: 1900, month: 2, day: 29})).toThrow(
    RangeError
  )
  expect(() =>
    isoToEpochNanoseconds({year: 2024, month: 1, day: 1, hour: 24})
  ).toThrow(RangeError)
})

const cases: [string, ISODateTime, string[]][] = [
  [
    'America/New_York',
    {year: 2024, month: 3, day: 10, hour: 2, minute: 30},
    [],
  ],
  [
    'America/New_York',
    {year: 2024, month: 11, day: 3, hour: 1, minute: 30},
    ['2024-11-03T05:30Z', '2024-11-03T06:30Z'],
  ],
  [
    'America/New_York',
    {year: 2500, month: 3, day: 14, hour: 2, minute: 30},
    [],
  ],
  [
    'America/New_York',
    {year: 2500, month: 11, day: 7, hour: 1, minute: 30},
    ['2500-11-07T05:30Z', '2500-11-07T06:30Z'],
  ],
  [
    'Australia/Lord_Howe',
    {year: 2024, month: 10, day: 6, hour: 2, minute: 15},
    [],
  ],
  [
    'Australia/Lord_Howe',
    {year: 2024, month: 4, day: 7, hour: 1, minute: 45},
    ['2024-04-06T14:45Z', '2024-04-06T15:15Z'],
  ],
  ['Pacific/Apia', {year: 2011, month: 12, day: 30, hour: 12}, []],
  [
    'Europe/Paris',
    {year: 1890, month: 1, day: 1, nanosecond: 123},
    ['1889-12-31T23:50:39.000000123Z'],
  ],
]
it.each(cases)('resolves %s %j', (name, fields, expected) => {
  const zone = timeZone(name)
  expect(zone.possibleInstants(fields)).toEqual(expected.map(instant))
  for (const disambiguation of [
    'compatible',
    'earlier',
    'later',
    'reject',
  ] as Disambiguation[]) {
    const reference = () =>
      Temporal.ZonedDateTime.from({...fields, timeZone: name}, {disambiguation})
        .epochNanoseconds
    if (disambiguation === 'reject' && expected.length !== 1) {
      expect(() => zone.resolve(fields, disambiguation)).toThrow(RangeError)
      expect(reference).toThrow(RangeError)
    } else expect(zone.resolve(fields, disambiguation)).toBe(reference())
  }
})
it('preserves exact transition nanoseconds and distinguishes date arithmetic from elapsed days', () => {
  const zone = timeZone('America/New_York')
  const transition = instant('2500-03-14T07:00Z')
  expect(zone.offsetNanoseconds(transition - 1n)).toBe(-18000_000_000_000n)
  expect(zone.offsetNanoseconds(transition)).toBe(-14400_000_000_000n)
  const local = {year: 2024, month: 3, day: 9, hour: 12}
  expect(zone.resolve(addISODays(local, 1)) - zone.resolve(local)).toBe(
    23n * 3600n * 1_000_000_000n
  )
  expect(() => zone.offsetNanoseconds(8_640_000_000_000_000_000_001n)).toThrow(
    RangeError
  )
})

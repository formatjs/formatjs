import {expect, it} from 'vitest'
import data from '@formatjs_generated/tz/all-tz.js'
import {unpack} from '#packages/intl-datetimeformat/unpack.js'
import {TimeZoneOffset} from '#packages/ecma402-abstract/DateTimeFormat/TimeZoneOffset.js'
import type {
  TimeZoneFutureRule,
  UnpackedTimeZoneData,
} from '#packages/ecma402-abstract/types/date-time.js'

const zones = unpack(data)

it.each([
  ['America/New_York', '2500-01-15T12:00:00Z', -18000, false],
  ['America/New_York', '2500-07-15T12:00:00Z', -14400, true],
  ['Australia/Sydney', '2500-01-15T12:00:00Z', 39600, true],
  ['Australia/Sydney', '2500-07-15T12:00:00Z', 36000, false],
  ['Australia/Lord_Howe', '2500-01-15T12:00:00Z', 39600, true],
  ['Australia/Lord_Howe', '2500-07-15T12:00:00Z', 37800, false],
  ['Asia/Kolkata', '2500-07-15T12:00:00Z', 19800, false],
  ['Europe/Dublin', '2500-01-15T12:00:00Z', 0, true],
  ['Europe/Dublin', '2500-07-15T12:00:00Z', 3600, false],
] as const)(
  'retains generated future rules for %s at %s',
  (zone, instant, offset, daylight) => {
    expect(TimeZoneOffset(Date.parse(instant), zones[zone])).toEqual([
      offset,
      daylight,
    ])
  }
)

it('switches future offsets at the exact transition', () => {
  const instant = Date.parse('2500-03-14T07:00:00Z')
  expect(TimeZoneOffset(instant - 1, zones['America/New_York'])).toEqual([
    -18000,
    false,
  ])
  expect(TimeZoneOffset(instant, zones['America/New_York'])).toEqual([
    -14400,
    true,
  ])
})

function synthetic(rule: TimeZoneFutureRule): UnpackedTimeZoneData {
  return Object.assign(
    [[-Infinity, 'STD', 0, false] as [number, string, number, boolean]],
    {future: rule}
  )
}

it('distinguishes Julian rules from leap-year ordinal days', () => {
  const julian = synthetic({
    standardOffset: 0,
    daylightOffset: 3600,
    start: {kind: 'julian', day: 60, seconds: 0},
    end: {kind: 'julian', day: 300, seconds: 0},
  })
  const ordinal = synthetic({
    standardOffset: 0,
    daylightOffset: 3600,
    start: {kind: 'day', day: 59, seconds: 0},
    end: {kind: 'day', day: 300, seconds: 0},
  })
  const leapDay = Date.parse('2400-02-29T12:00:00Z')
  expect(TimeZoneOffset(leapDay, julian)).toEqual([0, false])
  expect(TimeZoneOffset(leapDay, ordinal)).toEqual([3600, true])
})

it('handles transition times crossing year boundaries', () => {
  const zone = synthetic({
    standardOffset: 0,
    daylightOffset: 3600,
    start: {kind: 'day', day: 0, seconds: -3600},
    end: {kind: 'day', day: 180, seconds: 7200},
  })
  expect(TimeZoneOffset(Date.parse('2499-12-31T22:59:59Z'), zone)).toEqual([
    0,
    false,
  ])
  expect(TimeZoneOffset(Date.parse('2499-12-31T23:00:00Z'), zone)).toEqual([
    3600,
    true,
  ])
})

it('continues recurring DST near the maximum Date year', () => {
  expect(
    TimeZoneOffset(Date.UTC(275000, 0, 15), zones['America/New_York'])
  ).toEqual([-18000, false])
  expect(
    TimeZoneOffset(Date.UTC(275000, 6, 15), zones['America/New_York'])
  ).toEqual([-14400, true])
})

it('handles the last weekday of a month with an extended transition time', () => {
  const zone = synthetic({
    standardOffset: 0,
    daylightOffset: 3600,
    start: {kind: 'month', month: 3, week: 5, weekday: 0, seconds: 93600},
    end: {kind: 'month', month: 10, week: 5, weekday: 0, seconds: 7200},
  })
  const instant = Date.parse('2500-03-29T02:00:00Z')
  expect(TimeZoneOffset(instant - 1, zone)).toEqual([0, false])
  expect(TimeZoneOffset(instant, zone)).toEqual([3600, true])
})

it('keeps the final offset for legacy packs without future rules', () => {
  expect(
    TimeZoneOffset(Date.parse('2500-07-15T12:00:00Z'), [
      [-Infinity, 'STD', 0, false],
      [0, 'DST', 3600, true],
    ])
  ).toEqual([3600, true])
})

it.each([
  [-18000, -14400, 90000],
  [-10800, -14400, 82800],
])(
  'supports all-year DST with standard offset %s',
  (standardOffset, daylightOffset, seconds) => {
    // RFC 9636 section 3.3.1: EST5EDT,0/0,J365/25 and XXX3EDT4,0/0,J365/23.
    const zone = synthetic({
      standardOffset,
      daylightOffset,
      start: {kind: 'day', day: 0, seconds: 0},
      end: {kind: 'julian', day: 365, seconds},
    })
    for (const instant of [
      '2500-01-01T00:00:00Z',
      '2500-01-15T12:00:00Z',
      '2500-07-15T12:00:00Z',
    ]) {
      expect(TimeZoneOffset(Date.parse(instant), zone)).toEqual([
        daylightOffset,
        true,
      ])
    }
  }
)

import {expect, it} from 'vitest'
import packed from '@formatjs_generated/tz/all-tz.js'
import {UnpackTimeZoneData} from '#packages/ecma402-abstract/DateTimeFormat/UnpackTimeZoneData.js'
import {
  compactTimeZoneNames,
  unpackCompactTimeZone,
} from '#packages/temporal/compact-timezone.js'
import {
  createTimeZone,
  isoToEpochNanoseconds,
  startOfTimeZoneDay,
} from '#packages/temporal/kernel.js'

it('reconstructs every finite IANA offset event, final cutoff and future rule', () => {
  const original = UnpackTimeZoneData(packed),
    names = compactTimeZoneNames()
  expect(names).toEqual(Object.keys(original).sort())
  let rows = 0
  for (const name of names) {
    const source = original[name],
      decoded = unpackCompactTimeZone(name),
      events = source.filter(
        (row, index) =>
          index === 0 ||
          index === source.length - 1 ||
          row[2] !== source[index - 1][2]
      )
    expect(
      decoded.map(row => [row[0], row[2]]),
      name
    ).toEqual(events.map(row => [row[0], row[2]]))
    expect(decoded.future, name).toEqual(source.future)
    rows += decoded.length - 1
    const before = createTimeZone(source),
      after = createTimeZone(decoded)
    const probes = [
      -8640000000000000000000n,
      -1n,
      0n,
      7258118400000000000n,
      8640000000000000000000n,
    ]
    for (const row of decoded.slice(1)) {
      const instant = BigInt(row[0]) * 1000000000n
      for (const delta of [-1n, 0n, 1n])
        expect(
          after.offsetNanoseconds(instant + delta),
          `${name} ${instant + delta}`
        ).toBe(before.offsetNanoseconds(instant + delta))
    }
    for (const instant of probes) {
      expect(after.offsetNanoseconds(instant), name).toBe(
        before.offsetNanoseconds(instant)
      )
      for (const direction of ['next', 'previous'] as const)
        expect(
          after.transition(instant, direction),
          `${name} ${instant} ${direction}`
        ).toBe(before.transition(instant, direction))
    }
  }
  expect(names).toHaveLength(457)
  expect(rows).toBe(19793)
  expect(() => unpackCompactTimeZone('__proto__')).toThrow(RangeError)
}, 60000)

it('finds the first local clock after midnight across overlapping transitions', () => {
  const hour = 3_600_000_000_000n
  for (const fields of [
    {year: 1970, month: 1, day: 1},
    {year: 275760, month: 9, day: 11},
  ]) {
    const midnight = isoToEpochNanoseconds(fields)
    const origin = midnight / 1_000_000_000n
    const first = (origin - 18_000n).toString(36)
    const second = (origin - 10_800n).toString(36)
    const zone = createTimeZone(
      UnpackTimeZoneData({
        abbrvs: 'TEST',
        offsets: 'dw0|-dw0|b40',
        zones: [`Test/Gap|,0,0,0|${first},0,1,0|${second},0,2,0`],
      })['Test/Gap']
    )
    expect(zone.resolve(fields)).toBe(midnight - 6n * hour)
    expect(startOfTimeZoneDay(midnight, zone)).toBe(midnight - 3n * hour)
  }
})

it('uses the exact minimum Instant transition to resolve a gap', () => {
  const name = 'Test/MinimumGap'
  const hour = 3_600_000_000_000n
  const midnight = {year: -271821, month: 4, day: 20}
  const minimum = isoToEpochNanoseconds(midnight)
  const rows = [0n, 1n, 3n].map(
    (offset, index) =>
      `${((minimum + offset * hour) / 1_000_000_000n).toString(36)},0,${index + 1},0`
  )
  const zone = createTimeZone(
    UnpackTimeZoneData({
      abbrvs: 'TEST',
      offsets: [0, 4, -2, 3]
        .map(offset => (offset * 3600).toString(36))
        .join('|'),
      zones: [`${name}|,0,0,0|${rows.join('|')}`],
    })[name]
  )

  const gap = {...midnight, hour: 2}
  expect(zone.resolve({...midnight, hour: 4}, 'reject')).toBe(minimum)
  expect(zone.resolve(gap, 'compatible')).toBe(minimum + 5n * hour)
  expect(zone.resolve(gap, 'later')).toBe(minimum + 5n * hour)
  expect(() => zone.resolve(gap, 'earlier')).toThrow('Instant out of range')
  expect(() => zone.resolve(gap, 'reject')).toThrow(
    'Ambiguous or nonexistent local time'
  )
})

it('finds the first millisecond of a discontinuous fixed footer', () => {
  const name = 'Test/Cutoff'
  const zone = createTimeZone(
    UnpackTimeZoneData({
      abbrvs: 'TEST',
      offsets: '0',
      zones: [name + '|,0,0,0|0,0,0,0'],
      future: {[name]: {standardOffset: 3600}},
    })[name]
  )
  const seam = 1_000_000n
  expect(zone.offsetNanoseconds(seam - 1n)).toBe(0n)
  expect(zone.offsetNanoseconds(seam)).toBe(3_600_000_000_000n)
  expect(zone.transition(seam - 1n, 'next')).toBe(seam)
  expect(zone.transition(seam + 1n, 'previous')).toBe(seam)
  expect(zone.transition(seam, 'next')).toBeNull()
  expect(zone.transition(seam, 'previous')).toBeNull()
})

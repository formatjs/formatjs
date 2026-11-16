import {expect, it} from 'vitest'
import packed from '@formatjs_generated/tz/all-tz.js'
import {UnpackTimeZoneData} from '#packages/ecma402-abstract/DateTimeFormat/UnpackTimeZoneData.js'
import {
  compactTimeZoneNames,
  unpackCompactTimeZone,
} from '#packages/temporal/compact-timezone.js'
import {createTimeZone} from '#packages/temporal/kernel.js'

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

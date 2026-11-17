import {runfiles} from '@bazel/runfiles'
import {readFileSync} from 'node:fs'
import {expect, it} from 'vitest'
import packed from '@formatjs_generated/tz/all-tz.js'
import {epochNanosecondsToISO} from '#packages/temporal/kernel.js'
import {timeZone} from '#packages/temporal/zones.js'

it('resolves future gaps and folds derived from ICU transitions', () => {
  const file = runfiles.resolve(
    `${process.env.TEST_WORKSPACE || '_main'}/conformance-tests/icu4j/temporal-timezone-fixtures.tsv`
  )
  const names = new Set(
    packed.zones.map(zone => zone.slice(0, zone.indexOf('|')))
  )
  let previous: {name: string; time: bigint; offset: bigint} | undefined
  let transitions = 0
  for (const line of readFileSync(file, 'utf8').trim().split('\n')) {
    if (line.startsWith('#')) continue
    const [name, milliseconds, seconds] = line.split('\t')
    if (!names.has(name)) continue
    const time = BigInt(milliseconds) * 1_000_000n
    const offset = BigInt(seconds) * 1_000_000_000n
    if (
      previous?.name === name &&
      time === previous.time + 1_000_000n &&
      offset !== previous.offset
    ) {
      const zone = timeZone(name)
      const local = time + (offset + previous.offset) / 2n + 123n
      const fields = epochNanosecondsToISO(local)
      const candidates = [local - offset, local - previous.offset].sort(
        (a, b) => (a < b ? -1 : 1)
      )
      const gap = offset > previous.offset
      expect(zone.possibleInstants(fields), `${name} ${time}`).toEqual(
        gap ? [] : candidates
      )
      expect(zone.resolve(fields, 'earlier')).toBe(candidates[0])
      expect(zone.resolve(fields, 'later')).toBe(candidates[1])
      expect(zone.resolve(fields)).toBe(candidates[gap ? 1 : 0])
      expect(() => zone.resolve(fields, 'reject')).toThrow(RangeError)
      transitions++
    }
    previous = {name, time, offset}
  }
  expect(transitions).toBeGreaterThan(500)
  console.log(`${transitions} ICU future gaps/folds, all disambiguation modes`)
})

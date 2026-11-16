import type {HostTimeZone} from '#packages/temporal/host-timezone.js'
import {epochNanosecondsToISO} from '#packages/temporal/kernel.js'

export interface HostTimezoneCounts {
  identities: number
  offsets: number
  gapsAndFolds: number
}
export function checkHostTimezoneOracle(
  create: (id: string) => HostTimeZone,
  identities: string,
  offsets: string,
  equal: (actual: unknown, expected: unknown, context: string) => void
): HostTimezoneCounts {
  const zones = new Map<string, HostTimeZone>()
  for (const line of identities.trim().split('\n')) {
    if (line.startsWith('#')) continue
    const id = line.split('\t')[0]
    try {
      zones.set(id, create(id))
    } catch (error) {
      if (!(error instanceof RangeError)) throw error
    }
  }
  const counts = {identities: zones.size, offsets: 0, gapsAndFolds: 0}
  let previous: {id: string; instant: bigint; offset: bigint} | undefined
  for (const line of offsets.trim().split('\n')) {
    if (line.startsWith('#')) continue
    const [id, milliseconds, seconds] = line.split('\t'),
      zone = zones.get(id)
    if (!zone) continue
    const instant = BigInt(milliseconds) * 1000000n,
      offset = BigInt(seconds) * 1000000000n
    equal(zone.offsetNanoseconds(instant), offset, line)
    equal(zone.offsetNanoseconds(instant + 123n), offset, line + ' fractional')
    if (
      previous?.id === id &&
      instant === previous.instant + 1000000n &&
      offset !== previous.offset
    ) {
      const local = instant + (offset + previous.offset) / 2n + 123n,
        fields = epochNanosecondsToISO(local),
        candidates = [local - offset, local - previous.offset].sort(
          (one, two) => (one < two ? -1 : 1)
        )
      equal(
        JSON.stringify(zone.possibleInstants(fields).map(String)),
        JSON.stringify(offset > previous.offset ? [] : candidates.map(String)),
        line + ' candidates'
      )
      equal(zone.resolve(fields, 'earlier'), candidates[0], line + ' earlier')
      equal(zone.resolve(fields, 'later'), candidates[1], line + ' later')
      equal(
        zone.resolve(fields),
        candidates[offset > previous.offset ? 1 : 0],
        line + ' compatible'
      )
      let rejected = false
      try {
        zone.resolve(fields, 'reject')
      } catch (error) {
        rejected = error instanceof RangeError
      }
      equal(rejected, true, line + ' reject')
      counts.gapsAndFolds++
    }
    previous = {id, instant, offset}
    counts.offsets++
  }
  equal(counts.identities, 597, 'Complete supported ICU identity scope')
  equal(counts.offsets, 17640, 'Complete ICU future offset scope')
  equal(counts.gapsAndFolds, 1900, 'Complete ICU gap/fold scope')
  return counts
}

import type {PackedData} from '#packages/intl-datetimeformat/types.js'
import type {UnpackedZoneData} from '#packages/ecma402-abstract/types/date-time.js'

export function unpack(data: PackedData): Record<string, UnpackedZoneData[]> {
  const abbrvs = data.abbrvs.split('|')
  const offsets = data.offsets.split('|').map(n => parseInt(n, 36))
  const packedZones = data.zones
  const zones: Record<string, UnpackedZoneData[]> = {}
  for (const d of packedZones) {
    const [zone, ...zoneData] = d.split('|')

    zones[zone] = zoneData
      .map(z => z.split(','))
      .map(([ts, abbrvIndex, offsetIndex, dst]) => [
        ts === '' ? -Infinity : parseInt(ts, 36),
        abbrvs[+abbrvIndex],
        offsets[+offsetIndex],
        dst === '1',
      ])
  }
  return zones
}

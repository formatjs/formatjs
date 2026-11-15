import type {
  PackedTimeZoneData,
  UnpackedTimeZoneData,
} from '#packages/ecma402-abstract/types/date-time.js'

export function UnpackTimeZoneData(
  data: PackedTimeZoneData
): Record<string, UnpackedTimeZoneData> {
  const abbrvs = data.abbrvs.split('|')
  const offsets = data.offsets.split('|').map(n => parseInt(n, 36))
  const packedZones = data.zones
  const zones: Record<string, UnpackedTimeZoneData> = {}
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
    if (data.future?.[zone]) zones[zone].future = data.future[zone]
  }
  return zones
}

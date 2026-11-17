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
  for (let index = 0; index < packedZones.length; index++) {
    const parts = packedZones[index].split('|'),
      zone = parts[0]
    const rows: UnpackedTimeZoneData = []
    for (let index = 1; index < parts.length; index++) {
      const row = parts[index].split(',')
      rows.push([
        row[0] === '' ? -Infinity : parseInt(row[0], 36),
        abbrvs[+row[1]],
        offsets[+row[2]],
        row[3] === '1',
      ])
    }
    zones[zone] = rows
    if (data.future?.[zone]) zones[zone].future = data.future[zone]
  }
  return zones
}

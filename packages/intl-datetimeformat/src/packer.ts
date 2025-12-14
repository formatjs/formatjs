import {UnpackedData, PackedData} from './types.js'
import {UnpackedZoneData} from '@formatjs/ecma402-abstract'

export function pack(data: UnpackedData): PackedData {
  const zoneNames = Object.keys(data.zones)
  zoneNames.sort() // so output is stable
  return {
    zones: zoneNames.map(zone =>
      [
        zone,
        ...data.zones[zone].map(([ts, ...others]) =>
          [ts === '' ? '' : ts.toString(36), ...others].join(',')
        ),
      ].join('|')
    ),
    abbrvs: data.abbrvs.join('|'),
    offsets: data.offsets.map(o => o.toString(36)).join('|'),
  }
}

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

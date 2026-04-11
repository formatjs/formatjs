import {type UnpackedData, type PackedData} from '../types.ts'

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

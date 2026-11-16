import {chinese} from '@formatjs_generated/icu.calendar/chinese.js'
import {dangi} from '@formatjs_generated/icu.calendar/dangi.js'
import {ummAlQura} from '@formatjs_generated/icu.calendar/umm-al-qura.js'
import primary from '@formatjs_generated/tz/primary.js'
import links from '@formatjs_generated/tz/links.js'
import packed from '@formatjs_generated/tz/all-tz.js'
import {
  compactTimeZoneNames,
  unpackCompactTimeZone,
} from '#packages/temporal/compact-timezone.js'
import {UnpackTimeZoneData} from '#packages/ecma402-abstract/DateTimeFormat/UnpackTimeZoneData.js'
import type {UnpackedTimeZoneData} from '#packages/ecma402-abstract/types/date-time.js'

declare global {
  interface ImportMeta {
    readonly formatjsTemporalNativeData?: boolean
    readonly formatjsTemporalCompactTimeZones?: boolean
  }
}
const nativeDataOnly = import.meta.formatjsTemporalNativeData === true
const compactTimeZones = import.meta.formatjsTemporalCompactTimeZones !== false
function unavailable(): never {
  throw new RangeError(
    'Temporal native build requires Rust calendar and timezone data'
  )
}
export function fallbackLunisolar(
  calendar: 'chinese' | 'dangi'
): typeof chinese {
  return nativeDataOnly
    ? unavailable()
    : calendar === 'chinese'
      ? chinese
      : dangi
}
export function fallbackUmmAlQura(): typeof ummAlQura {
  return nativeDataOnly ? unavailable() : ummAlQura
}
export function fallbackTimeZoneIdentifiers(): {
  primary: typeof primary
  links: typeof links
  names: string[]
} {
  return nativeDataOnly
    ? unavailable()
    : {
        primary,
        links,
        names: compactTimeZones
          ? compactTimeZoneNames()
          : packed.zones.map(entry => entry.slice(0, entry.indexOf('|'))),
      }
}
export function fallbackTimeZonePrimary(): typeof primary {
  return nativeDataOnly ? unavailable() : primary
}
export function fallbackTimeZoneData(name: string): UnpackedTimeZoneData {
  if (nativeDataOnly) return unavailable()
  if (compactTimeZones) return unpackCompactTimeZone(name)
  const entry = packed.zones.find(value => value.startsWith(name + '|'))
  if (!entry) throw new RangeError('Unknown canonical zone')
  return UnpackTimeZoneData({...packed, zones: [entry]})[name]
}

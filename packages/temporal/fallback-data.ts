import {RangeErrorConstructor} from '#packages/ecma262-abstract/intrinsics.js'
import {chinese} from '@formatjs_generated/icu.calendar/chinese.js'
import {dangi} from '@formatjs_generated/icu.calendar/dangi.js'
import {ummAlQura} from '@formatjs_generated/icu.calendar/umm-al-qura.js'
import packed from '@formatjs_generated/tz/all-tz.js'
import {
  compactTimeZoneNames,
  unpackCompactTimeZone,
} from '#packages/temporal/compact-timezone.js'
import {timeZoneMetadata} from '#packages/temporal/native.js'
import {UnpackTimeZoneData} from '#packages/ecma402-abstract/DateTimeFormat/UnpackTimeZoneData.js'
import type {UnpackedTimeZoneData} from '#packages/ecma402-abstract/types/date-time.js'

declare global {
  interface ImportMeta {
    readonly formatjsTemporalHostTimeZones?: boolean
    readonly formatjsTemporalNativeData?: boolean
    readonly formatjsTemporalCompactTimeZones?: boolean
  }
}
const hostTimeZones = import.meta.formatjsTemporalHostTimeZones === true
const nativeDataOnly = import.meta.formatjsTemporalNativeData === true
const compactTimeZones = import.meta.formatjsTemporalCompactTimeZones !== false
function unavailable(): never {
  throw new RangeErrorConstructor(
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
// Temporal comparison §11.1.1 step 1. Supply the generated zone identifiers and aliases.
export function fallbackTimeZoneIdentifiers() {
  if (nativeDataOnly) return unavailable()
  const metadata = timeZoneMetadata()
  return !hostTimeZones && compactTimeZones
    ? {...metadata, names: compactTimeZoneNames()}
    : metadata
}
export function fallbackTimeZonePrimary() {
  return fallbackTimeZoneIdentifiers().primary
}
export function fallbackTimeZoneData(name: string): UnpackedTimeZoneData {
  if (nativeDataOnly) return unavailable()
  if (compactTimeZones) return unpackCompactTimeZone(name)
  const entry = packed.zones.find(value => value.startsWith(name + '|'))
  if (!entry) throw new RangeErrorConstructor('Unknown canonical zone')
  return UnpackTimeZoneData({...packed, zones: [entry]})[name]
}

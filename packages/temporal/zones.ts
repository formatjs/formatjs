import {zeroPadDecimal} from '#packages/temporal/format-digits.js'
import {
  RangeErrorConstructor,
  TypeErrorConstructor,
  floor,
  numberFrom,
} from '#packages/ecma262-abstract/intrinsics.js'
import {createHostTimeZone} from '#packages/temporal/host-timezone.js'
import {nativeTemporal} from '#packages/temporal/native.js'
import {
  fallbackTimeZoneIdentifiers,
  fallbackTimeZonePrimary,
  fallbackTimeZoneData,
} from '#packages/temporal/fallback-data.js'
import {getZonedSlot} from '#packages/temporal/plain-slots.js'
import {
  isTimeZoneOffsetString,
  parseTimeZoneString,
  parseOffsetNanoseconds,
} from '#packages/temporal/instant-string.js'
import {
  createTimeZone,
  epochNanosecondsToISO,
  isoToEpochNanoseconds,
  type ISODateTime,
  type TimeZoneKernel,
} from '#packages/temporal/kernel.js'

const objectKeys = Object.keys
const stringToLowerCase = Function.prototype.call.bind(
  String.prototype.toLowerCase
) as (value: string) => string
const stringToUpperCase = Function.prototype.call.bind(
  String.prototype.toUpperCase
) as (value: string) => string
const MapConstructor = Map
const mapGet = Function.prototype.call.bind(MapConstructor.prototype.get) as <
  V,
>(
  map: Map<string, V>,
  key: string
) => V | undefined
const mapSet = Function.prototype.call.bind(MapConstructor.prototype.set) as <
  V,
>(
  map: Map<string, V>,
  key: string,
  value: V
) => void
let identifiers: Map<string, string> | undefined
const cache = new MapConstructor<string, ReturnType<typeof createTimeZone>>()
function typescriptTimeZone(name: string): TimeZoneKernel {
  if (import.meta.formatjsTemporalHostTimeZones === true) {
    if (name === 'UTC' || name === 'Etc/UTC' || name === 'Etc/GMT')
      return zonedKernel('UTC')
    let zone = mapGet(cache, name)
    if (!zone) mapSet(cache, name, (zone = createHostTimeZone(name)))
    return zone
  }
  if (!identifiers) {
    const {primary, links, names} = fallbackTimeZoneIdentifiers()
    identifiers = new MapConstructor()
    for (let i = 0; i < names.length; i++) {
      const canonical = names[i]
      mapSet(identifiers, stringToLowerCase(canonical), canonical)
    }
    const aliases = objectKeys({...links, ...primary})
    for (let i = 0; i < aliases.length; i++) {
      const alias = aliases[i],
        target = primary[alias as keyof typeof primary] ?? alias
      mapSet(
        identifiers,
        stringToLowerCase(alias),
        mapGet(identifiers, stringToLowerCase(target)) ?? target
      )
    }
  }
  const canonical = mapGet(identifiers, stringToLowerCase(name))
  if (canonical === undefined)
    throw new RangeErrorConstructor('Unknown timezone')
  if (canonical === 'UTC' || canonical === 'Etc/UTC' || canonical === 'Etc/GMT')
    return zonedKernel('UTC')
  name = canonical
  let zone = mapGet(cache, name)
  if (!zone) {
    mapSet(cache, name, (zone = createTimeZone(fallbackTimeZoneData(name))))
  }
  return zone
}
function withNativeZone(
  identifier: string,
  fallback: () => TimeZoneKernel
): TimeZoneKernel {
  let resolved: TimeZoneKernel | undefined
  const fallbackKernel = (): TimeZoneKernel => (resolved ??= fallback())
  const possibleInstants = (fields: ISODateTime): bigint[] => {
    const native = nativeTemporal()
    return import.meta.formatjsTemporalNativeData === true || native
      ? native!.timeZonePossibleInstants(identifier, fields)
      : fallbackKernel().possibleInstants(fields)
  }
  return {
    offsetNanoseconds: value => {
      const native = nativeTemporal()
      return import.meta.formatjsTemporalNativeData === true || native
        ? native!.timeZoneOffset(identifier, value)
        : fallbackKernel().offsetNanoseconds(value)
    },
    possibleInstants,
    possibleInstantsFromEpochNanoseconds: local => {
      if (import.meta.formatjsTemporalNativeData === true || nativeTemporal())
        return possibleInstants(epochNanosecondsToISO(local))
      const zone = fallbackKernel()
      if (nativeTemporal())
        return possibleInstants(epochNanosecondsToISO(local))
      return (
        zone.possibleInstantsFromEpochNanoseconds?.(local) ??
        zone.possibleInstants(epochNanosecondsToISO(local))
      )
    },
    resolve: (fields, disambiguation = 'compatible') => {
      const native = nativeTemporal()
      return import.meta.formatjsTemporalNativeData === true || native
        ? native!.timeZoneResolve(identifier, fields, disambiguation)
        : fallbackKernel().resolve(fields, disambiguation)
    },
    transition: (value, direction) => {
      const native = nativeTemporal()
      return import.meta.formatjsTemporalNativeData === true || native
        ? native!.timeZoneTransition(identifier, value, direction)
        : fallbackKernel().transition(value, direction)
    },
  }
}
const namedKernels = new MapConstructor<string, TimeZoneKernel>()
export function timeZone(name: string): TimeZoneKernel {
  const existing = mapGet(namedKernels, name)
  if (existing) return existing
  const identifier = timeZoneIdentifier(name)
  if (isTimeZoneOffsetString(identifier))
    throw new RangeErrorConstructor('Expected named timezone')
  let zone = mapGet(namedKernels, identifier)
  if (!zone) {
    zone = withNativeZone(identifier, () => typescriptTimeZone(identifier))
    mapSet(namedKernels, identifier, zone)
  }
  return zone
}
export * from '#packages/temporal/kernel.js'

export function resolveTimeZone(
  value: unknown
): Pick<TimeZoneKernel, 'offsetNanoseconds'> {
  const slot = getZonedSlot(value as object)
  if (slot) return zonedKernel(slot.timeZone)
  if (typeof value !== 'string')
    throw new TypeErrorConstructor('Timezone must be a string')
  const identifier = parseTimeZoneString(value)
  if (
    isTimeZoneOffsetString(identifier) ||
    stringToUpperCase(identifier) === 'UTC'
  )
    return zonedKernel(timeZoneIdentifier(identifier))
  return timeZone(identifier)
}

let spellings: Map<string, string> | undefined
export function timeZoneIdentifier(value: unknown): string {
  const slot = getZonedSlot(value as object)
  if (slot) return slot.timeZone
  if (typeof value !== 'string')
    throw new TypeErrorConstructor('Timezone must be a string')
  const name = parseTimeZoneString(value)
  const native = nativeTemporal()
  if (import.meta.formatjsTemporalNativeData === true || native)
    return native!.timeZoneIdentity(name).identifier
  if (isTimeZoneOffsetString(name)) {
    const offset = parseOffsetNanoseconds(name, true)
    const minutes = numberFrom(
      (offset < 0n ? -offset : offset) / 60_000_000_000n
    )
    return (
      (offset < 0n ? '-' : '+') +
      zeroPadDecimal(floor(minutes / 60), 2) +
      ':' +
      zeroPadDecimal(minutes % 60, 2)
    )
  }
  if (!spellings) {
    const {primary, links, names} = fallbackTimeZoneIdentifiers()
    spellings = new MapConstructor()
    for (let i = 0; i < names.length; i++) {
      const id = names[i]
      mapSet(spellings, stringToLowerCase(id), id)
    }
    const aliases = objectKeys({...links, ...primary})
    for (let i = 0; i < aliases.length; i++)
      mapSet(spellings, stringToLowerCase(aliases[i]), aliases[i])
    mapSet(spellings, 'utc', 'UTC')
  }
  const id = mapGet(spellings, stringToLowerCase(name))
  if (!id) throw new RangeErrorConstructor('Unknown timezone')
  if (import.meta.formatjsTemporalHostTimeZones === true) typescriptTimeZone(id)
  return id
}
const fixedKernels = new MapConstructor<string, TimeZoneKernel>()
export function zonedKernel(identifier: string): TimeZoneKernel {
  const utc = identifier === 'UTC'
  if (!utc && !isTimeZoneOffsetString(identifier)) return timeZone(identifier)
  const key = utc ? 'UTC' : identifier
  const existing = mapGet(fixedKernels, key)
  if (existing) return existing
  const offset = utc ? 0n : parseOffsetNanoseconds(identifier, true)
  const check = (value: bigint): bigint => {
    if (
      value < -8_640_000_000_000_000_000_000n ||
      value > 8_640_000_000_000_000_000_000n
    )
      throw new RangeErrorConstructor('Instant out of range')
    return value
  }
  const possibleInstantsFromEpochNanoseconds = (local: bigint): bigint[] => {
    const value = local - offset
    return value < -8_640_000_000_000_000_000_000n ||
      value > 8_640_000_000_000_000_000_000n
      ? []
      : [value]
  }
  const result: TimeZoneKernel = {
    transition: instant => {
      check(instant)
      return null
    },
    offsetNanoseconds: instant => {
      check(instant)
      return offset
    },
    possibleInstants: fields =>
      possibleInstantsFromEpochNanoseconds(isoToEpochNanoseconds(fields)),
    possibleInstantsFromEpochNanoseconds,
    resolve: fields => check(isoToEpochNanoseconds(fields) - offset),
  }
  const zone = withNativeZone(key, () => result)
  mapSet(fixedKernels, key, zone)
  return zone
}

export function primaryTimeZoneIdentifier(id: string): string {
  const native = nativeTemporal()
  if (import.meta.formatjsTemporalNativeData === true || native)
    return native!.timeZoneIdentity(id).primary
  const primary = fallbackTimeZonePrimary()
  return primary[id as keyof typeof primary] ?? id
}
export function timeZoneEquals(one: string, two: string): boolean {
  return primaryTimeZoneIdentifier(one) === primaryTimeZoneIdentifier(two)
}

import {createHostTimeZone} from '#packages/temporal/host-timezone.js'
import {nativeTemporal} from '#packages/temporal/native.js'
import {
  fallbackTimeZoneIdentifiers,
  fallbackTimeZonePrimary,
  fallbackTimeZoneData,
} from '#packages/temporal/fallback-data.js'
import {getZonedSlot} from '#packages/temporal/plain-slots.js'
import {
  parseTimeZoneString,
  parseOffsetNanoseconds,
} from '#packages/temporal/instant-string.js'
import {
  createTimeZone,
  isoToEpochNanoseconds,
  type TimeZoneKernel,
} from '#packages/temporal/kernel.js'

let identifiers: Map<string, string> | undefined
const cache = new Map<string, ReturnType<typeof createTimeZone>>()
function typescriptTimeZone(name: string): TimeZoneKernel {
  if (import.meta.formatjsTemporalHostTimeZones === true) {
    if (name === 'UTC' || name === 'Etc/UTC' || name === 'Etc/GMT')
      return zonedKernel('UTC')
    let zone = cache.get(name)
    if (!zone) cache.set(name, (zone = createHostTimeZone(name)))
    return zone
  }
  if (!identifiers) {
    const {primary, links, names} = fallbackTimeZoneIdentifiers()
    identifiers = new Map()
    for (let i = 0; i < names.length; i++) {
      const canonical = names[i]
      identifiers.set(canonical.toLowerCase(), canonical)
    }
    const aliases = Object.keys({...links, ...primary})
    for (let i = 0; i < aliases.length; i++) {
      const alias = aliases[i],
        target = primary[alias as keyof typeof primary] ?? alias
      identifiers.set(
        alias.toLowerCase(),
        identifiers.get(target.toLowerCase()) ?? target
      )
    }
  }
  const canonical = identifiers.get(name.toLowerCase())
  if (canonical === undefined) throw new RangeError('Unknown timezone')
  if (canonical === 'UTC' || canonical === 'Etc/UTC' || canonical === 'Etc/GMT')
    return zonedKernel('UTC')
  name = canonical
  let zone = cache.get(name)
  if (!zone) {
    cache.set(name, (zone = createTimeZone(fallbackTimeZoneData(name))))
  }
  return zone
}
function withNativeZone(
  identifier: string,
  fallback: () => TimeZoneKernel
): TimeZoneKernel {
  return {
    offsetNanoseconds: value => {
      const native = nativeTemporal()
      return import.meta.formatjsTemporalNativeData === true || native
        ? native!.timeZoneOffset(identifier, value)
        : fallback().offsetNanoseconds(value)
    },
    possibleInstants: fields => {
      const native = nativeTemporal()
      return import.meta.formatjsTemporalNativeData === true || native
        ? native!.timeZonePossibleInstants(identifier, fields)
        : fallback().possibleInstants(fields)
    },
    resolve: (fields, disambiguation = 'compatible') => {
      const native = nativeTemporal()
      return import.meta.formatjsTemporalNativeData === true || native
        ? native!.timeZoneResolve(identifier, fields, disambiguation)
        : fallback().resolve(fields, disambiguation)
    },
    transition: (value, direction) => {
      const native = nativeTemporal()
      return import.meta.formatjsTemporalNativeData === true || native
        ? native!.timeZoneTransition(identifier, value, direction)
        : fallback().transition(value, direction)
    },
  }
}
const namedKernels = new Map<string, TimeZoneKernel>()
export function timeZone(name: string): TimeZoneKernel {
  const existing = namedKernels.get(name)
  if (existing) return existing
  const identifier = timeZoneIdentifier(name)
  if (/^[+-]/.test(identifier)) throw new RangeError('Expected named timezone')
  let zone = namedKernels.get(identifier)
  if (!zone) {
    zone = withNativeZone(identifier, () => typescriptTimeZone(identifier))
    namedKernels.set(identifier, zone)
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
    throw new TypeError('Timezone must be a string')
  const identifier = parseTimeZoneString(value)
  if (/^[+-]/.test(identifier) || identifier.toUpperCase() === 'UTC')
    return zonedKernel(timeZoneIdentifier(identifier))
  return timeZone(identifier)
}

let spellings: Map<string, string> | undefined
export function timeZoneIdentifier(value: unknown): string {
  const slot = getZonedSlot(value as object)
  if (slot) return slot.timeZone
  if (typeof value !== 'string')
    throw new TypeError('Timezone must be a string')
  const name = parseTimeZoneString(value)
  const native = nativeTemporal()
  if (import.meta.formatjsTemporalNativeData === true || native)
    return native!.timeZoneIdentity(name).identifier
  if (/^[+-]/.test(name)) {
    const offset = parseOffsetNanoseconds(name, true)
    const minutes = Number((offset < 0n ? -offset : offset) / 60_000_000_000n)
    return (
      (offset < 0n ? '-' : '+') +
      String(Math.floor(minutes / 60)).padStart(2, '0') +
      ':' +
      String(minutes % 60).padStart(2, '0')
    )
  }
  if (!spellings) {
    const {primary, links, names} = fallbackTimeZoneIdentifiers()
    spellings = new Map()
    for (let i = 0; i < names.length; i++) {
      const id = names[i]
      spellings.set(id.toLowerCase(), id)
    }
    const aliases = Object.keys({...links, ...primary})
    for (let i = 0; i < aliases.length; i++)
      spellings.set(aliases[i].toLowerCase(), aliases[i])
    spellings.set('utc', 'UTC')
  }
  const id = spellings.get(name.toLowerCase())
  if (!id) throw new RangeError('Unknown timezone')
  if (import.meta.formatjsTemporalHostTimeZones === true) typescriptTimeZone(id)
  return id
}
const fixedKernels = new Map<string, TimeZoneKernel>()
export function zonedKernel(identifier: string): TimeZoneKernel {
  const utc = identifier === 'UTC'
  if (!utc && !/^[+-]/.test(identifier)) return timeZone(identifier)
  const key = utc ? 'UTC' : identifier
  const existing = fixedKernels.get(key)
  if (existing) return existing
  const offset = utc ? 0n : parseOffsetNanoseconds(identifier, true)
  const check = (value: bigint): bigint => {
    if (
      value < -8_640_000_000_000_000_000_000n ||
      value > 8_640_000_000_000_000_000_000n
    )
      throw new RangeError('Instant out of range')
    return value
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
    possibleInstants: fields => {
      const value = isoToEpochNanoseconds(fields) - offset
      return value < -8_640_000_000_000_000_000_000n ||
        value > 8_640_000_000_000_000_000_000n
        ? []
        : [value]
    },
    resolve: fields => check(isoToEpochNanoseconds(fields) - offset),
  }
  const zone = withNativeZone(key, () => result)
  fixedKernels.set(key, zone)
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

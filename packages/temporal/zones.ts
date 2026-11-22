import {zeroPadDecimal} from '#packages/temporal/format-digits.js'
import {HasOwnProperty} from '#packages/ecma262-abstract/HasOwnProperty.js'
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
// Proposal comparison §11.1.9 step 3: Select the named TypeScript offset provider.
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
// Proposal comparison §11.1.9 steps 2–3 and §11.1.13 steps 2.d and 3.a: Route zone queries to active data.
function withNativeZone(
  identifier: string,
  fallback: () => TimeZoneKernel
): TimeZoneKernel {
  let resolved: TimeZoneKernel | undefined
  // Proposal comparison §11.1.9 steps 2–3: Lazily retain the fallback offset provider.
  const fallbackKernel = (): TimeZoneKernel => (resolved ??= fallback())
  // Proposal comparison §11.1.13 steps 2.d and 3.a: Forward candidate lookup to the active provider.
  const possibleInstants = (fields: ISODateTime): bigint[] => {
    // ECMA-262 preview §22.2.1: the active provider supplies named-zone candidates.
    // https://tc39.es/ecma262/pr/3966/#sec-getnamedtimezoneepochnanoseconds
    const native = nativeTemporal()
    return import.meta.formatjsTemporalNativeData === true || native
      ? native!.timeZonePossibleInstants(identifier, fields)
      : fallbackKernel().possibleInstants(fields)
  }
  return {
    // Proposal comparison §11.1.9 steps 2–3: Forward the exact instant to the active offset provider.
    offsetNanoseconds: value => {
      const native = nativeTemporal()
      return import.meta.formatjsTemporalNativeData === true || native
        ? native!.timeZoneOffset(identifier, value)
        : fallbackKernel().offsetNanoseconds(value)
    },
    possibleInstants,
    // Proposal comparison §11.1.13 steps 2.d and 3.a: Adapt local nanoseconds for candidate lookup.
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
    // Proposal comparison §11.1.14 step 5: Forward the exact provider's raw boundary lookup.
    nearestLocalAfter: local => fallbackKernel().nearestLocalAfter?.(local),
    // ECMA-262 preview §22.2.13 steps 1–2: resolve candidates using the requested disambiguation.
    // https://tc39.es/ecma262/pr/3966/#sec-getepochnanosecondsfor
    resolve: (fields, disambiguation = 'compatible') => {
      const native = nativeTemporal()
      return import.meta.formatjsTemporalNativeData === true || native
        ? native!.timeZoneResolve(identifier, fields, disambiguation)
        : fallbackKernel().resolve(fields, disambiguation)
    },
    // Proposal comparison §6.3.46 steps 8, 9.a, 10.b and 11: Forward transition direction and instant.
    transition: (value, direction) => {
      const native = nativeTemporal()
      return import.meta.formatjsTemporalNativeData === true || native
        ? native!.timeZoneTransition(identifier, value, direction)
        : fallbackKernel().transition(value, direction)
    },
  }
}
const namedKernels = new MapConstructor<string, TimeZoneKernel>()
// Proposal comparison §11.1.8 steps 7–9: Resolve a named identifier before selecting its kernel.
export function timeZone(name: string): TimeZoneKernel {
  const existing = mapGet(namedKernels, name)
  if (existing) return existing
  const identifier = timeZoneIdentifier(name)
  if (isTimeZoneOffsetString(identifier))
    throw new RangeErrorConstructor('Expected named timezone')
  let zone = mapGet(namedKernels, identifier)
  if (!zone) {
    // Proposal comparison §11.1.9 step 3: Supply the TypeScript provider for the resolved name.
    zone = withNativeZone(identifier, () => typescriptTimeZone(identifier))
    mapSet(namedKernels, identifier, zone)
  }
  return zone
}
export * from '#packages/temporal/kernel.js'

// Proposal comparison §11.1.8 steps 1–3 and §11.1.9 steps 2–3: Select an offset lookup for the input zone.
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

// ECMA-262 preview §22.2.8: reuse the fixed spelling table for both hits and misses.
// https://tc39.es/ecma262/pr/3966/#sec-available-named-time-zone-identifier-return-record
let spellings: Map<string, string> | undefined
// ECMA-262 preview §22.2.10 steps 1–9: read a zoned slot or normalize a zone string.
// https://tc39.es/ecma262/pr/3966/#sec-totemporaltimezoneidentifier
// ECMA-262 preview §22.2: validate and normalize named and offset identifiers.
// https://tc39.es/ecma262/pr/3966/#sec-time-zone-identifiers
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
    // ECMA-262 preview §22.2.6: generated names and links supply the available identifier records.
    // https://tc39.es/ecma262/pr/3966/#sec-availablenamedtimezoneidentifiers
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
  // ECMA-262 preview §22.2.9 steps 4–6: the immutable lookup supplies canonical spelling.
  // https://tc39.es/ecma262/pr/3966/#sec-getavailablenamedtimezoneidentifier
  // Preview cache record field typo: https://github.com/tc39/ecma262/pull/3966#discussion_r4284082377
  const id = mapGet(spellings, stringToLowerCase(name))
  if (!id) throw new RangeErrorConstructor('Unknown timezone')
  if (import.meta.formatjsTemporalHostTimeZones === true) typescriptTimeZone(id)
  return id
}
const fixedKernels = new MapConstructor<string, TimeZoneKernel>()
// Proposal comparison §11.1.9 steps 2–3: Select the fixed, UTC or named provider kernel.
export function zonedKernel(identifier: string): TimeZoneKernel {
  const utc = identifier === 'UTC'
  if (!utc && !isTimeZoneOffsetString(identifier)) return timeZone(identifier)
  const key = utc ? 'UTC' : identifier
  const existing = mapGet(fixedKernels, key)
  if (existing) return existing
  const offset = utc ? 0n : parseOffsetNanoseconds(identifier, true)
  // Proposal comparison §8.5.1 step 1: Check inclusive Instant bounds for fixed kernels.
  const check = (value: bigint): bigint => {
    if (
      value < -8_640_000_000_000_000_000_000n ||
      value > 8_640_000_000_000_000_000_000n
    )
      throw new RangeErrorConstructor('Instant out of range')
    return value
  }
  // Proposal comparison §11.1.13 steps 2.a, 2.c and 2.d: Compute the private fixed-offset candidate.
  const possibleInstantsFromEpochNanoseconds = (local: bigint): bigint[] => {
    const value = local - offset
    return value < -8_640_000_000_000_000_000_000n ||
      value > 8_640_000_000_000_000_000_000n
      ? []
      : [value]
  }
  const result: TimeZoneKernel = {
    // Proposal comparison §6.3.46 steps 8 and 11: Return no transition for a constant-offset provider.
    // ECMA-262 preview §22.2.4: UTC has no offset changes.
    // https://tc39.es/ecma262/pr/3966/#sec-getnamedtimezoneprevioustransition
    transition: instant => {
      check(instant)
      return null
    },
    // Proposal comparison §11.1.9 steps 2–3: Return the exact precomputed fixed or UTC offset.
    offsetNanoseconds: instant => {
      check(instant)
      return offset
    },
    // Proposal comparison §11.1.13 steps 2.a, 2.c and 2.d: Convert local ISO fields for fixed candidate lookup.
    possibleInstants: fields =>
      possibleInstantsFromEpochNanoseconds(isoToEpochNanoseconds(fields)),
    possibleInstantsFromEpochNanoseconds,
    // Proposal comparison §11.1.11 steps 1–2: Resolve and range-check the sole fixed-offset result.
    resolve: fields => check(isoToEpochNanoseconds(fields) - offset),
  }
  // Proposal comparison §11.1.9 steps 2–3: Supply the prebuilt fixed or UTC fallback.
  const zone = withNativeZone(key, () => result)
  mapSet(fixedKernels, key, zone)
  return zone
}

export function primaryTimeZoneIdentifier(id: string): string {
  const native = nativeTemporal()
  if (import.meta.formatjsTemporalNativeData === true || native)
    return native!.timeZoneIdentity(id).primary
  const primary = fallbackTimeZonePrimary()
  // Temporal comparison §11.1.15 step2.e: sparse private data has no inherited keys.
  // https://tc39.es/proposal-temporal/#sec-temporal-timezoneequals
  return HasOwnProperty(primary, id)
    ? (primary[id as keyof typeof primary] ?? id)
    : id
}
export function timeZoneEquals(one: string, two: string): boolean {
  // Temporal comparison §11.1.15 step1: identical identifiers compare directly.
  if (one === two) return true
  return primaryTimeZoneIdentifier(one) === primaryTimeZoneIdentifier(two)
}

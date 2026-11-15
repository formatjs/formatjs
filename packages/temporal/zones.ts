import primary from '@formatjs_generated/tz/primary.js'
import {getZonedSlot} from '#packages/temporal/plain-slots.js'
import links from '@formatjs_generated/tz/links.js'
import {
  parseTimeZoneString,
  parseOffsetNanoseconds,
} from '#packages/temporal/instant-string.js'
import packed from '@formatjs_generated/tz/all-tz.js'
import {UnpackTimeZoneData} from '#packages/ecma402-abstract/DateTimeFormat/UnpackTimeZoneData.js'
import {
  createTimeZone,
  isoToEpochNanoseconds,
  type TimeZoneKernel,
} from '#packages/temporal/kernel.js'

let identifiers: Map<string, string> | undefined
const cache = new Map<string, ReturnType<typeof createTimeZone>>()
export function timeZone(name: string): TimeZoneKernel {
  if (!identifiers) {
    identifiers = new Map()
    for (let i = 0; i < packed.zones.length; i++) {
      const entry = packed.zones[i],
        canonical = entry.slice(0, entry.indexOf('|'))
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
    const entry = packed.zones.find(value => value.startsWith(name + '|'))
    if (!entry) throw new RangeError('Unknown canonical zone')
    const data = UnpackTimeZoneData({...packed, zones: [entry]})
    cache.set(name, (zone = createTimeZone(data[name])))
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
  if (/^[+-]/.test(identifier)) {
    const offset = parseOffsetNanoseconds(identifier, true)
    return {offsetNanoseconds: () => offset}
  }
  if (identifier.toUpperCase() === 'UTC') return {offsetNanoseconds: () => 0n}
  return timeZone(identifier)
}

let spellings: Map<string, string> | undefined
export function timeZoneIdentifier(value: unknown): string {
  const slot = getZonedSlot(value as object)
  if (slot) return slot.timeZone
  if (typeof value !== 'string')
    throw new TypeError('Timezone must be a string')
  const name = parseTimeZoneString(value)
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
    spellings = new Map()
    for (let i = 0; i < packed.zones.length; i++) {
      const entry = packed.zones[i],
        id = entry.slice(0, entry.indexOf('|'))
      spellings.set(id.toLowerCase(), id)
    }
    const aliases = Object.keys({...links, ...primary})
    for (let i = 0; i < aliases.length; i++)
      spellings.set(aliases[i].toLowerCase(), aliases[i])
    spellings.set('utc', 'UTC')
  }
  const id = spellings.get(name.toLowerCase())
  if (!id) throw new RangeError('Unknown timezone')
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
  fixedKernels.set(key, result)
  return result
}

export function primaryTimeZoneIdentifier(id: string): string {
  return primary[id as keyof typeof primary] ?? id
}
export function timeZoneEquals(one: string, two: string): boolean {
  return primaryTimeZoneIdentifier(one) === primaryTimeZoneIdentifier(two)
}

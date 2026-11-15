import links from '@formatjs_generated/tz/links.js'
import {
  parseTimeZoneString,
  parseOffsetNanoseconds,
} from '#packages/temporal/instant-string.js'
import packed from '@formatjs_generated/tz/all-tz.js'
import {UnpackTimeZoneData} from '#packages/ecma402-abstract/DateTimeFormat/UnpackTimeZoneData.js'
import {createTimeZone, type TimeZoneKernel} from '#packages/temporal/kernel.js'

let identifiers: Map<string, string> | undefined
const cache = new Map<string, ReturnType<typeof createTimeZone>>()
export function timeZone(name: string): TimeZoneKernel {
  if (!identifiers) {
    identifiers = new Map(
      packed.zones.map(entry => {
        const canonical = entry.slice(0, entry.indexOf('|'))
        return [canonical.toLowerCase(), canonical]
      })
    )
    for (const [alias, target] of Object.entries(links))
      identifiers.set(
        alias.toLowerCase(),
        identifiers.get(target.toLowerCase()) ?? target
      )
  }
  const canonical = identifiers.get(name.toLowerCase())
  if (canonical === undefined) throw new RangeError('Unknown timezone')
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

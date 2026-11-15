import packed from '@formatjs_generated/tz/all-tz.js'
import {unpack} from '#packages/intl-datetimeformat/unpack.js'
import {createTimeZone, type TimeZoneKernel} from './kernel.js'

const cache = new Map<string, ReturnType<typeof createTimeZone>>()
export function timeZone(name: string): TimeZoneKernel {
  let zone = cache.get(name)
  if (!zone) {
    const entry = packed.zones.find(value => value.startsWith(name + '|'))
    if (!entry) throw new RangeError('Unknown canonical zone')
    const data = unpack({...packed, zones: [entry]})
    cache.set(name, (zone = createTimeZone(data[name])))
  }
  return zone
}
export * from './kernel.js'

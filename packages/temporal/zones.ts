import packed from '@formatjs_generated/tz/all-tz.js'
import {UnpackTimeZoneData} from '#packages/ecma402-abstract/DateTimeFormat/UnpackTimeZoneData.js'
import {createTimeZone, type TimeZoneKernel} from '#packages/temporal/kernel.js'

const cache = new Map<string, ReturnType<typeof createTimeZone>>()
export function timeZone(name: string): TimeZoneKernel {
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

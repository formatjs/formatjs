import {RangeErrorConstructor} from '#packages/ecma262-abstract/intrinsics.js'
import {compact} from '@formatjs_generated/tz/temporal-compact.js'
import {TimeZoneRuleTransition} from '#packages/ecma402-abstract/DateTimeFormat/TimeZoneOffset.js'
import type {UnpackedTimeZoneData} from '#packages/ecma402-abstract/types/date-time.js'

export function compactTimeZoneNames(): string[] {
  return Object.keys(compact.zones)
}

export function unpackCompactTimeZone(name: string): UnpackedTimeZoneData {
  const entry = Object.hasOwn(compact.zones, name)
    ? compact.zones[name]
    : undefined
  if (!entry) throw new RangeErrorConstructor('Unknown timezone')
  const [initial, future, fixed, spans] = entry,
    data: UnpackedTimeZoneData = [
      [-Infinity, '', compact.offsets[initial], false],
    ]
  for (let index = 0; index < fixed.length; index += 2)
    data.push([fixed[index], '', compact.offsets[fixed[index + 1]], false])
  for (let index = 0; index < spans.length; index += 4)
    for (let year = spans[index]; year <= spans[index + 1]; year++)
      data.push([
        TimeZoneRuleTransition(year, compact.rules[spans[index + 2]]),
        '',
        compact.offsets[spans[index + 3]],
        false,
      ])
  data.sort((one, two) => one[0] - two[0])
  if (future >= 0) data.future = compact.futures[future]
  return data
}

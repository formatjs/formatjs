import {HasOwnProperty} from '#packages/ecma262-abstract/HasOwnProperty.js'
import {
  RangeErrorConstructor,
  setDataProperty,
} from '#packages/ecma262-abstract/intrinsics.js'
import {compact} from '@formatjs_generated/tz/temporal-compact.js'
import {TimeZoneRuleTransition} from '#packages/ecma402-abstract/DateTimeFormat/TimeZoneOffset.js'
import type {UnpackedTimeZoneData} from '#packages/ecma402-abstract/types/date-time.js'

const objectKeys = Object.keys
const sortRows = Function.prototype.call.bind(Array.prototype.sort) as (
  rows: UnpackedTimeZoneData,
  compare: (
    one: UnpackedTimeZoneData[number],
    two: UnpackedTimeZoneData[number]
  ) => number
) => void

// Proposal comparison §11.1.1 step 1: supply generated zone names to the identifier table.
export function compactTimeZoneNames(): string[] {
  return objectKeys(compact.zones)
}

// Proposal comparison §11.1.9 step 3: decode compact rows for named-zone offset lookup.
export function unpackCompactTimeZone(name: string): UnpackedTimeZoneData {
  const entry = HasOwnProperty(compact.zones, name)
    ? compact.zones[name]
    : undefined
  if (!entry) throw new RangeErrorConstructor('Unknown timezone')
  const initial = entry[0],
    future = entry[1],
    fixed = entry[2],
    spans = entry[3],
    data: UnpackedTimeZoneData = [
      [-Infinity, '', compact.offsets[initial], false],
    ]
  for (let index = 0; index < fixed.length; index += 2)
    setDataProperty(data, `${data.length}`, [
      fixed[index],
      '',
      compact.offsets[fixed[index + 1]],
      false,
    ])
  for (let index = 0; index < spans.length; index += 4)
    for (let year = spans[index]; year <= spans[index + 1]; year++)
      setDataProperty(data, `${data.length}`, [
        TimeZoneRuleTransition(year, compact.rules[spans[index + 2]]),
        '',
        compact.offsets[spans[index + 3]],
        false,
      ])
  sortRows(
    data,
    // Proposal comparison §11.1.9 step 3. Order rows for the named offset lookup.
    (one, two) => one[0] - two[0]
  )
  if (future >= 0) setDataProperty(data, 'future', compact.futures[future])
  return data
}

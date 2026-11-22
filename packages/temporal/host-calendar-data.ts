import {setDataProperty} from '#packages/ecma262-abstract/intrinsics.js'
import {ranges as chinese} from '@formatjs_generated/icu.calendar/host-chinese.js'
import {ranges as dangi} from '@formatjs_generated/icu.calendar/host-dangi.js'

export interface CalendarYearData {
  starts: number[]
  end: number
  leap: number
}
interface Range {
  firstYear: number
  years: readonly number[]
  starts: number[]
}
const apply = Reflect.apply
const mapGet = Map.prototype.get
const mapSet = Map.prototype.set
const cache = new Map<string, Range[]>()
function ranges(calendar: 'chinese' | 'dangi'): Range[] {
  let result = apply(mapGet, cache, [calendar]) as Range[] | undefined
  if (!result) {
    result = []
    const values = calendar === 'chinese' ? chinese : dangi
    for (let index = 0; index < values.length; index++) {
      const range = values[index]
      const starts = [range.startDay]
      for (let index = 0; index < range.years.length; index++) {
        const packed = range.years[index]
        let days = (packed >>> 13 ? 13 : 12) * 29,
          bits = packed & 8191
        while (bits) {
          days++
          bits &= bits - 1
        }
        setDataProperty(starts, starts.length, starts[starts.length - 1] + days)
      }
      setDataProperty(result, result.length, {
        firstYear: range.firstYear,
        years: range.years,
        starts,
      })
    }
    apply(mapSet, cache, [calendar, result])
  }
  return result
}

export function compactCalendarYear(
  calendar: 'chinese' | 'dangi',
  year: number
): CalendarYearData | undefined {
  const values = ranges(calendar)
  for (let offset = 0; offset < values.length; offset++) {
    const range = values[offset]
    const index = year - range.firstYear
    if (index < 0 || index >= range.years.length) continue
    const packed = range.years[index],
      leap = packed >>> 13,
      count = leap ? 13 : 12,
      starts = [range.starts[index]]
    for (let month = 0; month < count - 1; month++)
      setDataProperty(
        starts,
        starts.length,
        starts[month] + 29 + ((packed >>> month) & 1)
      )
    return {starts, end: range.starts[index + 1], leap}
  }
  return undefined
}

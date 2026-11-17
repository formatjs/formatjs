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
const cache = new Map<string, Range[]>()
function ranges(calendar: 'chinese' | 'dangi'): Range[] {
  let result = cache.get(calendar)
  if (!result) {
    result = (calendar === 'chinese' ? chinese : dangi).map(range => {
      const starts = [range.startDay]
      for (const packed of range.years) {
        let days = (packed >>> 13 ? 13 : 12) * 29,
          bits = packed & 8191
        while (bits) {
          days++
          bits &= bits - 1
        }
        starts.push(starts[starts.length - 1] + days)
      }
      return {...range, starts}
    })
    cache.set(calendar, result)
  }
  return result
}

export function compactCalendarYear(
  calendar: 'chinese' | 'dangi',
  year: number
): CalendarYearData | undefined {
  for (const range of ranges(calendar)) {
    const index = year - range.firstYear
    if (index < 0 || index >= range.years.length) continue
    const packed = range.years[index],
      leap = packed >>> 13,
      count = leap ? 13 : 12,
      starts = [range.starts[index]]
    for (let month = 0; month < count - 1; month++)
      starts.push(starts[month] + 29 + ((packed >>> month) & 1))
    return {starts, end: range.starts[index + 1], leap}
  }
  return undefined
}

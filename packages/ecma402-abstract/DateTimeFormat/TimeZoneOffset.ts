import {floor} from '#packages/ecma262-abstract/intrinsics.js'
import {
  DayFromYear,
  DaysInYear,
  YearFromTime,
} from '#packages/ecma262-abstract/DateOperations.js'
import type {
  TimeZoneFutureRule,
  TimeZoneTransitionRule,
  UnpackedTimeZoneData,
} from '#packages/ecma402-abstract/types/date-time.js'

const monthStarts = [0, 31, 59, 90, 120, 151, 181, 212, 243, 273, 304, 334]

export function TimeZoneRuleTransition(
  year: number,
  rule: TimeZoneTransitionRule
): number {
  const leap = DaysInYear(year) === 366
  let day: number
  if (rule.kind === 'month') {
    const first =
      DayFromYear(year) +
      monthStarts[rule.month - 1] +
      Number(leap && rule.month > 2)
    const weekday = (((first + 4) % 7) + 7) % 7
    day = first + ((rule.weekday - weekday + 7) % 7) + (rule.week - 1) * 7
    const next =
      rule.month === 12
        ? DayFromYear(year + 1)
        : DayFromYear(year) +
          monthStarts[rule.month] +
          Number(leap && rule.month >= 2)
    if (day >= next) day -= 7
  } else {
    day = DayFromYear(year) + rule.day
    if (rule.kind === 'julian') day += -1 + Number(leap && rule.day >= 60)
  }
  return day * 86400 + rule.seconds
}

function futureOffset(t: number, rule: TimeZoneFutureRule): [number, boolean] {
  const {standardOffset, daylightOffset, start, end} = rule
  if (daylightOffset === undefined || !start || !end)
    return [standardOffset, false]
  const year = YearFromTime(t)
  const seconds = t / 1000
  let latest = -Infinity
  let inDST = false
  // Extended transition times can cross year boundaries.
  for (let y = year - 1; y <= year + 1; y++) {
    const begin = TimeZoneRuleTransition(y, start) - standardOffset
    const finish = TimeZoneRuleTransition(y, end) - daylightOffset
    // TZif's all-year DST form has coincident end/start events; start wins.
    if (begin <= seconds && begin >= latest) {
      latest = begin
      inDST = true
    }
    if (finish <= seconds && finish > latest) {
      latest = finish
      inDST = false
    }
  }
  return [inDST ? daylightOffset : standardOffset, inDST]
}

/** Offsets in seconds. TZif future rules apply after the last explicit transition. */
export function TimeZoneOffset(
  t: number,
  data: UnpackedTimeZoneData
): [number, boolean] {
  if (data.future && t / 1000 > data[data.length - 1][0]) {
    return futureOffset(t, data.future)
  }
  let low = 0
  let high = data.length
  while (low + 1 < high) {
    const middle = floor((low + high) / 2)
    if (data[middle][0] <= t / 1000) low = middle
    else high = middle
  }
  return [data[low][2], data[low][3]]
}

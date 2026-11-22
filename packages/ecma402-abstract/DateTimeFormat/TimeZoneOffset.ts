import {
  floor,
  mathMax,
  numberFrom,
  numberIsInteger,
} from '#packages/ecma262-abstract/intrinsics.js'
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
      numberFrom(leap && rule.month > 2)
    const weekday = (((first + 4) % 7) + 7) % 7
    day = first + ((rule.weekday - weekday + 7) % 7) + (rule.week - 1) * 7
    const next =
      rule.month === 12
        ? DayFromYear(year + 1)
        : DayFromYear(year) +
          monthStarts[rule.month] +
          numberFrom(leap && rule.month >= 2)
    if (day >= next) day -= 7
  } else {
    day = DayFromYear(year) + rule.day
    if (rule.kind === 'julian') day += -1 + numberFrom(leap && rule.day >= 60)
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

function transitionIndex(seconds: number, data: UnpackedTimeZoneData): number {
  let low = 0
  let high = data.length
  while (low + 1 < high) {
    const middle = floor((low + high) / 2)
    if (data[middle][0] <= seconds) low = middle
    else high = middle
  }
  return low
}

/** Offsets in seconds. TZif future rules apply after the last explicit transition. */
export function TimeZoneOffset(
  t: number,
  data: UnpackedTimeZoneData
): [number, boolean] {
  const seconds = t / 1000
  if (data.future && seconds > data[data.length - 1][0]) {
    return futureOffset(t, data.future)
  }
  const row = data[transitionIndex(seconds, data)]
  return [row[2], row[3]]
}

/** Visit offsets that can be active in a closed epoch-millisecond interval. */
export function VisitTimeZoneOffsets(
  firstMilliseconds: number,
  lastMilliseconds: number,
  data: UnpackedTimeZoneData,
  visit: (offset: number) => void
): void {
  const lastSeconds = lastMilliseconds / 1000
  const first = transitionIndex(firstMilliseconds / 1000, data)
  visit(data[first][2])
  for (let index = first + 1; index < data.length; index++) {
    if (data[index][0] > lastSeconds) break
    visit(data[index][2])
  }
  const future = data.future
  if (future && lastSeconds > data[data.length - 1][0]) {
    visit(future.standardOffset)
    if (future.daylightOffset !== undefined) visit(future.daylightOffset)
  }
}

/** Visit possible offset boundaries at integer epoch milliseconds. */
export function VisitTimeZoneBoundaries(
  firstMilliseconds: number,
  lastMilliseconds: number,
  data: UnpackedTimeZoneData,
  visit: (milliseconds: number) => void
): boolean {
  const first = transitionIndex(firstMilliseconds / 1000, data)
  for (let index = first + 1; index < data.length; index++) {
    const milliseconds = data[index][0] * 1000
    if (milliseconds > lastMilliseconds) break
    visit(milliseconds)
  }

  const cutoff = data[data.length - 1][0] * 1000
  const future = data.future
  if (!future || cutoff >= lastMilliseconds) return true
  const firstFuture = mathMax(firstMilliseconds, cutoff + 1)
  // The formatter's footer branch begins at the first millisecond after cutoff.
  if (cutoff >= firstMilliseconds) visit(cutoff + 1)
  const {standardOffset, daylightOffset, start, end} = future
  if (daylightOffset === undefined || !start || !end) return true
  if (
    !numberIsInteger(start.seconds) ||
    !numberIsInteger(end.seconds) ||
    !numberIsInteger(standardOffset) ||
    !numberIsInteger(daylightOffset)
  )
    return false

  const firstYear = YearFromTime(firstFuture)
  const lastYear = YearFromTime(lastMilliseconds)
  const visitFuture = (milliseconds: number): void => {
    if (milliseconds >= firstFuture && milliseconds <= lastMilliseconds)
      visit(milliseconds)
  }
  // Match the lookup's neighboring rule years. A UTC year change also
  // changes which rule years the lookup considers.
  for (let year = firstYear - 1; year <= lastYear + 1; year++) {
    visitFuture(DayFromYear(year) * 86_400_000)
    visitFuture((TimeZoneRuleTransition(year, start) - standardOffset) * 1000)
    visitFuture((TimeZoneRuleTransition(year, end) - daylightOffset) * 1000)
  }
  return true
}

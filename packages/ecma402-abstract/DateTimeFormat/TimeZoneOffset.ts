import {
  bigIntFrom,
  floor,
  mathMax,
  mathMin,
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

// Proposal comparison §11.1.14 step 5: Find the first reachable local time.
export function NearestTimeZoneLocalAfter(
  local: bigint,
  data: UnpackedTimeZoneData
): bigint | undefined {
  const millisecond = bigIntFrom(1_000_000)
  const second = bigIntFrom(1_000_000_000)
  const day = 86_400_000
  const milliseconds = numberFrom(
    (local - (((local % millisecond) + millisecond) % millisecond)) /
      millisecond
  )
  const first = milliseconds - day
  const valid = (offset: number): boolean =>
    numberIsInteger(offset) && offset > -86_400 && offset < 86_400
  let validOffsets = valid(TimeZoneOffset(first, data)[0])
  let nearest: bigint | undefined
  // Offsets are under one day. Any closer wall time must occur in this window.
  const covered = VisitTimeZoneBoundaries(
    first,
    milliseconds + 3 * day,
    data,
    boundary => {
      const offset = TimeZoneOffset(boundary, data)[0]
      if (!valid(offset)) {
        validOffsets = false
        return
      }
      const projected =
        bigIntFrom(boundary) * millisecond + bigIntFrom(offset) * second
      if (projected > local && (nearest === undefined || projected < nearest))
        nearest = projected
    }
  )
  return covered && validOffsets ? nearest : undefined
}

const instantLimitMilliseconds = 8_640_000_000_000_000
const gregorianCycleMilliseconds = 146_097 * 86_400_000
const nearbyMilliseconds = 366 * 86_400_000

// Proposal comparison §6.3.46 steps 9.a and 10.b, §§11.1.3–4.
// Search actual offset changes in the packed rows and their TZif footer.
export function TimeZoneTransition(
  instant: bigint,
  direction: 'next' | 'previous',
  data: UnpackedTimeZoneData
): bigint | null | undefined {
  const next = direction === 'next'
  const millisecond = bigIntFrom(1_000_000)
  let milliseconds = instant / millisecond
  if (instant < 0 && instant % millisecond) milliseconds--
  const origin = numberFrom(milliseconds)
  const lower = -instantLimitMilliseconds - 1
  const upper = instantLimitMilliseconds
  const cutoff = data[data.length - 1][0] * 1000

  const changesOffset = (boundary: number): boolean =>
    TimeZoneOffset(boundary, data)[0] !== TimeZoneOffset(boundary - 1, data)[0]

  const scanExplicit = (): bigint | null => {
    const index = transitionIndex(origin / 1000, data)
    const first = index + numberFrom(next)
    const step = next ? 1 : -1
    for (let row = first; row > 0 && row < data.length; row += step) {
      const boundary = data[row][0] * 1000
      if (boundary <= lower || boundary > upper) return null
      const candidate = bigIntFrom(boundary) * millisecond
      if ((next || candidate < instant) && changesOffset(boundary))
        return candidate
    }
    return null
  }

  const scanFooter = (
    first: number,
    last: number
  ): bigint | null | undefined => {
    if (first >= last) return null
    let best: bigint | null = null
    const covered = VisitTimeZoneBoundaries(first, last, data, boundary => {
      if (boundary <= lower || boundary > upper) return
      const candidate = bigIntFrom(boundary) * millisecond
      if (next ? candidate <= instant : candidate >= instant) return
      if (best !== null && (next ? candidate >= best : candidate <= best))
        return
      if (changesOffset(boundary)) best = candidate
    })
    return covered ? best : undefined
  }

  if (next) {
    const explicit = scanExplicit()
    if (explicit !== null) return explicit
  }
  if (data.future) {
    // The footer's offset pattern repeats every 400 Gregorian years. Search
    // the nearest year first and include the explicit/footer seam if reachable.
    const anchor = next ? mathMax(origin, cutoff) : origin
    const first = next
      ? anchor
      : mathMax(lower, cutoff, anchor - gregorianCycleMilliseconds - 1)
    const last = next
      ? mathMin(upper, anchor + gregorianCycleMilliseconds + 1)
      : anchor
    const split = next
      ? mathMin(last, anchor + nearbyMilliseconds)
      : mathMax(first, anchor - nearbyMilliseconds)
    const nearby = next ? scanFooter(first, split) : scanFooter(split, last)
    if (nearby !== null) return nearby
    const remaining = next ? scanFooter(split, last) : scanFooter(first, split)
    if (remaining !== null) return remaining
  }
  return next ? null : scanExplicit()
}

import {
  HourFromTime,
  MinFromTime,
  SecFromTime,
  WeekDay,
  msFromTime,
} from '#packages/ecma262-abstract/DateOperations.js'
import {type UnpackedTimeZoneData} from '#packages/ecma402-abstract/types/date-time.js'
import {TimeZoneOffset} from '#packages/ecma402-abstract/DateTimeFormat/TimeZoneOffset.js'
import {
  CalendarDateFromTime,
  type CalendarRegistry,
} from '#packages/ecma402-abstract/DateTimeFormat/CalendarDateFromTime.js'
import Decimal from '@formatjs/bigdecimal'

const NANOSECONDS_PER_MILLISECOND = BigInt(1000000)
const ZERO = BigInt(0)
const ONE = BigInt(1)

// Internal prefix dispatch; DateTimeFormat validates timezone grammar first.
function IsTimeZoneOffsetString(offsetString: string): boolean {
  return offsetString[0] === '+' || offsetString[0] === '-'
}

// Internal scanner for validated offsets, returning milliseconds.
// Arithmetic follows Temporal §14.6.11 ParseDateTimeUTCOffset, steps 5–18.
// https://tc39.es/proposal-temporal/#sec-parsedatetimeutcoffset
function ParseTimeZoneOffsetString(offsetString: string): number {
  const sign = offsetString[0] === '+' ? 1 : -1
  let position = 1
  const components: number[] = []
  for (let index = 0; index < 3; index++) {
    if (
      index &&
      (position === offsetString.length || offsetString[position] === '.')
    )
      break
    if (index && offsetString[position] === ':') position++
    const first = offsetString.charCodeAt(position) - 48
    const second = offsetString.charCodeAt(position + 1) - 48
    if (!(first >= 0 && first <= 9 && second >= 0 && second <= 9)) return 0
    components.push(first * 10 + second)
    position += 2
  }
  let fractional = 0
  if (offsetString[position] === '.') {
    const fractionStart = ++position
    while (position < offsetString.length) {
      const digit = offsetString.charCodeAt(position) - 48
      if (digit < 0 || digit > 9) return 0
      position++
    }
    const length = position - fractionStart
    if (length < 1 || length > 9) return 0
    fractional =
      Number((offsetString.slice(fractionStart) + '000000000').slice(0, 9)) /
      1000000
  }
  if (position !== offsetString.length) return 0
  const [hours, minutes = 0, seconds = 0] = components
  return (
    sign * (hours * 3600000 + minutes * 60000 + seconds * 1000 + fractional)
  )
}

/**
 * GetNamedTimeZoneOffsetNanoseconds ( timeZone, t )
 * Similar to abstract operation in ECMA-262, adapted for IANA timezone data.
 * Extended to support UTC offset time zones per ECMA-402 PR #788.
 *
 * Returns the timezone offset in milliseconds (not nanoseconds for this impl)
 * and DST flag for the given timezone at time t.
 *
 * @param t - Time value in milliseconds since epoch
 * @param timeZone - The timezone identifier
 * @param tzData - IANA timezone database
 * @returns Tuple of [offset in milliseconds, inDST boolean]
 */
function getApplicableZoneData(
  t: number,
  timeZone: string,
  tzData: Record<string, UnpackedTimeZoneData>
): [number, boolean] {
  // 1. If IsTimeZoneOffsetString(timeZone) is true, then
  //    a. Let offsetNs be ParseTimeZoneOffsetString(timeZone)
  //    b. Return offsetNs (no DST for offset timezones)
  if (IsTimeZoneOffsetString(timeZone)) {
    const offsetMs = ParseTimeZoneOffsetString(timeZone)
    return [offsetMs, false] // UTC offset timezones never observe DST
  }

  // 2. Let timeZoneData be the IANA Time Zone Database entry for timeZone
  const zoneData = tzData[timeZone]

  // 3. If no data available, treat as UTC (0 offset, no DST)
  if (!zoneData) {
    return [0, false]
  }

  // 4. Find the applicable transition for time t
  const [offset, dst] = TimeZoneOffset(t, zoneData)

  // 5. Return offset in milliseconds and DST flag
  return [offset * 1e3, dst]
}

export interface ToLocalTimeImplDetails {
  calendarData?: CalendarRegistry
  tzData: Record<string, UnpackedTimeZoneData>
}

// Temporal §15.6.23, steps 1–3: add the offset before computing calendar fields.
// Millisecond arithmetic below is an internal representation of epoch nanoseconds.
// https://tc39.es/proposal-temporal/#sec-tolocaltime
export function ToLocalTime(
  epochNanoseconds: bigint,
  calendar: string,
  timeZone: string,
  {tzData, calendarData}: ToLocalTimeImplDetails
): {
  weekday: number
  era: string
  year: number
  relatedYear?: number
  yearName?: number
  month: number
  monthNameIndex?: number
  monthNumber?: number
  leapMonth?: boolean
  day: number
  hour: number
  minute: number
  second: number
  millisecond: number
  inDST: boolean
  timeZoneOffset: number
} {
  // BigInt division truncates; negative submilliseconds must floor.
  let epochMilliseconds = epochNanoseconds / NANOSECONDS_PER_MILLISECOND
  if (
    epochNanoseconds < ZERO &&
    epochNanoseconds % NANOSECONDS_PER_MILLISECOND !== ZERO
  ) {
    epochMilliseconds -= ONE
  }
  const milliseconds = Number(epochMilliseconds)
  const [timeZoneOffset, inDST] = getApplicableZoneData(
    milliseconds,
    timeZone,
    tzData
  )

  // Integer offsets commute with flooring; fractional offsets must be added first.
  const localMilliseconds = milliseconds + timeZoneOffset
  const tz =
    Number.isSafeInteger(milliseconds) &&
    Number.isSafeInteger(timeZoneOffset) &&
    Number.isSafeInteger(localMilliseconds)
      ? localMilliseconds
      : new Decimal(String(epochNanoseconds))
          .div(1000000)
          .plus(timeZoneOffset)
          .floor()
          .toNumber()
  return {
    ...CalendarDateFromTime(tz, calendar, calendarData),
    weekday: WeekDay(tz),
    hour: HourFromTime(tz),
    minute: MinFromTime(tz),
    second: SecFromTime(tz),
    millisecond: msFromTime(tz),
    inDST,
    // IMPORTANT: Not in spec
    timeZoneOffset,
  }
}

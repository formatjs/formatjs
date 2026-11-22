import {UTCOffsetNanoseconds} from '#packages/ecma262-abstract/UTCOffsetNanoseconds.js'
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
  // ECMA-402 §11.5.11 step 1: recognize and parse the complete UTCOffset.
  const offsetNs = UTCOffsetNanoseconds(timeZone)
  if (offsetNs !== undefined) return [offsetNs / 1_000_000, false]

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

// ECMA-402 §11.5.11 steps 1–3: add the offset before computing calendar fields.
// Table 17 in §11.5.12 projects integer milliseconds from epoch nanoseconds.
// https://tc39.es/ecma402/#sec-tolocaltime
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

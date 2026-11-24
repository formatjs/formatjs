import {UTCOffsetNanoseconds} from '#packages/ecma262-abstract/UTCOffsetNanoseconds.js'
import {HasOwnProperty} from '#packages/ecma262-abstract/HasOwnProperty.js'
import {
  bigIntFrom,
  numberFrom,
  numberIsSafeInteger,
} from '#packages/ecma262-abstract/intrinsics.js'
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

const NANOSECONDS_PER_MILLISECOND = bigIntFrom(1_000_000)
const bigintZero = bigIntFrom(0)
const bigintOne = bigIntFrom(1)

function floorToMilliseconds(nanoseconds: bigint): bigint {
  const milliseconds = nanoseconds / NANOSECONDS_PER_MILLISECOND
  return nanoseconds < bigintZero &&
    nanoseconds % NANOSECONDS_PER_MILLISECOND !== bigintZero
    ? milliseconds - bigintOne
    : milliseconds
}

// ECMA-402 §11.5.11 steps 1–2 resolve a fixed or named offset.
// https://tc39.es/ecma402/#sec-tolocaltime
// Keep the exact nanosecond offset and the DST flag for formatting.
function getApplicableZoneData(
  t: number,
  timeZone: string,
  tzData: Record<string, UnpackedTimeZoneData>
): [number, boolean] {
  const offsetNs = UTCOffsetNanoseconds(timeZone)
  if (offsetNs !== undefined) return [offsetNs, false]

  // ECMA-262 §21.4.1.21 supplies the named offset. UTC needs no packed row.
  // https://tc39.es/ecma262/#sec-getnamedtimezoneoffsetnanoseconds
  const zoneData = HasOwnProperty(tzData, timeZone)
    ? tzData[timeZone]
    : undefined
  if (!zoneData) return [0, false]
  const zone = TimeZoneOffset(t, zoneData)
  return [zone[0] * 1_000_000_000, zone[1]]
}

export interface ToLocalTimeImplDetails {
  calendarData?: CalendarRegistry
  tzData: Record<string, UnpackedTimeZoneData>
}

// ECMA-402 §11.5.11 steps 1–3: add the offset before computing calendar fields.
// Table 17 in §11.5.12 projects integer milliseconds from epoch nanoseconds.
// https://tc39.es/ecma402/#sec-datetimeformat-tolocaltime-records
// https://tc39.es/ecma402/#sec-tolocaltime
// Temporal amendment §15.6.23: project exact epoch nanoseconds into calendar fields.
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
  const milliseconds = numberFrom(floorToMilliseconds(epochNanoseconds))
  const zone = getApplicableZoneData(milliseconds, timeZone, tzData)
  const offsetNanoseconds = zone[0]
  const timeZoneOffset = offsetNanoseconds / 1_000_000
  const inDST = zone[1]

  // Integer offsets commute with flooring; fractional offsets must be added first.
  const localMilliseconds = milliseconds + timeZoneOffset
  const tz =
    numberIsSafeInteger(milliseconds) &&
    numberIsSafeInteger(timeZoneOffset) &&
    numberIsSafeInteger(localMilliseconds)
      ? localMilliseconds
      : numberFrom(
          floorToMilliseconds(epochNanoseconds + bigIntFrom(offsetNanoseconds))
        )
  // Table 17 has optional fields. Missing fields on the Record stay absent.
  const localTime = {
    __proto__: null,
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
  return localTime
}

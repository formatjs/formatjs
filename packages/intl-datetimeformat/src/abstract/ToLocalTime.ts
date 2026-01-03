import {
  DateFromTime,
  HourFromTime,
  MinFromTime,
  MonthFromTime,
  SecFromTime,
  type UnpackedZoneData,
  WeekDay,
  YearFromTime,
  invariant,
  msFromTime,
} from '@formatjs/ecma402-abstract'
import type Decimal from 'decimal.js'

// Cached regex patterns for performance
const OFFSET_TIMEZONE_PREFIX_REGEX = /^[+-]/
const OFFSET_TIMEZONE_FORMAT_REGEX =
  /^([+-])(\d{2})(?::?(\d{2}))?(?::?(\d{2}))?(?:\.(\d{1,9}))?$/

/**
 * IsTimeZoneOffsetString ( offsetString )
 * https://tc39.es/ecma262/#sec-istimezoneoffsetstring
 *
 * Determines if a string is a UTC offset identifier.
 *
 * @param offsetString - The string to check
 * @returns true if offsetString is a UTC offset format
 */
function IsTimeZoneOffsetString(offsetString: string): boolean {
  return OFFSET_TIMEZONE_PREFIX_REGEX.test(offsetString)
}

/**
 * ParseTimeZoneOffsetString ( offsetString )
 * https://tc39.es/ecma262/#sec-parsetimezoneoffsetstring
 *
 * Parses a UTC offset string and returns the offset in milliseconds.
 * This is used to calculate the timezone offset for ToLocalTime.
 *
 * Supports formats: ±HH, ±HHMM, ±HH:MM, ±HH:MM:SS, ±HH:MM:SS.sss
 *
 * @param offsetString - The UTC offset string to parse (e.g., "+01:00")
 * @returns The offset in milliseconds
 */
function ParseTimeZoneOffsetString(offsetString: string): number {
  // 1. Let parseResult be ParseText(offsetString, UTCOffset)
  const match = OFFSET_TIMEZONE_FORMAT_REGEX.exec(offsetString)

  // 2. Assert: parseResult is not a List of errors
  if (!match) {
    return 0
  }

  // 3. Extract components from parseResult
  const sign = match[1] === '+' ? 1 : -1
  const hours = parseInt(match[2], 10)
  const minutes = match[3] ? parseInt(match[3], 10) : 0
  const seconds = match[4] ? parseInt(match[4], 10) : 0
  const fractionalStr = match[5] || '0'

  // 4. Convert fractional seconds (nanoseconds) to milliseconds
  // Pad to 9 digits and divide by 1000000
  // Use manual padding for compatibility (padEnd is ES2017)
  const paddedFractional = (fractionalStr + '000000000').slice(0, 9)
  const fractional = parseInt(paddedFractional, 10) / 1000000

  // 5. Calculate total offset in milliseconds
  // offset = sign × (hours × 3600000 + minutes × 60000 + seconds × 1000 + fractional)
  const offsetMs =
    sign * (hours * 3600000 + minutes * 60000 + seconds * 1000 + fractional)

  // 6. Return offset in milliseconds
  return offsetMs
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
  tzData: Record<string, UnpackedZoneData[]>
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
  let i = 0
  let offset = 0
  let dst = false
  for (; i <= zoneData.length; i++) {
    if (i === zoneData.length || zoneData[i][0] * 1e3 > t) {
      ;[, , offset, dst] = zoneData[i - 1]
      break
    }
  }

  // 5. Return offset in milliseconds and DST flag
  return [offset * 1e3, dst]
}

export interface ToLocalTimeImplDetails {
  tzData: Record<string, UnpackedZoneData[]>
}

/**
 * https://tc39.es/ecma402/#sec-tolocaltime
 * @param t
 * @param calendar
 * @param timeZone
 */
export function ToLocalTime(
  t: Decimal,
  calendar: string,
  timeZone: string,
  {tzData}: ToLocalTimeImplDetails
): {
  weekday: number
  era: string
  year: number
  relatedYear: undefined
  yearName: undefined
  month: number
  day: number
  hour: number
  minute: number
  second: number
  millisecond: number
  inDST: boolean
  timeZoneOffset: number
} {
  invariant(
    calendar === 'gregory',
    'We only support Gregory calendar right now'
  )
  const [timeZoneOffset, inDST] = getApplicableZoneData(
    t.toNumber(),
    timeZone,
    tzData
  )

  const tz = t.plus(timeZoneOffset).toNumber()
  const year = YearFromTime(tz)
  return {
    weekday: WeekDay(tz),
    era: year < 0 ? 'BC' : 'AD',
    year,
    relatedYear: undefined,
    yearName: undefined,
    month: MonthFromTime(tz),
    day: DateFromTime(tz),
    hour: HourFromTime(tz),
    minute: MinFromTime(tz),
    second: SecFromTime(tz),
    millisecond: msFromTime(tz),
    inDST,
    // IMPORTANT: Not in spec
    timeZoneOffset,
  }
}

import {
  UnpackedZoneData,
  Type,
  YearFromTime,
  WeekDay,
  MonthFromTime,
  DateFromTime,
  HourFromTime,
  MinFromTime,
  SecFromTime,
  msFromTime,
  invariant,
} from '@formatjs/ecma402-abstract'

function getApplicableZoneData(
  t: number,
  timeZone: string,
  tzData: Record<string, UnpackedZoneData[]>
): [number, boolean] {
  const zoneData = tzData[timeZone]
  // We don't have data for this so just say it's UTC
  if (!zoneData) {
    return [0, false]
  }
  let i = 0
  let offset = 0
  let dst = false
  for (; i <= zoneData.length; i++) {
    if (i === zoneData.length || zoneData[i][0] * 1e3 > t) {
      ;[, , offset, dst] = zoneData[i - 1]
      break
    }
  }
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
  t: number,
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
  invariant(Type(t) === 'Number', 'invalid time')
  invariant(
    calendar === 'gregory',
    'We only support Gregory calendar right now'
  )
  const [timeZoneOffset, inDST] = getApplicableZoneData(t, timeZone, tzData)

  const tz = t + timeZoneOffset
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

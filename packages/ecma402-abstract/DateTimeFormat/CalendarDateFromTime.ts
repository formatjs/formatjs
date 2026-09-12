import {
  DateFromTime,
  MonthFromTime,
  YearFromTime,
} from '#packages/ecma262-abstract/DateOperations.js'

export interface CalendarFields {
  era: string
  year: number
  month: number
  day: number
  monthNameIndex?: number
  monthNumber?: number
  leapMonth?: boolean
  relatedYear?: number
  yearName?: number
}

export interface CalendarData {
  calendar: string
  dateFromTime(t: number): CalendarFields
}

export type CalendarRegistry = Record<string, CalendarData['dateFromTime']>

/**
 * FormatJS helper, not a named ECMA-402 abstract operation. Converts an already
 * timezone-adjusted millisecond value into calendar fields for ToLocalTime.
 * ECMA-402 leaves non-Gregorian calculations to the best available calendar data:
 * https://tc39.es/ecma402/#sec-tolocaltime
 *
 * Optional calendar modules supply arithmetic and ICU4X tables. Keeping them
 * outside this module lets Gregorian-only applications omit those payloads.
 */
export function CalendarDateFromTime(
  t: number,
  calendar: string,
  calendarData: CalendarRegistry = {}
): CalendarFields {
  if (calendar === 'gregory' || calendar === 'iso8601') {
    const year = YearFromTime(t)
    return {
      era: year > 0 ? 'AD' : 'BC',
      year: year > 0 ? year : 1 - year,
      month: MonthFromTime(t),
      day: DateFromTime(t),
    }
  }
  if (!Object.prototype.hasOwnProperty.call(calendarData, calendar)) {
    throw new RangeError(`Calendar data not loaded: ${calendar}`)
  }
  return calendarData[calendar](t)
}

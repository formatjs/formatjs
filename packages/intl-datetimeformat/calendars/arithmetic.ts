import {
  ArithmeticCalendarFromEpochDay,
  ArithmeticCalendarMonthsInYear,
  ArithmeticCalendarEra,
  type ArithmeticCalendarId,
} from '#packages/ecma402-abstract/Calendar/Arithmetic.js'
import type {CalendarData} from '#packages/ecma402-abstract/DateTimeFormat/CalendarDateFromTime.js'

// Temporal era identifiers mapped to CLDR calendar era keys.
const eras: Record<string, string> = {
  be: '0',
  am: '1',
  aa: '0',
  roc: '1',
  broc: '0',
  ce: 'AD',
  bce: 'BC',
  meiji: '232',
  taisho: '233',
  showa: '234',
  heisei: '235',
  reiwa: '236',
  shaka: '0',
  ah: '0',
  bh: '1',
  ap: '0',
}

/**
 * Adapt shared calendar fields to CLDR era keys and month-name indices.
 * This is an implementation helper for ECMA-402 ToLocalTime, not a spec AO.
 * https://tc39.es/ecma402/#sec-tolocaltime
 * https://unicode.org/reports/tr35/tr35-dates.html#Calendar_Elements
 */
export function arithmeticCalendar(
  calendar: ArithmeticCalendarId,
  hebrew = false
): CalendarData {
  return {
    calendar,
    dateFromTime(t) {
      const epochDay = Math.floor(t / 86400000)
      const date = ArithmeticCalendarFromEpochDay(calendar, epochDay)
      if (hebrew) {
        // CLDR reserves month 6 for Adar I and a separate name for leap-year Adar II.
        const monthCode = Number(date.monthCode.slice(1, 3))
        const monthNameIndex =
          date.monthCode === 'M05L'
            ? 5
            : monthCode === 6 &&
                ArithmeticCalendarMonthsInYear(calendar, date.year) === 13
              ? 13
              : monthCode >= 6
                ? monthCode
                : monthCode - 1
        return {
          era: '0',
          year: date.year,
          month: date.month - 1,
          monthNameIndex,
          day: date.day,
        }
      }
      const era = ArithmeticCalendarEra(calendar, epochDay, date.year)
      return {
        era: eras[era!.era],
        year: era?.eraYear ?? date.year,
        month: date.month - 1,
        day: date.day,
      }
    },
  }
}

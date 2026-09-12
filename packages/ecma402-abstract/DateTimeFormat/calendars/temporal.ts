import {
  DateFromTime,
  MonthFromTime,
  YearFromTime,
} from '#packages/ecma262-abstract/DateOperations.js'
import {create, inLeapYear} from 'temporal-polyfill/fns/PlainDate'
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
 * Adapt Temporal calendar fields to CLDR era keys and month-name indices.
 * This is an implementation helper for ECMA-402 ToLocalTime, not a spec AO.
 * https://tc39.es/ecma402/#sec-tolocaltime
 * https://unicode.org/reports/tr35/tr35-dates.html#Calendar_Elements
 */
export function temporalCalendar(
  calendar: string,
  getCalendar: () => NonNullable<Parameters<typeof create>[3]>,
  hebrew = false
): CalendarData {
  return {
    calendar,
    dateFromTime(t) {
      const date = create(
        YearFromTime(t),
        MonthFromTime(t) + 1,
        DateFromTime(t),
        getCalendar()
      )
      if (hebrew) {
        // CLDR reserves month 6 for Adar I and a separate name for leap-year Adar II.
        const monthCode = Number(date.monthCode.slice(1, 3))
        const monthNameIndex =
          date.monthCode === 'M05L'
            ? 5
            : monthCode === 6 && inLeapYear(date)
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
      return {
        era: eras[date.era!],
        year: date.eraYear ?? date.year,
        month: date.month - 1,
        day: date.day,
      }
    },
  }
}

import {
  DateFromTime,
  MonthFromTime,
  YearFromTime,
} from '#packages/ecma262-abstract/DateOperations.js'
import {
  getBuddhist,
  getCoptic,
  getEthiopic,
  getEthiopicAmeteAlem,
  getROC,
  getJapanese,
  getIndian,
  getIslamicCivil,
  getIslamicTabular,
  getPersian,
  getHebrew,
} from 'temporal-polyfill/fns/Calendar'
import {create, inLeapYear} from 'temporal-polyfill/fns/PlainDate'
import {ummAlQura} from '@formatjs_generated/icu.calendar/umm-al-qura.js'
import {chinese} from '@formatjs_generated/icu.calendar/chinese.js'
import {dangi} from '@formatjs_generated/icu.calendar/dangi.js'
import {LunisolarDateFromTime} from '#packages/ecma402-abstract/DateTimeFormat/LunisolarDateFromTime.js'

const calendars = {
  buddhist: getBuddhist,
  coptic: getCoptic,
  ethiopic: getEthiopic,
  ethioaa: getEthiopicAmeteAlem,
  roc: getROC,
  japanese: getJapanese,
  indian: getIndian,
  'islamic-civil': getIslamicCivil,
  'islamic-tbla': getIslamicTabular,
  'islamic-umalqura': getIslamicCivil,
  persian: getPersian,
  hebrew: getHebrew,
}

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

/** Calendar fields for an already timezone-adjusted millisecond value. */
export function CalendarDateFromTime(
  t: number,
  calendar: string
): {
  era: string
  year: number
  month: number
  day: number
  monthNameIndex?: number
  monthNumber?: number
  leapMonth?: boolean
  relatedYear?: number
  yearName?: number
} {
  if (calendar === 'chinese' || calendar === 'dangi') {
    return LunisolarDateFromTime(t, calendar === 'chinese' ? chinese : dangi)
  }
  const year = YearFromTime(t)
  const month = MonthFromTime(t)
  const day = DateFromTime(t)
  if (calendar === 'islamic-umalqura') {
    const epochDay = Math.floor(t / 86400000)
    const {startDays, firstYear, monthLengths} = ummAlQura
    if (
      epochDay >= startDays[0] &&
      epochDay < startDays[startDays.length - 1]
    ) {
      let low = 0
      let high = startDays.length - 1
      while (low + 1 < high) {
        const middle = Math.floor((low + high) / 2)
        if (startDays[middle] <= epochDay) low = middle
        else high = middle
      }
      let dayOfYear = epochDay - startDays[low]
      let month = 0
      const packed = monthLengths[low]
      while (dayOfYear >= 29 + ((packed >>> month) & 1)) {
        dayOfYear -= 29 + ((packed >>> month) & 1)
        month++
      }
      return {era: '0', year: firstYear + low, month, day: dayOfYear + 1}
    }
    // ICU4X uses the civil calendar outside its official Umm al-Qura table.
  }
  if (calendar === 'gregory' || calendar === 'iso8601') {
    return {
      era: year > 0 ? 'AD' : 'BC',
      year: year > 0 ? year : 1 - year,
      month,
      day,
    }
  }
  const getCalendar = Object.prototype.hasOwnProperty.call(calendars, calendar)
    ? calendars[calendar as keyof typeof calendars]
    : undefined
  if (!getCalendar) throw new RangeError(`Unsupported calendar: ${calendar}`)
  const date = create(year, month + 1, day, getCalendar())
  if (calendar === 'hebrew') {
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
}

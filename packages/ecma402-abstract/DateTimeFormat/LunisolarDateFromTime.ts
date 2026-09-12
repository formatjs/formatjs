interface CalendarData {
  firstYear: number
  endDay: number
  checkpoints: number[]
  dictionary: number[]
  years: string
}

const alphabet =
  'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_'

// Each year stores two base-64 digits selecting a shared month-pattern entry.
function yearPattern(data: CalendarData, index: number): number {
  const offset = index * 2
  const key =
    alphabet.indexOf(data.years[offset]) * 64 +
    alphabet.indexOf(data.years[offset + 1])
  return data.dictionary[key]
}

// Low 13 bits mark 30-day months (otherwise 29); upper bits identify the
// repeated month, or zero for a 12-month year. This packing is FormatJS-specific.
function yearLength(packed: number): number {
  let months = packed & 8191
  let days = (packed >>> 13 ? 13 : 12) * 29
  while (months) {
    days++
    months &= months - 1
  }
  return days
}

/**
 * FormatJS table decoder, not a named ECMA-402 abstract operation. Supplies
 * Chinese/Dangi calendar fields for the calendar-specific branch of ToLocalTime:
 * https://tc39.es/ecma402/#sec-tolocaltime
 *
 * Tables come from pinned ICU4X calculations in
 * packages/intl-datetimeformat/scripts/calendar-data/lunisolar.rs.
 * Checkpoints, dictionary packing, and lookup are our storage format.
 * Leap-month patterns and cyclic year names follow LDML:
 * https://unicode.org/reports/tr35/tr35-dates.html#monthPatterns_cyclicNameSets
 */
export function LunisolarDateFromTime(
  t: number,
  data: CalendarData
): {
  era: string
  year: number
  relatedYear: number
  yearName: number
  month: number
  monthNumber: number
  monthNameIndex: number
  leapMonth: boolean
  day: number
} {
  const epochDay = Math.floor(t / 86400000)
  const {checkpoints} = data
  if (epochDay < checkpoints[0] || epochDay >= data.endDay) {
    throw new RangeError('Date outside calendar data range')
  }
  let low = 0
  let high = checkpoints.length
  while (low + 1 < high) {
    const middle = Math.floor((low + high) / 2)
    if (checkpoints[middle] <= epochDay) low = middle
    else high = middle
  }
  // Checkpoints bound the scan to at most 64 years.
  let index = low * 64
  let day = epochDay - checkpoints[low]
  let packed = yearPattern(data, index)
  while (day >= yearLength(packed)) {
    day -= yearLength(packed)
    packed = yearPattern(data, ++index)
  }
  let month = 0
  while (day >= 29 + ((packed >>> month) & 1)) {
    day -= 29 + ((packed >>> month) & 1)
    month++
  }
  const leap = packed >>> 13
  const monthNumber = month - (leap && month >= leap ? 1 : 0)
  const year = data.firstYear + index
  return {
    era: '',
    year,
    relatedYear: year,
    // CLDR cyclic names start with jia-zi; Gregorian year 4 anchors that cycle.
    yearName: (((year - 4) % 60) + 60) % 60,
    month,
    monthNumber,
    monthNameIndex: monthNumber,
    leapMonth: leap !== 0 && month === leap,
    day: day + 1,
  }
}

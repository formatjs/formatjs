import {
  RangeErrorConstructor,
  bigIntFrom,
  numberFrom,
  numberIsSafeInteger,
  setDataProperty,
} from '#packages/ecma262-abstract/intrinsics.js'
// Adapted from ICU4X 2.3.0, east_asian_traditional/simple.rs.
// Unicode-3.0; see LICENSE.md.
import {DayFromYear} from '#packages/ecma262-abstract/DateOperations.js'
import type {CalendarYearData} from '#packages/temporal/host-calendar-data.js'

const day = 86400000n
const month = (day * 295305888531n) / 10000000000n
const year = (day * 146097n) / 400n
const term = year / 12n
const moonEpoch = 730125n * day + 65640000n
// Euclidean floor for positive divisors; shared lunisolar arithmetic.
// Proposal comparison §12.3.25 / §13.42 step2: provider arithmetic dependency.
function floor(value: bigint, divisor: bigint): bigint {
  return value / divisor - (value < 0n && value % divisor !== 0n ? 1n : 0n)
}
// Last period boundary before the end of this integral epoch day.
// Proposal comparison §12.3.25 / §13.42 step2: provider period dependency.
function onOrBefore(date: bigint, base: bigint, period: bigint): bigint {
  return base + floor(date * day - base + day - 1n, period) * period
}

// Proposal comparison §12.3.6: private month-coordinate dependency.
// Used by hostCalendarAddMonths and hostCalendarMonthDifference.
export function lunisolarMonthSerial(epoch: number): number {
  return numberFrom(floor(bigIntFrom(epoch + 719178) * day - moonEpoch, month))
}

// Proposal comparison §12.3.6: bounded inverse-estimate dependency.
// hostCalendarAddMonths locates the containing year.
export function lunisolarMonthEpoch(serial: number): number {
  if (!numberIsSafeInteger(serial))
    throw new RangeErrorConstructor('Invalid month count')
  const epoch = floor(moonEpoch + bigIntFrom(serial) * month, day) - 719163n
  if (epoch < -110000400n || epoch > 110000400n)
    throw new RangeErrorConstructor('Calendar month out of range')
  return numberFrom(epoch)
}

// Proposal comparison §12.3.25: chosen Chinese/Dangi fallback year partition.
// Provider data dependency of §13.42 step2, not the complete date conversion.
// https://tc39.es/proposal-temporal/#sec-temporal-nonisocalendarisotodate
export function approximateLunisolarYear(
  calendar: 'chinese' | 'dangi',
  relatedYear: number
): CalendarYearData {
  const offset =
    relatedYear < 1900
      ? 27940000n
      : calendar === 'chinese'
        ? 28800000n
        : 32400000n
  let solar = onOrBefore(
    bigIntFrom(DayFromYear(relatedYear) + 719162),
    730110n * day + 27840000n + offset,
    year
  )
  let moon = onOrBefore(
      floor(solar, day),
      730125n * day + 65640000n + offset,
      month
    ),
    nextMoon = moon + month,
    solarTerm = -2,
    hadLeap = false
  while (
    solarTerm < 0 ||
    (floor(nextMoon, day) <= floor(solar, day) && !hadLeap)
  ) {
    if (floor(nextMoon, day) <= floor(solar, day) && !hadLeap) hadLeap = true
    else {
      solarTerm++
      solar += term
    }
    moon = nextMoon
    nextMoon += month
  }
  const newYear = floor(moon, day),
    lengths: number[] = []
  let leap = 0
  while (
    solarTerm < 12 ||
    (floor(nextMoon, day) <= floor(solar, day) && !hadLeap)
  ) {
    const index = solarTerm + numberFrom(leap !== 0)
    if (index < 13)
      setDataProperty(
        lengths,
        index,
        numberFrom(floor(nextMoon, day) - floor(moon, day))
      )
    if (floor(nextMoon, day) <= floor(solar, day) && !hadLeap) {
      hadLeap = true
      leap = solarTerm
    } else {
      solarTerm++
      solar += term
    }
    moon = nextMoon
    nextMoon += month
  }
  const earliest = DayFromYear(relatedYear) + 18,
    starts = [
      earliest + numberFrom((newYear - bigIntFrom(earliest + 719163)) & 63n),
    ],
    count = leap ? 13 : 12
  let end = starts[0]
  for (let index = 0; index < count; index++) {
    if (index > 0) setDataProperty(starts, index, end)
    end += lengths[index]
  }
  return {starts, end, leap}
}

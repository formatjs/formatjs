const MS_PER_DAY = 86400000

function mod(x: number, y: number): number {
  return x - Math.floor(x / y) * y
}

export function Day(t: number): number {
  return Math.floor(t / MS_PER_DAY)
}

export function WeekDay(t: number): number {
  return mod(Day(t) + 4, 7)
}

export function DayFromYear(y: number): number {
  // ECMA-262 §21.4.1.5 DayFromYear, steps 2–6: count days arithmetically.
  // The first day of the minimum representable year lies outside Date's range.
  // https://tc39.es/ecma262/#sec-dayfromyear
  // https://github.com/tc39/ecma262/blob/b7865f0eed2021720f84d561289401bc414874d0/spec.html#L34143-L34147
  return (
    365 * (y - 1970) +
    Math.floor((y - 1969) / 4) -
    Math.floor((y - 1901) / 100) +
    Math.floor((y - 1601) / 400)
  )
}

export function YearFromTime(t: number): number {
  // ECMA-262 §21.4.1.7 YearFromTime, step 1: locate the enclosing year.
  // Local timezone adjustment may move an otherwise valid instant past Date's bounds.
  // https://tc39.es/ecma262/#sec-yearfromtime
  // https://github.com/tc39/ecma262/blob/b7865f0eed2021720f84d561289401bc414874d0/spec.html#L34177
  if (!Number.isFinite(t)) return NaN
  const day = Day(t)
  let year = 1970 + Math.floor(day / 365.2425)
  while (DayFromYear(year) > day) year--
  while (DayFromYear(year + 1) <= day) year++
  return year
}

export function DaysInYear(y: number): 365 | 366 {
  if (y % 4 !== 0) return 365
  if (y % 100 !== 0) return 366
  if (y % 400 !== 0) return 365
  return 366
}

export function DayWithinYear(t: number): number {
  return Day(t) - DayFromYear(YearFromTime(t))
}

export function InLeapYear(t: number): 0 | 1 {
  return DaysInYear(YearFromTime(t)) === 365 ? 0 : 1
}

export function MonthFromTime(
  t: number
): 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 {
  const dwy = DayWithinYear(t)
  const leap = InLeapYear(t)
  if (dwy >= 0 && dwy < 31) return 0
  if (dwy < 59 + leap) return 1
  if (dwy < 90 + leap) return 2
  if (dwy < 120 + leap) return 3
  if (dwy < 151 + leap) return 4
  if (dwy < 181 + leap) return 5
  if (dwy < 212 + leap) return 6
  if (dwy < 243 + leap) return 7
  if (dwy < 273 + leap) return 8
  if (dwy < 304 + leap) return 9
  if (dwy < 334 + leap) return 10
  if (dwy < 365 + leap) return 11
  throw new Error('Invalid time')
}

export function DateFromTime(t: number): number {
  const dwy = DayWithinYear(t)
  const mft = MonthFromTime(t)
  const leap = InLeapYear(t)
  if (mft === 0) return dwy + 1
  if (mft === 1) return dwy - 30
  if (mft === 2) return dwy - 58 - leap
  if (mft === 3) return dwy - 89 - leap
  if (mft === 4) return dwy - 119 - leap
  if (mft === 5) return dwy - 150 - leap
  if (mft === 6) return dwy - 180 - leap
  if (mft === 7) return dwy - 211 - leap
  if (mft === 8) return dwy - 242 - leap
  if (mft === 9) return dwy - 272 - leap
  if (mft === 10) return dwy - 303 - leap
  if (mft === 11) return dwy - 333 - leap
  throw new Error('Invalid time')
}

const HOURS_PER_DAY = 24
const MINUTES_PER_HOUR = 60
const SECONDS_PER_MINUTE = 60
const MS_PER_SECOND = 1e3
const MS_PER_MINUTE = MS_PER_SECOND * SECONDS_PER_MINUTE
const MS_PER_HOUR = MS_PER_MINUTE * MINUTES_PER_HOUR

export function HourFromTime(t: number): number {
  return mod(Math.floor(t / MS_PER_HOUR), HOURS_PER_DAY)
}

export function MinFromTime(t: number): number {
  return mod(Math.floor(t / MS_PER_MINUTE), MINUTES_PER_HOUR)
}

export function SecFromTime(t: number): number {
  return mod(Math.floor(t / MS_PER_SECOND), SECONDS_PER_MINUTE)
}

export function msFromTime(t: number): number {
  return mod(t, MS_PER_SECOND)
}

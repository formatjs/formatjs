import {
  addCalendarDate,
  calendarDateUntilRaw,
  calendarFromEpochDay,
  calendarToEpochDay,
  calendarStartOfYear,
  calendarEra,
  calendarYearFromEra,
  daysInMonth,
  monthsInYear,
  type CalendarId,
  type DateDuration,
} from '#packages/temporal/calendar.js'

export function checkArithmeticCalendarOracle(
  fixture: string,
  equal: (
    actual: string | number,
    expected: string | number,
    context: string
  ) => void
): {
  fields: number
  additions: number
  bounds: number
  differences: number
  calendars: number
} {
  let fields = 0,
    additions = 0,
    bounds = 0,
    differences = 0
  const calendars = new Set<string>()
  for (const line of fixture.trim().split('\n')) {
    if (line.startsWith('#')) continue
    const row = line.trim().split('\t'),
      calendar = row[1] as CalendarId,
      epoch = +row[2]
    if (row[0] === 'T') continue // Clock-relative totals use public Temporal controls.
    calendars.add(calendar)
    if (row[0] === 'D') {
      const difference = calendarDateUntilRaw(calendar, epoch, +row[3], row[4])
      const units = ['years', 'months', 'weeks', 'days'] as const
      for (let index = 0; index < units.length; index++)
        equal(difference[units[index]] ?? 0, +row[index + 5], line)
      differences++
      continue
    }
    if (row[0] === 'F') {
      const actual = calendarFromEpochDay(calendar, epoch)
      equal(actual.year, +row[3], line)
      equal(actual.month, +row[4], line)
      equal(actual.monthCode, row[5], line)
      equal(actual.day, +row[6], line)
      equal(calendarToEpochDay(calendar, actual, 'reject'), epoch, line)
      equal(
        calendarToEpochDay(
          calendar,
          {year: actual.year, monthCode: actual.monthCode, day: actual.day},
          'reject'
        ),
        epoch,
        line
      )
      equal(daysInMonth(calendar, actual.year, actual.month), +row[7], line)
      equal(monthsInYear(calendar, actual.year), +row[8], line)
      equal(
        calendarStartOfYear(calendar, actual.year + 1) -
          calendarStartOfYear(calendar, actual.year),
        +row[9],
        line
      )
      const era = calendarEra(calendar, epoch)
      equal(era?.era ?? '-', row[10], line)
      if (era) {
        equal(era.eraYear, +row[11], line)
        equal(
          calendarYearFromEra(calendar, era.era, era.eraYear),
          actual.year,
          line
        )
      }
      equal(
        epoch - calendarStartOfYear(calendar, actual.year) + 1,
        +row[12],
        line
      )
      equal(((((epoch + 3) % 7) + 7) % 7) + 1, +row[13], line)
      fields++
    } else {
      const unit = row[3],
        amount = +row[4],
        duration: DateDuration = {[unit + 's']: amount}
      const start = calendarFromEpochDay(calendar, epoch)
      if (row[0] === 'X') {
        let threw = false
        try {
          addCalendarDate(calendar, start, duration, 'constrain')
        } catch (error) {
          if (!(error instanceof RangeError)) throw error
          threw = true
        }
        equal(Number(threw), 1, line)
        bounds++
        continue
      }
      const actual = addCalendarDate(calendar, start, duration, 'constrain')
      equal(calendarToEpochDay(calendar, actual, 'reject'), +row[5], line)
      additions++
    }
  }
  return {fields, additions, bounds, differences, calendars: calendars.size}
}

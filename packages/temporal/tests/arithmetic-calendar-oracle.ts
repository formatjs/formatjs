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
): {fields: number; additions: number; bounds: number; calendars: number} {
  let fields = 0,
    additions = 0,
    bounds = 0
  const calendars = new Set<string>()
  for (const line of fixture.trim().split('\n')) {
    if (line.startsWith('#')) continue
    const row = line.trim().split('\t'),
      calendar = row[1] as CalendarId,
      epoch = +row[2]
    calendars.add(calendar)
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
      const difference = calendarDateUntilRaw(calendar, epoch, +row[5], unit)
      for (const name of ['years', 'months', 'weeks', 'days'] as const)
        equal(difference[name] ?? 0, name === unit + 's' ? amount : 0, line)
      additions++
    }
  }
  return {fields, additions, bounds, calendars: calendars.size}
}

import {
  addCalendarDate,
  addCalendarDateRaw,
  calendarFromEpochDayRaw,
  calendarToEpochDayRaw,
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

export function checkISODateUntilPrefixes(
  equal: (actual: number, expected: number, context: string) => void
): void {
  for (const [one, two, largest, years, months, days] of [
    [18321, 18686, 'year', 0, 11, 30],
    [18686, 18321, 'year', 0, -11, -28],
    [18658, 18716, 'month', 0, 1, 30],
    [18716, 18658, 'month', 0, -1, -28],
    [18321, 18687, 'year', 1, 0, 1],
    [18321, 18687, 'month', 0, 12, 1],
    [-110000000, 110000000, 'year', 602339, 6, 15],
    [110000000, -110000000, 'year', -602339, -6, -16],
    [-110000000, 110000000, 'month', 0, 7228074, 15],
    [110000000, -110000000, 'month', 0, -7228074, -16],
  ] as const) {
    const actual = calendarDateUntilRaw('iso8601', one, two, largest),
      context = `${one} to ${two}, largest ${largest}`
    equal(actual.years!, years, context)
    equal(actual.months!, months, context)
    equal(actual.weeks!, 0, context)
    equal(actual.days!, days, context)
    equal(
      calendarToEpochDayRaw(
        'iso8601',
        addCalendarDateRaw(
          'iso8601',
          calendarFromEpochDayRaw('iso8601', one),
          actual,
          'constrain'
        ),
        'reject'
      ),
      two,
      context
    )
  }
}

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
  checkISODateUntilPrefixes(equal)
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

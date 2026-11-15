import type {Temporal as TemporalNamespace} from '#packages/temporal/index.js'

export function checkPublicCalendarOracle(
  Temporal: typeof TemporalNamespace,
  fixture: string,
  equal: (actual: unknown, expected: unknown, context: string) => void
): {
  fields: number
  additions: number
  bounds: number
  bridges: number
  differences: number
  windows: number
} {
  const counts = {
    fields: 0,
    additions: 0,
    bounds: 0,
    bridges: 0,
    differences: 0,
    windows: 0,
  }
  const date = (epoch: number, calendar: string) =>
    new Temporal.PlainDate(1970, 1, 1).add({days: epoch}).withCalendar(calendar)
  for (const line of fixture.trim().split('\n')) {
    if (line.startsWith('#')) continue
    const row = line.split('\t'),
      calendar = row[1],
      epoch = +row[2]
    const value = date(epoch, calendar)
    if (row[0] === 'T') {
      const duration = Temporal.Duration.from({
        [row[3] + 's']: +row[4],
        hours: 10 * Math.sign(+row[4]),
      })
      equal(duration.total({unit: row[3], relativeTo: value}), +row[5], line)
      equal(
        duration.total({
          unit: row[3],
          relativeTo: value.toZonedDateTime('UTC'),
        }),
        +row[5],
        line
      )
      counts.windows++
      continue
    }
    if (row[0] === 'D') {
      const difference = value.until(date(+row[3], calendar), {
        largestUnit: row[4],
      })
      const units = ['years', 'months', 'weeks', 'days'] as const
      for (let index = 0; index < units.length; index++)
        equal(difference[units[index]], +row[index + 5], line)
      counts.differences++
      continue
    }
    if (row[0] === 'F') {
      const year = +row[3],
        month = +row[4],
        code = row[5],
        day = +row[6]
      equal(value.calendarId, calendar, line)
      equal(value.year, year, line)
      equal(value.month, month, line)
      equal(value.monthCode, code, line)
      equal(value.day, day, line)
      equal(value.daysInMonth, +row[7], line)
      equal(value.monthsInYear, +row[8], line)
      equal(value.daysInYear, +row[9], line)
      equal(value.era, row[10] === '-' ? undefined : row[10], line)
      equal(value.eraYear, row[11] === '-' ? undefined : +row[11], line)
      equal(value.dayOfYear, +row[12], line)
      equal(value.dayOfWeek, +row[13], line)
      const leap = ['hebrew', 'chinese', 'dangi'].includes(calendar)
        ? +row[8] === 13
        : +row[9] === (calendar.startsWith('islamic-') ? 355 : 366)
      equal(value.inLeapYear, leap, line)
      equal(
        Temporal.PlainDate.from(
          {calendar, year, monthCode: code, day},
          {overflow: 'reject'}
        ).toString(),
        value.toString(),
        line
      )
      const eraFields =
        row[10] === '-' ? {year} : {era: row[10], eraYear: +row[11]}
      equal(
        Temporal.PlainDate.from(
          {calendar, ...eraFields, month, day},
          {overflow: 'reject'}
        ).toString(),
        value.toString(),
        line
      )
      counts.fields++
      if (counts.fields % 17 === 0 && epoch > -99999900 && epoch < 99999900) {
        equal(value.with({year}).toString(), value.toString(), line)
        const short = value.toPlainYearMonth()
        equal(short.year, year, line)
        equal(short.monthCode, code, line)
        equal(short.toPlainDate({day}).toString(), value.toString(), line)
        equal(
          Temporal.PlainYearMonth.from({
            calendar,
            ...eraFields,
            monthCode: code,
          }).toString(),
          short.toString(),
          line
        )
        const monthDay = value.toPlainMonthDay()
        equal(monthDay.toPlainDate({year}).toString(), value.toString(), line)
        equal(
          monthDay.toPlainDate(eraFields).toString(),
          value.toString(),
          line
        )
        const plain = value.toPlainDateTime('12:34:56.123456789')
        equal(plain.year, year, line)
        equal(plain.era, value.era, line)
        equal(
          plain.with({...eraFields, day}).toString(),
          plain.toString(),
          line
        )
        const zoned = value.toZonedDateTime({
          timeZone: 'UTC',
          plainTime: '12:34:56.123456789',
        })
        equal(zoned.year, year, line)
        equal(zoned.era, value.era, line)
        equal(
          zoned.with({...eraFields, day}).toString(),
          zoned.toString(),
          line
        )
        equal(
          Temporal.Duration.from('P1M').total({
            unit: 'day',
            relativeTo: {calendar, ...eraFields, monthCode: code, day: 1},
          }),
          +row[7],
          line
        )
        counts.bridges++
      }
    } else {
      let result: ReturnType<typeof value.add> | undefined
      try {
        result = value.add({[row[3] + 's']: +row[4]}, {overflow: 'constrain'})
      } catch (error) {
        if (!(error instanceof RangeError) || row[0] !== 'X')
          throw new Error(`${line}: ${String(error)}`)
      }
      if (row[0] === 'X') {
        equal(result, undefined, line)
        counts.bounds++
        continue
      }
      equal(result!.toString(), date(+row[5], calendar).toString(), line)
      counts.additions++
    }
  }
  return counts
}

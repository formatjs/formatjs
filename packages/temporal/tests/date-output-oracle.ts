import type {Temporal as TemporalNamespace} from '#packages/temporal/index.js'

export function checkDateOutputOracle(
  Temporal: typeof TemporalNamespace,
  fixture: string,
  equal: (actual: unknown, expected: unknown, context: string) => void
): number {
  let count = 0
  const rejects = (run: () => unknown, context: string) => {
    let rejected = false
    try {
      run()
    } catch (error) {
      rejected = error instanceof RangeError
    }
    equal(rejected, true, context)
  }
  for (const line of fixture.trim().split('\n')) {
    if (line.startsWith('#')) continue
    const fields = line.split('\t'),
      values = fields.map(Number)
    if (fields[0] === 'ym') {
      const start = new Temporal.PlainYearMonth(
        values[1],
        values[2],
        'iso8601',
        values[3]
      )
      const positive = {years: values[4], months: values[5]},
        negative = {years: -values[4], months: -values[5]}
      for (const run of [
        () => start.add(positive),
        () => start.subtract(negative),
      ]) {
        if (fields[10] === 'false') rejects(run, line)
        else {
          const actual = run()
          equal(
            [
              actual.year,
              actual.month,
              actual.daysInMonth,
              actual.daysInYear,
            ].join(','),
            values.slice(6, 10).join(','),
            line
          )
        }
      }
    } else if (fields[0] === 'md') {
      const start = new Temporal.PlainMonthDay(
        values[1],
        values[2],
        'iso8601',
        values[3]
      )
      const run = () => start.toPlainDate({year: values[4]})
      if (fields[6] === 'false') rejects(run, line)
      else {
        const actual = run()
        equal(
          [actual.year, actual.month, actual.day].join(','),
          [values[4], values[1], values[5]].join(','),
          line
        )
      }
    } else {
      const start = new Temporal.PlainYearMonth(values[1], values[2]),
        end = new Temporal.PlainYearMonth(values[3], values[4])
      const options = {
        largestUnit: fields[5],
        smallestUnit: fields[5],
        roundingIncrement: values[6],
        roundingMode: fields[7],
      }
      const until = start.until(end, options),
        since = start.since(end, options)
      equal(until.years * 12 + until.months, values[8], line)
      equal(since.years * 12 + since.months, values[9], line)
    }
    count++
  }
  equal(count, 2028, 'Complete ICU short-date fixture')
  const date = Temporal.PlainDate.from('2020-02-29')
  const time = Temporal.PlainDateTime.from('2020-02-29T23:59:59.999999999')
  const ym = new Temporal.PlainYearMonth(2020, 2, 'iso8601', 29),
    md = new Temporal.PlainMonthDay(2, 29, 'iso8601', 2000)
  const zoned = Temporal.ZonedDateTime.from(
    '2020-11-01T01:30-05:00[US/Eastern]'
  )
  for (const calendarName of ['auto', 'always', 'never', 'critical']) {
    const suffix =
      calendarName === 'auto' || calendarName === 'never'
        ? ''
        : '[' + (calendarName === 'critical' ? '!' : '') + 'u-ca=iso8601]'
    const full = calendarName === 'always' || calendarName === 'critical'
    equal(
      date.toString({calendarName}),
      '2020-02-29' + suffix,
      'Date annotation'
    )
    equal(
      time.toString({
        calendarName,
        smallestUnit: 'second',
        roundingMode: 'ceil',
      }),
      '2020-03-01T00:00:00' + suffix,
      'DateTime carry and annotation'
    )
    equal(
      ym.toString({calendarName}),
      (full ? '2020-02-29' : '2020-02') + suffix,
      'YearMonth reference day'
    )
    equal(
      md.toString({calendarName}),
      (full ? '2000-02-29' : '02-29') + suffix,
      'MonthDay reference year'
    )
    equal(
      zoned.toString({calendarName, timeZoneName: 'critical'}),
      '2020-11-01T01:30:00-05:00[!US/Eastern]' + suffix,
      'Zoned alias and annotation'
    )
  }
  equal(
    ym.toPlainDate({day: 1e100}).toJSON(),
    '2020-02-29',
    'Clamp before narrowing day'
  )
  for (const operation of ['until', 'since'] as const) {
    const start = new Temporal.PlainYearMonth(1970, 1)
    for (const end of ['-271821-05', '+275760-09']) start[operation](end)
    rejects(
      () => start[operation]('-271821-04'),
      'Minimum YearMonth first day remains bounded'
    )
  }
  const reads: string[] = []
  time.toString({
    get calendarName() {
      reads.push('calendarName')
      return {
        toString() {
          reads.push('calendarName.toString')
          return 'auto'
        },
      }
    },
    get fractionalSecondDigits() {
      reads.push('fractionalSecondDigits')
      return 'auto'
    },
    get roundingMode() {
      reads.push('roundingMode')
      return 'trunc'
    },
    get smallestUnit() {
      reads.push('smallestUnit')
      return undefined
    },
  })
  equal(
    reads.join(','),
    'calendarName,calendarName.toString,fractionalSecondDigits,roundingMode,smallestUnit',
    'Format option order'
  )
  return count
}

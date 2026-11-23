import type {Temporal as TemporalNamespace} from '#packages/temporal/index.js'

export function checkPlainDateTimeConversion(
  Temporal: typeof TemporalNamespace,
  equal: (actual: unknown, expected: unknown, context: string) => void
): void {
  const date = new Temporal.PlainDate(2020, 2, 29),
    time = new Temporal.PlainTime(12, 34, 56, 123, 456, 789),
    original = Temporal.PlainTime.from
  let changed: ReturnType<typeof date.toPlainDateTime> | undefined,
    plain: ReturnType<typeof date.toPlainDateTime> | undefined,
    zoned: ReturnType<typeof date.toZonedDateTime> | undefined
  Temporal.PlainTime.from = () => {
    throw new Error('Public PlainTime.from reached')
  }
  try {
    plain = date.toPlainDateTime(time)
    zoned = date.toZonedDateTime({timeZone: 'UTC', plainTime: time})
    changed = date.toPlainDateTime().withPlainTime(time)
  } finally {
    Temporal.PlainTime.from = original
  }
  equal(
    changed!.toString(),
    '2020-02-29T12:34:56.123456789',
    'Private date-time replacement'
  )
  equal(
    plain!.toString(),
    '2020-02-29T12:34:56.123456789',
    'Private time conversion'
  )
  equal(
    zoned!.epochNanoseconds,
    1582979696123456789n,
    'Private zoned time conversion'
  )
}

export function checkPlainDateZoneBranch(
  Temporal: typeof TemporalNamespace,
  equal: (actual: unknown, expected: unknown, context: string) => void
): void {
  const date = new Temporal.PlainDate(2020, 2, 29),
    zone = new Temporal.ZonedDateTime(0n, 'UTC')
  Object.defineProperty(zone, 'plainTime', {
    get() {
      throw new Error('Unused plainTime reached')
    },
  })
  equal(
    date.toZonedDateTime(zone).epochNanoseconds,
    1582934400000000000n,
    'Direct branded zone ignores plainTime'
  )
  const reads: string[] = []
  date.toZonedDateTime({
    get timeZone() {
      reads.push('timeZone')
      return 'UTC'
    },
    get plainTime() {
      reads.push('plainTime')
      return {hour: 1}
    },
  })
  equal(reads.join(','), 'timeZone,plainTime', 'Bag time remains observable')
}

export function checkPlainDateShortFields(
  Temporal: typeof TemporalNamespace,
  equal: (actual: unknown, expected: unknown, context: string) => void
): void {
  const date = new Temporal.PlainDate(2020, 2, 29, 'gregory'),
    sourceYearMonth = new Temporal.PlainYearMonth(2020, 2, 'gregory')
  for (const key of ['era', 'eraYear']) {
    const original = Object.getOwnPropertyDescriptor(Object.prototype, key)
    let yearMonth: ReturnType<typeof date.toPlainYearMonth> | undefined,
      monthDay: ReturnType<typeof date.toPlainMonthDay> | undefined,
      destination: ReturnType<typeof sourceYearMonth.toPlainDate> | undefined
    Object.defineProperty(Object.prototype, key, {
      configurable: true,
      get() {
        throw new Error('Inherited private era reached')
      },
    })
    try {
      yearMonth = date.toPlainYearMonth()
      monthDay = date.toPlainMonthDay()
      destination = sourceYearMonth.toPlainDate({day: 3})
    } finally {
      if (original) Object.defineProperty(Object.prototype, key, original)
      else Reflect.deleteProperty(Object.prototype, key)
    }
    equal(
      yearMonth!.toString(),
      '2020-02-01[u-ca=gregory]',
      'Private YearMonth fields'
    )
    equal(
      monthDay!.toString(),
      '1972-02-29[u-ca=gregory]',
      'Private MonthDay fields'
    )
    equal(
      destination!.toString(),
      '2020-02-03[u-ca=gregory]',
      'Private YearMonth destination'
    )
  }
  let reads = 0
  const inherited = Object.create({
    get day() {
      reads++
      return 4
    },
  })
  equal(
    sourceYearMonth.toPlainDate(inherited).toString(),
    '2020-02-04[u-ca=gregory]',
    'Public inherited day'
  )
  equal(reads, 1, 'Public day read once')
}

function checkCalendarEraLookup(
  Temporal: typeof TemporalNamespace,
  equal: (actual: unknown, expected: unknown, context: string) => void,
  key: 'indexOf' | typeof Symbol.iterator
): void {
  const calendar = key === 'indexOf' ? 'gregory' : 'japanese',
    fields = {
      calendar,
      era: calendar === 'gregory' ? 'ce' : 'reiwa',
      eraYear: calendar === 'gregory' ? 2020 : 2,
      month: 2,
      day: 3,
    },
    control = {calendar, year: 2020, month: 2, day: 3},
    original = Object.getOwnPropertyDescriptor(Array.prototype, key)!
  // Warm the selected provider before changing the private lookup hook.
  Temporal.PlainDate.from(fields)
  Temporal.PlainDate.from(control)
  let calls = 0,
    converted: ReturnType<typeof Temporal.PlainDate.from> | undefined,
    unchanged: ReturnType<typeof Temporal.PlainDate.from> | undefined
  Object.defineProperty(Array.prototype, key, {
    ...original,
    value() {
      calls++
      throw new Error('Public array era lookup reached')
    },
  })
  try {
    unchanged = Temporal.PlainDate.from(control)
    converted = Temporal.PlainDate.from(fields)
  } finally {
    Object.defineProperty(Array.prototype, key, original)
  }
  const expected =
    calendar === 'gregory'
      ? '2020-02-03[u-ca=gregory]'
      : '2020-02-03[u-ca=japanese]'
  equal(unchanged!.toString(), expected, 'Calendar year control')
  equal(converted!.toString(), expected, 'Private era conversion')
  equal(calls, 0, 'Private era lookup avoids public hooks')
}

export function checkCalendarEraIndexOf(
  Temporal: typeof TemporalNamespace,
  equal: (actual: unknown, expected: unknown, context: string) => void
): void {
  checkCalendarEraLookup(Temporal, equal, 'indexOf')
}

export function checkJapaneseEraIterator(
  Temporal: typeof TemporalNamespace,
  equal: (actual: unknown, expected: unknown, context: string) => void
): void {
  checkCalendarEraLookup(Temporal, equal, Symbol.iterator)
  const date = new Temporal.PlainDate(2020, 2, 3, 'japanese'),
    control = new Temporal.PlainDate(2020, 2, 3, 'gregory'),
    original = Object.getOwnPropertyDescriptor(
      Array.prototype,
      Symbol.iterator
    )!
  // Warm the selected providers before reading private era metadata.
  void date.era
  void control.era
  let calls = 0,
    era: string | undefined,
    eraYear: number | undefined,
    controlEra: string | undefined,
    controlYear: number | undefined
  Object.defineProperty(Array.prototype, Symbol.iterator, {
    ...original,
    value() {
      calls++
      throw new Error('Public Japanese era output iterator reached')
    },
  })
  try {
    controlEra = control.era
    controlYear = control.eraYear
    era = date.era
    eraYear = date.eraYear
  } finally {
    Object.defineProperty(Array.prototype, Symbol.iterator, original)
  }
  equal(controlEra, 'ce', 'Gregorian era control')
  equal(controlYear, 2020, 'Gregorian era-year control')
  equal(era, 'reiwa', 'Private Japanese era output')
  equal(eraYear, 2, 'Private Japanese era-year output')
  equal(calls, 0, 'Private Japanese era output avoids public iteration')
}

export function checkPlainDateYearFormatting(
  Temporal: typeof TemporalNamespace,
  equal: (actual: unknown, expected: unknown, context: string) => void
): void {
  const years = [1, -1, 10000],
    expected = ['0001-01-02', '-000001-01-02', '+010000-01-02'],
    dates = years.map(year => new Temporal.PlainDate(year, 1, 2)),
    original = String.prototype.padStart
  let result: string[] = []
  String.prototype.padStart = () => {
    throw new Error('Public year padding reached')
  }
  try {
    result = dates.map(date => date.toString() + '/' + date.toJSON())
  } finally {
    String.prototype.padStart = original
  }
  for (let i = 0; i < expected.length; i++)
    equal(
      result[i],
      expected[i] + '/' + expected[i],
      'Private ISO year padding'
    )
}

export function checkMonthDayPrivateMerge(
  Temporal: typeof TemporalNamespace,
  equal: (actual: unknown, expected: unknown, context: string) => void
): void {
  const monthDay = new Temporal.PlainMonthDay(5, 2)
  for (const key of ['month', 'era', 'eraYear']) {
    const original = Object.getOwnPropertyDescriptor(Object.prototype, key)
    let result: ReturnType<typeof monthDay.toPlainDate> | undefined
    Object.defineProperty(Object.prototype, key, {
      configurable: true,
      get() {
        throw new Error('Inherited private month-day field')
      },
    })
    try {
      result = monthDay.toPlainDate({year: 2020})
    } finally {
      if (original) Object.defineProperty(Object.prototype, key, original)
      else Reflect.deleteProperty(Object.prototype, key)
    }
    equal(result!.toString(), '2020-05-02', 'Private month-day destination')
  }
  let reads = 0
  const inherited = Object.create({
    get year() {
      reads++
      return 2021
    },
  })
  equal(
    monthDay.toPlainDate(inherited).toString(),
    '2021-05-02',
    'Public inherited year'
  )
  equal(reads, 1, 'Public year read once')
}

export function checkMonthDayOriginalDateLimits(
  Temporal: typeof TemporalNamespace,
  equal: (actual: unknown, expected: unknown, context: string) => void
): void {
  for (const text of [
    '+275760-09-14[u-ca=gregory]',
    '-271821-04-18[u-ca=gregory]',
  ]) {
    for (const options of [undefined, {overflow: 'constrain'}]) {
      let error: unknown
      try {
        Temporal.PlainMonthDay.from(text, options)
      } catch (caught) {
        error = caught
      }
      equal(
        error instanceof RangeError,
        true,
        'Original month-day date limit ' + text
      )
    }
  }
  for (const text of [
    '+275760-09-13[u-ca=gregory]',
    '-271821-04-19[u-ca=gregory]',
  ]) {
    const result = Temporal.PlainMonthDay.from(text)
    equal(result.calendarId, 'gregory', 'Original month-day endpoint valid')
    equal(result.day, text.includes('09-13') ? 13 : 19, 'Original endpoint day')
  }
}

export function checkShortDatePrivateEra(
  Temporal: typeof TemporalNamespace,
  equal: (actual: unknown, expected: unknown, context: string) => void
): void {
  for (const key of ['era', 'eraYear']) {
    const original = Object.getOwnPropertyDescriptor(Object.prototype, key)
    let monthDay: ReturnType<typeof Temporal.PlainMonthDay.from> | undefined,
      yearMonth: ReturnType<typeof Temporal.PlainYearMonth.from> | undefined
    Object.defineProperty(Object.prototype, key, {
      configurable: true,
      get() {
        throw new Error('Inherited parsed era field')
      },
    })
    try {
      monthDay = Temporal.PlainMonthDay.from('2020-05-02[u-ca=gregory]')
      yearMonth = Temporal.PlainYearMonth.from('2020-05-02[u-ca=gregory]')
    } finally {
      if (original) Object.defineProperty(Object.prototype, key, original)
      else Reflect.deleteProperty(Object.prototype, key)
    }
    equal(monthDay!.monthCode, 'M05', 'Parsed private month-day')
    equal(yearMonth!.year, 2020, 'Parsed private year-month')
  }
}

export function checkMonthDayLeapCodeHooks(
  Temporal: typeof TemporalNamespace,
  equal: (actual: unknown, expected: unknown, context: string) => void
): void {
  for (const method of ['endsWith', 'slice'] as const) {
    const original = String.prototype[method]
    let regular: ReturnType<typeof Temporal.PlainMonthDay.from> | undefined,
      constrained: ReturnType<typeof Temporal.PlainMonthDay.from> | undefined
    String.prototype[method] = () => {
      throw new Error('Public leap month string hook')
    }
    try {
      regular = Temporal.PlainMonthDay.from({
        calendar: 'chinese',
        monthCode: 'M01',
        day: 1,
      })
      constrained = Temporal.PlainMonthDay.from({
        calendar: 'chinese',
        monthCode: 'M01L',
        day: 1,
      })
    } finally {
      String.prototype[method] = original
    }
    equal(regular!.monthCode, 'M01', 'Regular month code')
    equal(constrained!.monthCode, 'M01', 'Constrained leap code')
  }
}

export function checkPlainDateTimeFormattingHooks(
  Temporal: typeof TemporalNamespace,
  equal: (actual: unknown, expected: unknown, context: string) => void
): void {
  const value = new Temporal.PlainDateTime(2020, 1, 2, 3, 4),
    original = String.prototype.slice
  let text: string | undefined, json: string | undefined
  String.prototype.slice = () => {
    throw new Error('Private date-time slice reached')
  }
  try {
    text = value.toString()
    json = value.toJSON()
  } finally {
    String.prototype.slice = original
  }
  equal(text, '2020-01-02T03:04:00', 'PlainDateTime string private formatting')
  equal(json, text, 'PlainDateTime JSON private formatting')
}

export function checkDateOutputOracle(
  Temporal: typeof TemporalNamespace,
  fixture: string,
  equal: (actual: unknown, expected: unknown, context: string) => void
): number {
  checkPlainDateTimeConversion(Temporal, equal)
  checkPlainDateZoneBranch(Temporal, equal)
  checkPlainDateShortFields(Temporal, equal)
  checkCalendarEraIndexOf(Temporal, equal)
  checkJapaneseEraIterator(Temporal, equal)
  checkPlainDateYearFormatting(Temporal, equal)
  checkMonthDayPrivateMerge(Temporal, equal)
  checkMonthDayOriginalDateLimits(Temporal, equal)
  checkShortDatePrivateEra(Temporal, equal)
  checkMonthDayLeapCodeHooks(Temporal, equal)
  checkPlainDateTimeFormattingHooks(Temporal, equal)
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

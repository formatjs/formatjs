import type {Temporal as TemporalNamespace} from '#packages/temporal/index.js'

// Spec controls; independent ICU row counts below stay unchanged.
function checkLargeCalendarFields(
  Temporal: typeof TemporalNamespace,
  equal: (actual: unknown, expected: unknown, context: string) => void
): void {
  for (const value of [2 ** 53, 1e100, Number.MAX_VALUE]) {
    const cases = [
      [
        (overflow: 'constrain' | 'reject') =>
          Temporal.PlainDate.from(
            {year: 2000, month: value, day: value},
            {overflow}
          ).toString(),
        '2000-12-31',
      ],
      [
        (overflow: 'constrain' | 'reject') =>
          Temporal.PlainDate.from(
            {year: 2000, month: 2, day: value},
            {overflow}
          ).toString(),
        '2000-02-29',
      ],
      [
        (overflow: 'constrain' | 'reject') =>
          Temporal.PlainDate.from('1900-02-15')
            .with({day: value}, {overflow})
            .toString(),
        '1900-02-28',
      ],
      [
        (overflow: 'constrain' | 'reject') =>
          Temporal.PlainDateTime.from(
            {year: 2000, month: value, day: value},
            {overflow}
          ).toString(),
        '2000-12-31T00:00:00',
      ],
      [
        (overflow: 'constrain' | 'reject') =>
          Temporal.PlainDateTime.from('2000-02-15T12:34:56.123456789')
            .with({day: value}, {overflow})
            .toString(),
        '2000-02-29T12:34:56.123456789',
      ],
      [
        (overflow: 'constrain' | 'reject') =>
          Temporal.PlainYearMonth.from(
            {year: 2000, month: value},
            {overflow}
          ).toString(),
        '2000-12',
      ],
      [
        (overflow: 'constrain' | 'reject') =>
          Temporal.PlainYearMonth.from('2000-02')
            .with({month: value}, {overflow})
            .toString(),
        '2000-12',
      ],
      [
        (overflow: 'constrain' | 'reject') =>
          Temporal.PlainMonthDay.from(
            {month: value, day: value},
            {overflow}
          ).toString(),
        '12-31',
      ],
      [
        (overflow: 'constrain' | 'reject') =>
          Temporal.PlainMonthDay.from('02-15')
            .with({day: value}, {overflow})
            .toString(),
        '02-29',
      ],
      [
        (overflow: 'constrain' | 'reject') =>
          Temporal.ZonedDateTime.from(
            {year: 2000, month: value, day: value, timeZone: 'UTC'},
            {overflow}
          ).toString(),
        '2000-12-31T00:00:00+00:00[UTC]',
      ],
    ] as const
    for (let index = 0; index < cases.length; index++) {
      const [run, expected] = cases[index]
      equal(
        run('constrain'),
        expected,
        `large calendar field ${value}/${index}`
      )
      let error: unknown
      try {
        run('reject')
      } catch (caught) {
        error = caught
      }
      equal(
        error instanceof RangeError,
        true,
        `reject large field ${value}/${index}`
      )
    }
  }
  for (const value of [Infinity, -Infinity, NaN, 0, -1]) {
    let error: unknown
    try {
      Temporal.PlainDate.from({year: 2000, month: value, day: 1})
    } catch (caught) {
      error = caught
    }
    equal(error instanceof RangeError, true, `invalid month ${value}`)
  }
}

export function checkYearMonthDifferencePrivateFields(
  Temporal: typeof TemporalNamespace,
  equal: (actual: unknown, expected: unknown, context: string) => void
): void {
  const pairs = [
    [
      new Temporal.PlainYearMonth(2020, 1, 'gregory', 31),
      new Temporal.PlainYearMonth(2020, 2, 'gregory', 29),
      1,
    ],
    [
      Temporal.PlainYearMonth.from({
        calendar: 'hebrew',
        year: 5784,
        monthCode: 'M05L',
      }),
      Temporal.PlainYearMonth.from({
        calendar: 'hebrew',
        year: 5784,
        monthCode: 'M06',
      }),
      1,
    ],
    [
      new Temporal.PlainYearMonth(2020, 1, 'gregory', 15),
      new Temporal.PlainYearMonth(2020, 1, 'gregory', 16),
      0,
    ],
  ] as const
  const inherited: string[] = []
  const bag = Object.create({
    calendar: 'gregory',
    month: 2,
    get era() {
      inherited.push('era')
      return 'ce'
    },
    get eraYear() {
      inherited.push('eraYear')
      return 2020
    },
  })
  equal(
    pairs[0][0].until(bag, {largestUnit: 'month'}).toString(),
    'P1M',
    'Public inherited era bag'
  )
  equal(
    inherited.join(','),
    'era,eraYear',
    'Public inherited era getters remain observable'
  )
  for (const [first, last, months] of pairs) {
    for (const method of ['until', 'since'] as const) {
      for (const increment of [1, 2]) {
        for (const key of ['era', 'eraYear']) {
          const original = Object.getOwnPropertyDescriptor(
            Object.prototype,
            key
          )
          let hooks = 0
          let error: unknown
          let result: InstanceType<typeof Temporal.Duration> | undefined
          try {
            Object.defineProperty(Object.prototype, key, {
              configurable: true,
              get() {
                hooks++
                throw new Error('Private difference era read')
              },
            })
            try {
              result = first[method](last, {
                largestUnit: 'month',
                smallestUnit: 'month',
                roundingIncrement: increment,
                roundingMode: 'expand',
              })
            } catch (caught) {
              error = caught
            }
          } finally {
            if (original) Object.defineProperty(Object.prototype, key, original)
            else delete (Object.prototype as Record<string, unknown>)[key]
          }
          const context = `${first.calendarId}.${method} private ${key}, increment ${increment}`
          equal(hooks, 0, context)
          equal(error, undefined, context)
          equal(
            result?.toString(),
            months === 0
              ? 'PT0S'
              : `${method === 'since' ? '-' : ''}P${increment}M`,
            context
          )
        }
      }
    }
  }
}

export function checkDateTimeDifferencePrivateUnits(
  Temporal: typeof TemporalNamespace,
  equal: (actual: unknown, expected: unknown, context: string) => void
): void {
  const first = Temporal.PlainDateTime.from('2020-01-01T00:00'),
    last = Temporal.PlainDateTime.from('2020-01-01T01:00')
  for (const end of [first, last]) {
    for (const method of ['until', 'since'] as const) {
      const original = Array.prototype[Symbol.iterator]
      let hooks = 0
      let error: unknown
      let result: InstanceType<typeof Temporal.Duration> | undefined
      try {
        Array.prototype[Symbol.iterator] = function () {
          hooks++
          throw new Error('Private difference unit iteration')
        }
        try {
          result = first[method](end)
        } catch (caught) {
          error = caught
        }
      } finally {
        Array.prototype[Symbol.iterator] = original
      }
      const context = `PlainDateTime.${method} private units`
      equal(hooks, 0, context)
      equal(error, undefined, context)
      equal(
        result?.toString(),
        end === first ? 'PT0S' : method === 'since' ? '-PT1H' : 'PT1H',
        context
      )
    }
  }
}

export function checkUmmAlQuraJoins(
  Temporal: typeof TemporalNamespace,
  equal: (actual: unknown, expected: unknown, context: string) => void
): void {
  const calendar = 'islamic-umalqura'
  for (const [iso, year, month, monthCode, day] of [
    ['1881-11-22', 1298, 12, 'M12', 29],
    ['1881-11-23', 1299, 1, 'M01', 1],
    ['1881-11-24', 1299, 1, 'M01', 2],
    ['2176-11-02', 1602, 12, 'M12', 29],
    ['2176-11-03', 1603, 1, 'M01', 1],
    ['2176-11-04', 1603, 1, 'M01', 2],
  ] as const) {
    const value = Temporal.PlainDate.from(iso).withCalendar(calendar)
    equal(value.year, year, `${iso} join year`)
    equal(value.month, month, `${iso} join month`)
    equal(value.monthCode, monthCode, `${iso} join month code`)
    equal(value.day, day, `${iso} join day`)
    equal(
      Temporal.PlainDate.from(
        {calendar, year, monthCode, day},
        {overflow: 'reject'}
      ).toString({calendarName: 'never'}),
      iso,
      `${iso} join inverse`
    )
  }
  for (const [before, after] of [
    ['1881-11-22', '1881-11-23'],
    ['2176-11-02', '2176-11-03'],
  ]) {
    const first = Temporal.PlainDate.from(before).withCalendar(calendar),
      last = Temporal.PlainDate.from(after).withCalendar(calendar)
    equal(first.add({days: 1}).equals(last), true, `${before} cross join`)
    equal(last.subtract({days: 1}).equals(first), true, `${after} reverse join`)
    equal(
      first.until(last, {largestUnit: 'day'}).toString(),
      'P1D',
      `${before} join difference`
    )
  }
}

export function checkDateDifferenceUnitGroup(
  Temporal: typeof TemporalNamespace,
  equal: (actual: unknown, expected: unknown, context: string) => void
): void {
  const date = Temporal.PlainDate.from('2020-01-01')
  for (const method of ['until', 'since'] as const) {
    const original = Object.getOwnPropertyDescriptor(Array.prototype, '-1')
    let hooks = 0
    let error: unknown
    try {
      Object.defineProperty(Array.prototype, '-1', {
        configurable: true,
        get() {
          hooks++
          throw new Error('Private negative unit index')
        },
      })
      try {
        date[method](date, {largestUnit: 'auto', smallestUnit: 'hour'})
      } catch (caught) {
        error = caught
      }
    } finally {
      if (original) Object.defineProperty(Array.prototype, '-1', original)
      else delete (Array.prototype as unknown as Record<string, unknown>)['-1']
    }
    equal(hooks, 0, `PlainDate.${method} private unit index`)
    equal(error instanceof RangeError, true, `PlainDate.${method} unit group`)
  }
}

export function checkDifferenceOptionOrder(
  Temporal: typeof TemporalNamespace,
  equal: (actual: unknown, expected: unknown, context: string) => void
): void {
  const pairs = [
    [
      'PlainDate',
      Temporal.PlainDate.from('2020-01-01'),
      Temporal.PlainDate.from('2020-01-02'),
    ],
    [
      'PlainDateTime',
      Temporal.PlainDateTime.from('2020-01-01T00:00'),
      Temporal.PlainDateTime.from('2020-01-02T00:00'),
    ],
    [
      'ZonedDateTime',
      Temporal.ZonedDateTime.from('2020-01-01T00:00Z[UTC]'),
      Temporal.ZonedDateTime.from('2020-01-02T00:00Z[UTC]'),
    ],
    [
      'PlainYearMonth',
      Temporal.PlainYearMonth.from('2020-01'),
      Temporal.PlainYearMonth.from('2020-02'),
    ],
    [
      'PlainTime',
      Temporal.PlainTime.from('00:00'),
      Temporal.PlainTime.from('01:00'),
    ],
    [
      'Instant',
      Temporal.Instant.from('2020-01-01T00:00Z'),
      Temporal.Instant.from('2020-01-02T00:00Z'),
    ],
  ] as const
  const sentinel = new Error('Later difference option read')
  for (const [name, first, last] of pairs) {
    for (const end of [first, last]) {
      for (const method of ['until', 'since'] as const) {
        for (const spelling of ['bogus', 'Years', 'autoS', '']) {
          const trace: string[] = []
          let error: unknown
          try {
            first[method](end, {
              get largestUnit() {
                trace.push('get largestUnit')
                return {
                  [Symbol.toPrimitive](hint: string) {
                    trace.push(`coerce ${hint}`)
                    return spelling
                  },
                }
              },
              get roundingIncrement() {
                trace.push('get roundingIncrement')
                throw sentinel
              },
            })
          } catch (caught) {
            error = caught
          }
          const context = `${name}.${method} invalid ${spelling}`
          equal(error instanceof RangeError, true, context)
          equal(trace.join(','), 'get largestUnit,coerce string', context)
        }
        const trace: string[] = []
        let error: unknown
        const largestUnit =
          name === 'PlainDate' || name === 'PlainYearMonth' ? 'hours' : 'years'
        try {
          first[method](end, {
            largestUnit,
            get roundingIncrement() {
              trace.push('get roundingIncrement')
              return {
                valueOf() {
                  trace.push('coerce increment')
                  return 1
                },
              }
            },
            get roundingMode() {
              trace.push('get roundingMode')
              return {
                toString() {
                  trace.push('coerce mode')
                  return 'trunc'
                },
              }
            },
            get smallestUnit() {
              trace.push('get smallestUnit')
              throw sentinel
            },
          })
        } catch (caught) {
          error = caught
        }
        equal(
          error,
          sentinel,
          `${name}.${method} reads smallest before group validation`
        )
        equal(
          trace.join(','),
          'get roundingIncrement,coerce increment,get roundingMode,coerce mode,get smallestUnit',
          `${name}.${method} independent option order`
        )
        // Recognized spellings pass independent validation before unit-group checks.
        for (const largestUnit of [undefined, 'auto', 'nanoseconds']) {
          let error: unknown
          try {
            first[method](end, {
              largestUnit,
              get roundingIncrement() {
                throw sentinel
              },
            })
          } catch (caught) {
            error = caught
          }
          equal(
            error,
            sentinel,
            `${name}.${method} deferred unit group ${largestUnit}`
          )
        }
      }
    }
  }
}

export function checkCalendarDifferencePolicy(
  Temporal: typeof TemporalNamespace,
  equal: (actual: unknown, expected: unknown, context: string) => void
): void {
  for (const [
    calendar,
    firstYear,
    firstCode,
    lastYear,
    lastCode,
    forward,
    backward,
  ] of [
    ['chinese', 2023, 'M02L', 2024, 'M02', 'P12M', '-P12M'],
    ['dangi', 2023, 'M02L', 2024, 'M02', 'P12M', '-P12M'],
    ['hebrew', 5784, 'M05L', 5785, 'M06', 'P1Y', '-P1Y1M'],
  ] as const) {
    const first = Temporal.PlainDate.from({
        calendar,
        year: firstYear,
        monthCode: firstCode,
        day: 29,
      }),
      last = Temporal.PlainDate.from({
        calendar,
        year: lastYear,
        monthCode: lastCode,
        day: 29,
      }),
      positive = first.until(last, {largestUnit: 'year'}),
      negative = last.until(first, {largestUnit: 'year'})
    equal(positive.toString(), forward, `${calendar} retained year prefix`)
    equal(negative.toString(), backward, `${calendar} reverse year prefix`)
    equal(
      first.add(positive).equals(last),
      true,
      `${calendar} forward add-back`
    )
    equal(
      last.add(negative).equals(first),
      true,
      `${calendar} reverse add-back`
    )
    equal(
      first.add({years: 1}).equals(last),
      true,
      `${calendar} constrained year fallback`
    )
  }
}

// Proposal comparison §12.3.3 steps8–9: private List writes precede public field Gets.
function checkPrivateCalendarFieldNames(
  Temporal: typeof TemporalNamespace,
  equal: (actual: unknown, expected: unknown, context: string) => void
): void {
  const value = new Temporal.PlainDate(2020, 2, 3, 'gregory')
  let trace = '',
    dayReceiverMatches = false
  const fields = new Proxy(
    {
      get day() {
        dayReceiverMatches = this === fields
        return {
          valueOf() {
            trace += 'number;'
            return 4
          },
        }
      },
    },
    {
      get(target, key, receiver) {
        trace += `${String(key)};`
        return Reflect.get(target, key, receiver)
      },
    }
  )
  const options = {
    get overflow() {
      trace += 'overflow;'
      return 'constrain'
    },
  }
  const original = Object.getOwnPropertyDescriptor(Array.prototype, '1')
  let calls = 0,
    actual: string | undefined,
    error: unknown
  try {
    Object.defineProperty(Array.prototype, '1', {
      configurable: true,
      set() {
        calls++
        throw new Error('Private calendar field name write')
      },
    })
    actual = value.with(fields, options).toString()
  } catch (caught) {
    error = caught
  } finally {
    if (original) Object.defineProperty(Array.prototype, '1', original)
    else Reflect.deleteProperty(Array.prototype, '1')
  }
  equal(
    error,
    undefined,
    'Private calendar field names do not call inherited setter'
  )
  equal(calls, 0, 'Private calendar field-name append hooks')
  equal(actual, '2020-02-04[u-ca=gregory]', 'Gregorian public day update')
  equal(
    dayReceiverMatches,
    true,
    'Public day getter receives original field bag'
  )
  equal(
    trace,
    'calendar;timeZone;day;number;era;eraYear;month;monthCode;year;overflow;',
    'Public field Gets and immediate day conversion precede overflow'
  )
}

export function checkPublicCalendarOracle(
  Temporal: typeof TemporalNamespace,
  fixture: string,
  equal: (actual: unknown, expected: unknown, context: string) => void,
  counts: {
    fields: number
    additions: number
    bounds: number
    bridges: number
    differences: number
    windows: number
  } = {
    fields: 0,
    additions: 0,
    bounds: 0,
    bridges: 0,
    differences: 0,
    windows: 0,
  }
): {
  fields: number
  additions: number
  bounds: number
  bridges: number
  differences: number
  windows: number
} {
  checkPrivateCalendarFieldNames(Temporal, equal)
  checkLargeCalendarFields(Temporal, equal)
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

import type {Temporal as TemporalNamespace} from '#packages/temporal/index.js'

export function checkStringOracle(
  Temporal: typeof TemporalNamespace,
  isoRows: readonly (readonly (string | number)[])[],
  zoneFixture: string,
  equal: (actual: unknown, expected: unknown, context: string) => void
): {
  dates: number
  dateTimes: number
  yearMonths: number
  monthDays: number
  zoned: number
} {
  const day = 86_400_000_000_000n,
    limit = 8_640_000_000_000_000_000_000n
  const pad = (value: number, digits = 2) => String(value).padStart(digits, '0')
  const yearText = (year: number) =>
    year < 0
      ? '-' + pad(-year, 6)
      : year > 9999
        ? '+' + pad(year, 6)
        : pad(year, 4)
  let dates = 0,
    dateTimes = 0,
    yearMonths = 0,
    monthDays = 0,
    zoned = 0
  for (const row of isoRows) {
    const [milliseconds, year, month, date, hour, minute, second, millisecond] =
      row.map(Number)
    const ns = BigInt(milliseconds) * 1_000_000n,
      remainder = ((ns % day) + day) % day
    const epochDay = (ns - remainder) / day
    const ym = yearText(year) + '-' + pad(month),
      dateText = ym + '-' + pad(date)
    const full =
      dateText +
      'T' +
      pad(hour) +
      ':' +
      pad(minute) +
      ':' +
      pad(second) +
      '.' +
      pad(millisecond, 3)
    if (epochDay >= -100000001n && epochDay <= 100000000n) {
      equal(
        Temporal.PlainDate.from(full).toJSON(),
        dateText,
        'ICU date parsing'
      )
      dates++
    }
    if (ns > -limit - day && ns < limit + day) {
      const parsed = Temporal.PlainDateTime.from(full)
      equal(
        parsed.toString({fractionalSecondDigits: 3}),
        full,
        'ICU date-time fields'
      )
      if (ns >= -limit && ns <= limit)
        equal(
          parsed.toZonedDateTime('UTC').epochNanoseconds,
          ns,
          'ICU date-time epoch'
        )
      dateTimes++
    }
    if (
      (year > -271821 && year < 275760) ||
      (year === -271821 && month >= 4) ||
      (year === 275760 && month <= 9)
    ) {
      equal(
        Temporal.PlainYearMonth.from(dateText).toJSON(),
        ym,
        'ICU year-month parsing'
      )
      yearMonths++
    }
    equal(
      Temporal.PlainMonthDay.from(dateText).toJSON(),
      pad(month) + '-' + pad(date),
      'ICU month-day parsing'
    )
    monthDays++
  }
  const supported = new Map<string, boolean>()
  for (const line of zoneFixture.trim().split('\n')) {
    if (line.startsWith('#')) continue
    const [identifier, milliseconds, offsetSeconds] = line.split('\t')
    if (!supported.has(identifier)) {
      try {
        new Temporal.ZonedDateTime(0n, identifier)
        supported.set(identifier, true)
      } catch (error) {
        if (!(error instanceof RangeError)) throw error
        supported.set(identifier, false)
      }
    }
    if (!supported.get(identifier)) continue
    const epoch = BigInt(milliseconds) * 1_000_000n
    if (epoch < -limit || epoch > limit) continue
    const local = new Date(Number(milliseconds) + Number(offsetSeconds) * 1000)
    if (!Number.isFinite(local.getTime())) continue
    const seconds = Math.abs(Number(offsetSeconds)),
      sign = Number(offsetSeconds) < 0 ? '-' : '+'
    const offset =
      sign +
      pad(Math.floor(seconds / 3600)) +
      ':' +
      pad(Math.floor(seconds / 60) % 60) +
      ':' +
      pad(seconds % 60)
    const text =
      local.toISOString().slice(0, -1) + offset + '[' + identifier + ']'
    equal(
      Temporal.ZonedDateTime.from(text).epochNanoseconds,
      epoch,
      'ICU zoned exact offset: ' + line
    )
    equal(
      Temporal.ZonedDateTime.from(
        new Date(Number(milliseconds)).toISOString() + '[' + identifier + ']'
      ).epochNanoseconds,
      epoch,
      'ICU zoned UTC offset: ' + line
    )
    zoned++
  }
  equal(dates, 25269, 'Complete ICU date fixture')
  equal(dateTimes, 25269, 'Complete ICU date-time fixture')
  equal(yearMonths, 25269, 'Complete ICU year-month fixture')
  equal(monthDays, 25269, 'Complete ICU month-day fixture')
  equal(zoned, 17640, 'Complete ICU zoned fixture')
  const parsers = [
    {
      run: (value: string, options?: unknown) =>
        Temporal.PlainDate.from(value, options),
      valid: '2020-01-01',
      invalid: '2020-02-30',
      names: ['overflow'],
    },
    {
      run: (value: string, options?: unknown) =>
        Temporal.PlainDateTime.from(value, options),
      valid: '2020-01-01T12:34',
      invalid: '2020-01-01T24:00',
      names: ['overflow'],
    },
    {
      run: (value: string, options?: unknown) =>
        Temporal.PlainYearMonth.from(value, options),
      valid: '2020-01',
      invalid: '2020-13',
      names: ['overflow'],
    },
    {
      run: (value: string, options?: unknown) =>
        Temporal.PlainMonthDay.from(value, options),
      valid: '01-01',
      invalid: '13-01',
      names: ['overflow'],
    },
    {
      run: (value: string, options?: unknown) =>
        Temporal.ZonedDateTime.from(value, options),
      valid: '2020-01-01T12:34[UTC]',
      invalid: '2020-01-01T24:00[UTC]',
      names: ['disambiguation', 'offset', 'overflow'],
    },
  ]
  for (const parser of parsers) {
    const reads: string[] = [],
      options = Object.create(null)
    for (const name of parser.names)
      Object.defineProperty(options, name, {
        get() {
          reads.push(name)
          return undefined
        },
      })
    for (const value of [
      parser.invalid,
      '\ud800',
      '\udfff',
      parser.valid + '[foo=\ud800]',
    ]) {
      let rejected = false
      try {
        parser.run(value, options)
      } catch (error) {
        rejected = error instanceof RangeError
      }
      equal(rejected, true, 'Reject invalid grammar/UTF16: ' + value)
      equal(reads.length, 0, 'Invalid string precedes options')
    }
    parser.run(parser.valid, options)
    equal(reads.join(','), parser.names.join(','), 'Valid string option order')
  }
  const inherited = Object.getOwnPropertyDescriptor(Object.prototype, 'offset')
  Object.defineProperty(Object.prototype, 'offset', {
    configurable: true,
    get() {
      throw new Error('Inherited offset must not be read')
    },
  })
  try {
    equal(
      Temporal.ZonedDateTime.from('1970-01-01T00:00[UTC]').epochNanoseconds,
      0n,
      'Missing offset stays undefined'
    )
  } finally {
    if (inherited) Object.defineProperty(Object.prototype, 'offset', inherited)
    else delete (Object.prototype as {offset?: unknown}).offset
  }
  return {dates, dateTimes, yearMonths, monthDays, zoned}
}

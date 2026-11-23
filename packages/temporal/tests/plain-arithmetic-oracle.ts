import type {Temporal as TemporalNamespace} from '#packages/temporal/index.js'

export function checkPlainArithmeticOracle(
  Temporal: typeof TemporalNamespace,
  fixture: string,
  clockRows: string[][],
  durationRows: string[][],
  equal: (actual: unknown, expected: unknown, context: string) => void
): {arithmetic: number; rounds: number; dayRounds: number} {
  const privateDate = Temporal.PlainDate.from('2020-01-31')
  const privateDateTime = Temporal.PlainDateTime.from('2020-01-31T23:30')
  const privateYearMonth = Temporal.PlainYearMonth.from('2020-01')
  const privateHebrew =
    Temporal.PlainDate.from('2024-01-11').withCalendar('hebrew')
  const privateChinese =
    Temporal.PlainDate.from('2024-02-10').withCalendar('chinese')
  const privateDangi =
    Temporal.PlainDate.from('2024-02-10').withCalendar('dangi')
  const month = Temporal.Duration.from({months: 1})
  const monthHour = Temporal.Duration.from({months: 1, hours: 1})
  let overflowReads = 0
  const privateOptions = {
    get overflow() {
      overflowReads++
      return 'constrain'
    },
  }
  const privateCases = [
    [() => privateDate.add(month, privateOptions), '2020-02-29'],
    [() => privateDate.subtract(month, privateOptions), '2019-12-31'],
    [
      () => privateDateTime.add(monthHour, privateOptions),
      '2020-03-01T00:30:00',
    ],
    [
      () => privateDateTime.subtract(monthHour, privateOptions),
      '2019-12-31T22:30:00',
    ],
    [() => privateYearMonth.add(month, privateOptions), '2020-02'],
    [() => privateYearMonth.subtract(month, privateOptions), '2019-12'],
    [() => privateHebrew.add(month, privateOptions), '2024-02-10[u-ca=hebrew]'],
    [
      () => privateChinese.add(month, privateOptions),
      '2024-03-10[u-ca=chinese]',
    ],
    [() => privateDangi.add(month, privateOptions), '2024-03-10[u-ca=dangi]'],
  ] as const
  const privateFailures: string[] = []
  for (const hook of [
    'keys',
    'iterator',
    'map',
    'species',
    'monthCode',
    'test',
    'exec',
    'slice',
    'endsWith',
    'padStart',
    'indexOf',
    'String',
    'legacyState',
  ]) {
    if (
      hook === 'species' &&
      !Object.getOwnPropertyDescriptor(Array, Symbol.species)
    )
      continue
    if (
      hook === 'legacyState' &&
      !Object.getOwnPropertyDescriptor(RegExp, '$1')
    )
      continue
    for (const [run, expected] of privateCases) {
      const originalKeys = Object.keys
      const originalIterator = Array.prototype[Symbol.iterator]
      const originalMap = Array.prototype.map
      const originalSpecies = Object.getOwnPropertyDescriptor(
        Array,
        Symbol.species
      )
      const originalMonthCode = Object.getOwnPropertyDescriptor(
        Object.prototype,
        'monthCode'
      )
      const originalTest = RegExp.prototype.test
      const originalExec = RegExp.prototype.exec
      const originalString = String
      const originalSlice = String.prototype.slice
      const originalEndsWith = String.prototype.endsWith
      const originalPadStart = String.prototype.padStart
      const originalIndexOf = String.prototype.indexOf
      const markerPattern = /calendar-(marker)/
      markerPattern.exec('calendar-marker')
      let legacyState: string | undefined
      let hooks = 0
      let result: {toString(): string} | undefined
      let error: unknown
      overflowReads = 0
      const fail = () => {
        hooks++
        throw new Error('Observable private addition fields')
      }
      try {
        if (hook === 'keys') Object.keys = fail
        if (hook === 'iterator') Array.prototype[Symbol.iterator] = fail
        if (hook === 'map') Array.prototype.map = fail
        if (hook === 'species')
          Object.defineProperty(Array, Symbol.species, {
            configurable: true,
            get: fail,
          })
        if (hook === 'monthCode')
          Object.defineProperty(Object.prototype, 'monthCode', {
            configurable: true,
            get: fail,
          })
        if (hook === 'test') RegExp.prototype.test = fail
        if (hook === 'exec') RegExp.prototype.exec = fail
        if (hook === 'slice') String.prototype.slice = fail
        if (hook === 'endsWith') String.prototype.endsWith = fail
        if (hook === 'padStart') String.prototype.padStart = fail
        if (hook === 'indexOf') String.prototype.indexOf = fail
        if (hook === 'String')
          globalThis.String = fail as unknown as StringConstructor
        try {
          result = run()
        } catch (caught) {
          error = caught
        }
      } finally {
        Object.keys = originalKeys
        Array.prototype[Symbol.iterator] = originalIterator
        Array.prototype.map = originalMap
        if (originalSpecies)
          Object.defineProperty(Array, Symbol.species, originalSpecies)
        if (originalMonthCode)
          Object.defineProperty(
            Object.prototype,
            'monthCode',
            originalMonthCode
          )
        else delete (Object.prototype as {monthCode?: unknown}).monthCode
        RegExp.prototype.test = originalTest
        RegExp.prototype.exec = originalExec
        globalThis.String = originalString
        String.prototype.slice = originalSlice
        String.prototype.endsWith = originalEndsWith
        String.prototype.padStart = originalPadStart
        String.prototype.indexOf = originalIndexOf
        if (hook === 'legacyState') legacyState = RegExp.$1
      }
      if (hook === 'legacyState' && legacyState !== 'marker')
        privateFailures.push(`${hook}: ${expected}`)
      if (error || hooks) privateFailures.push(`${hook}: ${expected}`)
      else {
        equal(
          result!.toString(),
          expected,
          'Plain addition retains calendar arithmetic'
        )
        equal(
          overflowReads,
          1,
          'Plain addition still reads public overflow once'
        )
      }
    }
  }
  equal(privateFailures.join(', '), '', 'Plain addition avoids private hooks')
  for (const [calendar, year, monthCode, expected] of [
    ['hebrew', 5784, 'M05L', '2024-02-10[u-ca=hebrew]'],
    ['hebrew', 5784, 'M06', '2024-03-11[u-ca=hebrew]'],
    ['hebrew', 5785, 'M05L', '2025-03-01[u-ca=hebrew]'],
    ['coptic', 1740, 'M13', '2024-09-06[u-ca=coptic]'],
    ['chinese', 2023, 'M02L', '2023-03-22[u-ca=chinese]'],
    ['chinese', 2024, 'M02L', '2024-03-10[u-ca=chinese]'],
  ] as const) {
    equal(
      Temporal.PlainDate.from({calendar, year, monthCode, day: 1}).toString(),
      expected,
      'Calendar month-code ordinal and leap policy'
    )
  }
  for (const [calendar, year, monthCode] of [
    ['hebrew', 5785, 'M05L'],
    ['hebrew', 5784, 'M13'],
    ['hebrew', 5784, 'M01\n'],
    ['coptic', 1740, 'M14'],
    ['chinese', 2024, 'M02L'],
    ['chinese', 2024, 'M00L'],
    ['chinese', 2024, 'M01\n'],
  ] as const) {
    let rejected = false
    try {
      Temporal.PlainDate.from(
        {calendar, year, monthCode, day: 1},
        {overflow: 'reject'}
      )
    } catch (error) {
      rejected = error instanceof RangeError
    }
    equal(rejected, true, 'Calendar month-code rejection remains strict')
  }
  let inheritedMonthCodeReads = 0
  const inheritedMonthCode = {
    get monthCode() {
      inheritedMonthCodeReads++
      return 'M01'
    },
  }
  equal(
    Temporal.PlainDate.from({
      __proto__: inheritedMonthCode,
      calendar: 'hebrew',
      year: 5784,
      day: 1,
    }).toString(),
    '2023-09-16[u-ca=hebrew]',
    'Public inherited monthCode stays observable'
  )
  equal(inheritedMonthCodeReads, 1, 'Public monthCode getter read once')
  const day = 86_400_000_000_000n
  const clock = (value: ReturnType<typeof Temporal.PlainDateTime.from>) =>
    BigInt(value.hour) * 3_600_000_000_000n +
    BigInt(value.minute) * 60_000_000_000n +
    BigInt(value.second) * 1_000_000_000n +
    BigInt(value.millisecond) * 1_000_000n +
    BigInt(value.microsecond) * 1000n +
    BigInt(value.nanosecond)
  let arithmetic = 0,
    rounds = 0,
    dayRounds = 0
  for (const line of fixture.trim().split('\n')) {
    if (line.startsWith('#')) continue
    const values = line.split('\t'),
      numeric = values.map(Number)
    const origin = BigInt(values[0])
    const remainder = ((origin % day) + day) % day
    // Date supplies only fixture input coordinates; ICU supplies every expected result.
    const date = new Date(Number((origin - remainder) / day) * 86400000)
    const input = new Temporal.PlainDateTime(
      date.getUTCFullYear(),
      date.getUTCMonth() + 1,
      date.getUTCDate(),
      Number(remainder / 3_600_000_000_000n),
      Number((remainder / 60_000_000_000n) % 60n),
      Number((remainder / 1_000_000_000n) % 60n),
      Number((remainder / 1_000_000n) % 1000n),
      Number((remainder / 1000n) % 1000n),
      Number(remainder % 1000n)
    )
    const duration = {
      years: numeric[1],
      months: numeric[2],
      weeks: numeric[3],
      days: numeric[4],
      nanoseconds: numeric[5],
    }
    const opposite = Object.fromEntries(
      Object.entries(duration).map(([key, value]) => [key, -value])
    )
    const expected = BigInt(values[6]),
      limit = 8_640_000_000_000_000_000_000n + day
    for (const run of [
      () => input.add(duration),
      () => input.subtract(opposite),
    ]) {
      if (expected <= -limit || expected >= limit) {
        let rejected = false
        try {
          run()
        } catch (error) {
          rejected = error instanceof RangeError
        }
        equal(rejected, true, line)
      } else {
        const actual = run()
        equal(
          [
            actual.year,
            actual.month,
            actual.day,
            actual.dayOfWeek,
            actual.dayOfYear,
            actual.weekOfYear,
            actual.yearOfWeek,
          ].join(','),
          numeric.slice(7).join(','),
          line
        )
        equal(
          clock(actual).toString(),
          (((expected % day) + day) % day).toString(),
          line
        )
      }
    }
    arithmetic++
  }
  const start = Temporal.PlainDateTime.from('1970-01-01T00:00')
  for (const [origin, unit, increment, mode, , expected] of clockRows) {
    const value = start.add({nanoseconds: Number(origin)})
    const actual = value.round({
      smallestUnit: unit,
      roundingIncrement: Number(increment),
      roundingMode: mode,
    })
    const rounded = BigInt(expected)
    equal(
      actual.toPlainDate().toJSON(),
      rounded >= day ? '1970-01-02' : '1970-01-01',
      'ICU clock carry'
    )
    equal(
      clock(actual).toString(),
      (rounded % day).toString(),
      'ICU clock rounding'
    )
    rounds++
  }
  for (const [kind, origin, unit, mode, expected] of durationRows) {
    if (
      kind !== 'round' ||
      unit !== 'day' ||
      BigInt(origin) < 0n ||
      BigInt(origin) >= day
    )
      continue
    const actual = start
      .add({nanoseconds: Number(origin)})
      .round({smallestUnit: 'day', roundingMode: mode})
    equal(
      actual.toJSON(),
      BigInt(expected) === day ? '1970-01-02T00:00:00' : '1970-01-01T00:00:00',
      'ICU day rounding'
    )
    dayRounds++
  }
  const yearMonthOrigin = new Temporal.PlainYearMonth(
    275760,
    8,
    'islamic-civil',
    22
  )
  const yearMonthTarget = new Temporal.PlainYearMonth(
    275760,
    9,
    'islamic-civil',
    21
  )
  equal(
    yearMonthOrigin.toString(),
    '+275760-08-22[u-ca=islamic-civil]',
    'year-month addition starts at supported full date'
  )
  equal(
    yearMonthTarget.toString(),
    '+275760-09-21[u-ca=islamic-civil]',
    'year-month representation permits reference date beyond PlainDate limit'
  )
  equal(
    yearMonthOrigin.with({month: 6}).toString(),
    '+275760-09-21[u-ca=islamic-civil]',
    'year-month field replacement permits reference date beyond PlainDate limit'
  )
  // Islamic civil 283583-M05-01/06-01 are epoch days 99999978/100000008.
  for (const [context, operation] of [
    [
      'year-month add validates added full date',
      () => yearMonthOrigin.add({months: 1}),
    ],
    [
      'year-month subtract validates added full date',
      () => yearMonthOrigin.subtract({months: -1}),
    ],
  ] as const) {
    let rangeError = false
    try {
      operation()
    } catch (error) {
      rangeError = error instanceof RangeError
    }
    equal(rangeError, true, context)
  }
  equal(arithmetic, 840, 'Complete ICU arithmetic fixture')
  return {arithmetic, rounds, dayRounds}
}

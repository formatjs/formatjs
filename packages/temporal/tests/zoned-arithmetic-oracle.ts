import type {Temporal as TemporalNamespace} from '#packages/temporal/index.js'

export function checkZonedArithmeticOracle(
  Temporal: typeof TemporalNamespace,
  differenceFixture: string,
  dayFixture: string,
  equal: (actual: unknown, expected: unknown, context: string) => void
): {differences: number; days: number} {
  const privateUTC = new Temporal.ZonedDateTime(0n, 'UTC')
  const privateMonrovia = new Temporal.ZonedDateTime(0n, 'Africa/Monrovia')
  const privateNoon = new Temporal.PlainTime(12)
  const privateFold = {
    year: 2024,
    month: 11,
    day: 3,
    hour: 1,
    minute: 30,
    offset: '-05:00',
    timeZone: 'America/New_York',
  }
  // Warm providers before replacing hooks; cold kernel creation has its own control.
  void privateUTC.offsetNanoseconds
  void privateMonrovia.offsetNanoseconds
  Temporal.ZonedDateTime.from(privateFold)
  const privateFailures: string[] = []
  function privateHook(
    target: object,
    key: PropertyKey,
    context: string,
    run: () => unknown,
    expected: unknown
  ): void {
    const descriptor = Object.getOwnPropertyDescriptor(target, key)!
    let calls = 0
    let actual: unknown
    let error: unknown
    try {
      Object.defineProperty(target, key, {
        configurable: true,
        writable: true,
        value() {
          calls++
          throw new Error('Observable private zoned operation')
        },
      })
      try {
        actual = run()
      } catch (caught) {
        error = caught
      }
    } finally {
      Object.defineProperty(target, key, descriptor)
    }
    if (error || calls !== 0 || actual !== expected)
      privateFailures[privateFailures.length] =
        context + (error ? ': threw' : ': wrong result')
  }
  privateHook(
    Temporal.PlainTime,
    'from',
    'Zoned private time conversion',
    () => privateUTC.withPlainTime(privateNoon).epochNanoseconds,
    43_200_000_000_000n
  )
  privateHook(
    Temporal.PlainTime,
    'from',
    'Zoned private time extraction',
    () => privateUTC.toPlainTime().hour,
    0
  )
  equal(
    privateUTC.withPlainTime().epochNanoseconds,
    0n,
    'Zoned omitted clock starts day'
  )
  for (const method of ['slice', 'padStart', 'replace'] as const) {
    privateHook(
      String.prototype,
      method,
      'Zoned private ' + method,
      () => privateUTC.toJSON() + '|' + privateMonrovia.offset,
      '1970-01-01T00:00:00+00:00[UTC]|-00:44:30'
    )
  }
  privateHook(
    globalThis,
    'String',
    'Zoned private String conversion',
    () => privateUTC.offset + '|' + privateMonrovia.offset,
    '+00:00|-00:44:30'
  )
  privateHook(
    RegExp.prototype,
    'test',
    'Zoned constructor named identifier',
    () => new Temporal.ZonedDateTime(0n, 'UTC').timeZoneId,
    'UTC'
  )
  privateHook(
    RegExp.prototype,
    'test',
    'Zoned constructor fixed identifier',
    () => new Temporal.ZonedDateTime(0n, '+01:00').offsetNanoseconds,
    3_600_000_000_000
  )
  equal(
    privateUTC.toString({offset: 'never', timeZoneName: 'never'}),
    '1970-01-01T00:00:00',
    'Zoned hidden offset and zone'
  )
  for (const method of ['sort', 'push', Symbol.iterator] as const) {
    privateHook(
      Array.prototype,
      method,
      'Zoned fold private candidate list',
      () => Temporal.ZonedDateTime.from(privateFold).epochNanoseconds,
      1_730_615_400_000_000_000n
    )
  }
  privateHook(
    Set.prototype,
    Symbol.iterator,
    'Zoned private offset set',
    () =>
      Temporal.ZonedDateTime.from({...privateFold, offset: '-04:00'})
        .epochNanoseconds,
    1_730_611_800_000_000_000n
  )
  equal(privateFailures.join('|'), '', 'Private zoned operation profiles')
  const weekOrigin = new Temporal.ZonedDateTime(
    1_603_603_800_000_000_000n,
    'America/New_York'
  )
  const weekEnd = new Temporal.ZonedDateTime(
    1_604_210_400_000_000_000n,
    'America/New_York'
  )
  equal(
    weekOrigin
      .until(weekEnd, {
        largestUnit: 'week',
        smallestUnit: 'week',
        roundingMode: 'trunc',
      })
      .toString(),
    'P1W',
    'Week retry crosses New York fold'
  )
  equal(
    weekOrigin
      .until(weekEnd, {
        largestUnit: 'week',
        smallestUnit: 'week',
        roundingMode: 'ceil',
      })
      .toString(),
    'P2W',
    'Week retry uses shifted upper bound'
  )
  const keysStart = Temporal.ZonedDateTime.from('2020-01-01T00:00[UTC]')
  const keysEnd = Temporal.ZonedDateTime.from('2020-01-03T00:00[UTC]')
  const originalKeys = Object.keys
  let privateKeys = 0
  let keysResult: InstanceType<typeof Temporal.Duration> | undefined
  let keysError: unknown
  try {
    Object.keys = () => {
      privateKeys++
      throw new Error('Observable private zoned difference keys')
    }
    try {
      keysResult = keysStart.since(keysEnd, {
        largestUnit: 'day',
        smallestUnit: 'minute',
      })
    } catch (error) {
      keysError = error
    }
  } finally {
    Object.keys = originalKeys
  }
  if (keysError) throw keysError
  equal(privateKeys, 0, 'Zoned since avoids private enumeration')
  equal(keysResult!.toString(), '-P2D', 'Zoned since retains signed result')
  equal(
    Object.is(keysResult!.nanoseconds, -0),
    false,
    'Zoned since zero stays positive'
  )
  let differences = 0,
    days = 0
  for (const line of differenceFixture.trim().split('\n')) {
    if (line.startsWith('#')) continue
    const [zone, start, end, unit, increment, roundingMode, until, since] =
      line.split('\t')
    const a = new Temporal.ZonedDateTime(BigInt(start), zone),
      b = new Temporal.ZonedDateTime(BigInt(end), zone)
    const options = {
      largestUnit: unit,
      smallestUnit: unit,
      roundingIncrement: +increment,
      roundingMode,
    }
    equal(
      a.until(b, options).toString(),
      Temporal.Duration.from({[unit + 's']: +until}).toString(),
      line
    )
    equal(
      a.since(b, options).toString(),
      Temporal.Duration.from({[unit + 's']: +since}).toString(),
      line
    )
    differences++
  }
  for (const line of dayFixture.trim().split('\n')) {
    if (line.startsWith('#')) continue
    const [zone, instant, start, end, roundingMode, expected] = line.split('\t')
    const value = new Temporal.ZonedDateTime(BigInt(instant) * 1_000_000n, zone)
    equal(value.startOfDay().epochNanoseconds, BigInt(start) * 1_000_000n, line)
    equal(value.hoursInDay, (Number(end) - Number(start)) / 3_600_000, line)
    equal(
      value.round({smallestUnit: 'day', roundingMode}).epochNanoseconds,
      BigInt(expected) * 1_000_000n,
      line
    )
    days++
  }
  equal(
    new Temporal.ZonedDateTime(4_200_000_000_000n, 'UTC').round({
      smallestUnit: 'minute',
      roundingIncrement: 20,
      roundingMode: 'halfEven',
    }).epochNanoseconds,
    3_600_000_000_000n,
    'Zoned clock halfEven uses minute-of-hour parity'
  )
  // Hardcoded precision controls supplement the unchanged ICU fixtures.
  for (const [unit, field, factor] of [
    ['nanosecond', 'nanoseconds', 1n],
    ['microsecond', 'microseconds', 1000n],
    ['millisecond', 'milliseconds', 1_000_000n],
  ] as const) {
    const span = 9_007_199_254_741_005n * factor
    const origin = -span / 2n
    const start = new Temporal.ZonedDateTime(origin, 'UTC')
    const end = new Temporal.ZonedDateTime(origin + span, 'UTC')
    for (const [first, last, kind] of [
      [start, end, 'ZonedDateTime'],
      [start.toPlainDateTime(), end.toPlainDateTime(), 'PlainDateTime'],
    ] as const) {
      const options = {
        largestUnit: unit,
        smallestUnit: unit,
        roundingIncrement: 10,
        roundingMode: 'halfExpand',
      }
      equal(
        first.until(last, options)[field],
        9_007_199_254_741_010,
        `${kind} exact ${unit} until`
      )
      equal(
        first.since(last, options)[field],
        -9_007_199_254_741_010,
        `${kind} exact ${unit} since`
      )
    }
  }
  // IANA 2026f africa: Monrovia used -00:44:30 from 1919 to 1972.
  // https://data.iana.org/time-zones/tzdb-2026f/africa
  for (const offset of ['-00:45', '-00:44:30']) {
    equal(
      Temporal.ZonedDateTime.from(
        `1970-01-01T00:00${offset}[Africa/Monrovia]`,
        {offset: 'reject'}
      ).epochNanoseconds,
      2_670_000_000_000n,
      `Monrovia matching offset ${offset}`
    )
  }
  let rejectedSeconds = false
  try {
    Temporal.ZonedDateTime.from('1970-01-01T00:00-00:45:00[Africa/Monrovia]', {
      offset: 'reject',
    })
  } catch (error) {
    rejectedSeconds = error instanceof RangeError
  }
  equal(rejectedSeconds, true, 'Monrovia mismatched seconds offset')
  // IANA 2026f: Apia skipped 2011-12-30; two backward day counts share an endpoint.
  // https://data.iana.org/time-zones/tzdb-2026f/australasia
  const apiaOrigin = new Temporal.ZonedDateTime(
    1_325_368_800_000_000_000n,
    'Pacific/Apia'
  )
  const apiaDestination = new Temporal.ZonedDateTime(
    1_325_275_200_000_000_000n,
    'Pacific/Apia'
  )
  for (const days of [1, 2]) {
    equal(
      apiaOrigin.subtract({days}).epochNanoseconds,
      1_325_282_400_000_000_000n,
      `Apia backward ${days} day endpoint`
    )
  }
  equal(
    apiaOrigin.subtract({days: 3}).epochNanoseconds,
    1_325_196_000_000_000_000n,
    'Apia backward three day endpoint'
  )
  for (const [
    roundingMode,
    backwardUntil,
    backwardSince,
    forwardUntil,
    forwardSince,
  ] of [
    ['ceil', '-P2D', 'P3D', 'P2D', '-P1D'],
    ['floor', '-P3D', 'P2D', 'P1D', '-P2D'],
    ['expand', '-P3D', 'P3D', 'P2D', '-P2D'],
    ['trunc', '-P2D', 'P2D', 'P1D', '-P1D'],
    ['halfCeil', '-P2D', 'P2D', 'P1D', '-P1D'],
    ['halfFloor', '-P2D', 'P2D', 'P1D', '-P1D'],
    ['halfExpand', '-P2D', 'P2D', 'P1D', '-P1D'],
    ['halfTrunc', '-P2D', 'P2D', 'P1D', '-P1D'],
    ['halfEven', '-P2D', 'P2D', 'P1D', '-P1D'],
  ] as const) {
    const options = {largestUnit: 'day', smallestUnit: 'day', roundingMode}
    equal(
      apiaOrigin.until(apiaDestination, options).toString(),
      backwardUntil,
      `Apia collapsed backward window until ${roundingMode}`
    )
    equal(
      apiaOrigin.since(apiaDestination, options).toString(),
      backwardSince,
      `Apia collapsed backward window since ${roundingMode}`
    )
    equal(
      apiaDestination.until(apiaOrigin, options).toString(),
      forwardUntil,
      `Apia ordinary forward window until ${roundingMode}`
    )
    equal(
      apiaDestination.since(apiaOrigin, options).toString(),
      forwardSince,
      `Apia ordinary forward window since ${roundingMode}`
    )
  }
  const overlapStart = new Temporal.ZonedDateTime(
    1_604_122_200_000_000_000n,
    'America/New_York'
  )
  const overlapEnd = new Temporal.ZonedDateTime(
    1_604_210_400_000_000_000n,
    'America/New_York'
  )
  for (const [smallestUnit, until, since] of [
    ['nanosecond', 'PT24H30M', '-PT24H30M'],
    ['minute', 'P1DT30M', '-P1DT30M'],
  ] as const) {
    const options = {largestUnit: 'day', smallestUnit}
    equal(
      overlapStart.until(overlapEnd, options).toString(),
      until,
      `New York overlap unchanged clock until ${smallestUnit}`
    )
    equal(
      overlapStart.since(overlapEnd, options).toString(),
      since,
      `New York overlap unchanged clock since ${smallestUnit}`
    )
  }
  // UTC's maximum Instant cannot supply a following local-day window.
  const maximum = new Temporal.ZonedDateTime(
    8_640_000_000_000_000_000_000n,
    'UTC'
  )
  const beforeMaximum = new Temporal.ZonedDateTime(
    8_639_999_999_940_000_000_000n,
    'UTC'
  )
  const zeroDuration = new Temporal.Duration()
  const exactMinute = {largestUnit: 'day', smallestUnit: 'minute'}
  for (const [context, operation] of [
    [
      'zero zoned day duration round requires next day',
      () =>
        zeroDuration.round({
          relativeTo: maximum,
          largestUnit: 'day',
          smallestUnit: 'day',
        }),
    ],
    [
      'zero zoned minute duration round requires next day',
      () => zeroDuration.round({relativeTo: maximum, ...exactMinute}),
    ],
    [
      'equal zoned difference rejects indivisible increment',
      () => maximum.until(maximum, {...exactMinute, roundingIncrement: 7}),
    ],
    [
      'equal zoned difference rejects maximum increment',
      () =>
        maximum.since(maximum, {
          largestUnit: 'day',
          smallestUnit: 'hour',
          roundingIncrement: 24,
        }),
    ],
    [
      'exact zoned minute until requires next day',
      () => beforeMaximum.until(maximum, exactMinute),
    ],
    [
      'exact zoned minute since requires next day',
      () => beforeMaximum.since(maximum, exactMinute),
    ],
    [
      'zero zoned day total still requires next day',
      () =>
        zeroDuration.total({
          relativeTo: maximum,
          unit: 'day',
        }),
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
  for (const smallestUnit of ['day', 'minute'] as const) {
    const options = {largestUnit: 'day', smallestUnit}
    equal(
      maximum.until(maximum, options).toString(),
      'PT0S',
      `equal zoned until skips next day ${smallestUnit}`
    )
    equal(
      maximum.since(maximum, options).toString(),
      'PT0S',
      `equal zoned since skips next day ${smallestUnit}`
    )
  }
  const exactNanosecond = {largestUnit: 'day', smallestUnit: 'nanosecond'}
  equal(
    maximum.until(maximum, exactNanosecond).toString(),
    'PT0S',
    'zero zoned nanosecond difference needs no next day'
  )
  equal(
    beforeMaximum.until(maximum, exactNanosecond).toString(),
    'PT1M',
    'exact zoned nanosecond until needs no next day'
  )
  equal(
    beforeMaximum.since(maximum, exactNanosecond).toString(),
    '-PT1M',
    'exact zoned nanosecond since needs no next day'
  )
  equal(
    zeroDuration.round({relativeTo: maximum, ...exactNanosecond}).toString(),
    'PT0S',
    'zero zoned nanosecond duration round needs no next day'
  )
  for (const [relativeTo, months, weeks, largestUnit, expected] of [
    ['+275760-08-06', 1, 1, 'month', 'P1M7D'],
    ['+275760-08-06T00:00[UTC]', 1, 1, 'month', 'P1M7D'],
    ['-271821-05-27', -1, -1, 'year', '-P1M7D'],
    ['-271821-05-27T00:00[UTC]', -1, -1, 'year', '-P1M7D'],
  ] as const) {
    const duration = Temporal.Duration.from({months, weeks})
    let rangeError = false
    try {
      duration.round({relativeTo, largestUnit, smallestUnit: 'week'})
    } catch (error) {
      rangeError = error instanceof RangeError
    }
    equal(
      rangeError,
      true,
      `Exact week window validates next endpoint ${relativeTo}`
    )
    equal(
      duration
        .round({relativeTo, largestUnit, smallestUnit: 'nanosecond'})
        .toString(),
      expected,
      `Exact nanosecond identity remains valid ${relativeTo}`
    )
  }
  let zeroZonedWeekRangeError = false
  try {
    new Temporal.Duration().round({
      relativeTo: '+275760-09-13T00:00[UTC]',
      largestUnit: 'year',
      smallestUnit: 'week',
    })
  } catch (error) {
    zeroZonedWeekRangeError = error instanceof RangeError
  }
  equal(
    zeroZonedWeekRangeError,
    true,
    'Zero zoned week window has positive direction'
  )
  equal(
    new Temporal.Duration()
      .round({
        relativeTo: '+275760-09-13',
        largestUnit: 'year',
        smallestUnit: 'week',
      })
      .toString(),
    'PT0S',
    'Zero plain week difference keeps equality shortcut'
  )
  equal(differences, 19440, 'Complete ICU zoned difference fixture')
  equal(days, 5292, 'Complete ICU zoned day fixture')
  return {differences, days}
}

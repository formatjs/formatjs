import type {Temporal as TemporalNamespace} from '#packages/temporal/index.js'

export function checkZonedArithmeticOracle(
  Temporal: typeof TemporalNamespace,
  differenceFixture: string,
  dayFixture: string,
  equal: (actual: unknown, expected: unknown, context: string) => void
): {differences: number; days: number} {
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
  equal(differences, 19440, 'Complete ICU zoned difference fixture')
  equal(days, 5292, 'Complete ICU zoned day fixture')
  return {differences, days}
}

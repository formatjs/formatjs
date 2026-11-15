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
  equal(differences, 19440, 'Complete ICU zoned difference fixture')
  equal(days, 5292, 'Complete ICU zoned day fixture')
  return {differences, days}
}

import type {Temporal as TemporalNamespace} from '#packages/temporal/index.js'

export function checkPlainArithmeticOracle(
  Temporal: typeof TemporalNamespace,
  fixture: string,
  clockRows: string[][],
  durationRows: string[][],
  equal: (actual: unknown, expected: unknown, context: string) => void
): {arithmetic: number; rounds: number; dayRounds: number} {
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
  equal(arithmetic, 840, 'Complete ICU arithmetic fixture')
  return {arithmetic, rounds, dayRounds}
}

import type {TemporalNamespace} from '#packages/temporal/index.js'
import type {PlainTimeObject} from '#packages/temporal/plain-time.js'
import type {DurationObject} from '#packages/temporal/duration.js'

const day = 86_400_000_000_000n
function equal(actual: unknown, expected: unknown, context: string): void {
  if (actual !== expected)
    throw new Error(
      'PlainTime oracle: ' +
        context +
        '; ' +
        String(actual) +
        ' != ' +
        String(expected)
    )
}
function clock(value: PlainTimeObject): bigint {
  return (
    BigInt(value.hour) * 3_600_000_000_000n +
    BigInt(value.minute) * 60_000_000_000n +
    BigInt(value.second) * 1_000_000_000n +
    BigInt(value.millisecond) * 1_000_000n +
    BigInt(value.microsecond) * 1000n +
    BigInt(value.nanosecond)
  )
}
function elapsed(value: DurationObject): bigint {
  return (
    BigInt(value.hours) * 3_600_000_000_000n +
    BigInt(value.minutes) * 60_000_000_000n +
    BigInt(value.seconds) * 1_000_000_000n +
    BigInt(value.milliseconds) * 1_000_000n +
    BigInt(value.microseconds) * 1000n +
    BigInt(value.nanoseconds)
  )
}
export function checkPlainTimeOracle(
  Temporal: TemporalNamespace,
  isoRows: (string | number)[][],
  roundRows: string[][],
  signedRows: string[][]
): {fields: number; rounds: number; differences: number} {
  const from = (value: bigint) =>
    Temporal.PlainTime.from({
      hour: Number(value / 3_600_000_000_000n),
      minute: Number((value / 60_000_000_000n) % 60n),
      second: Number((value / 1_000_000_000n) % 60n),
      millisecond: Number((value / 1_000_000n) % 1000n),
      microsecond: Number((value / 1000n) % 1000n),
      nanosecond: Number(value % 1000n),
    })
  const pad = (value: string | number, length = 2) =>
    String(value).padStart(length, '0')
  let fields = 0,
    rounds = 0,
    differences = 0
  const duration = {
    years: 2,
    months: 3,
    weeks: 4,
    days: 5,
    seconds: 1,
    nanoseconds: 1,
  }
  for (const row of isoRows) {
    const text = `${pad(row[4])}:${pad(row[5])}:${pad(row[6])}.${pad(row[7], 3)}`
    const expected =
      BigInt(row[4]) * 3_600_000_000_000n +
      BigInt(row[5]) * 60_000_000_000n +
      BigInt(row[6]) * 1_000_000_000n +
      BigInt(row[7]) * 1_000_000n
    const value = Temporal.PlainTime.from(text)
    equal(clock(value), expected, 'ICU clock parsing')
    equal(
      value.toString({fractionalSecondDigits: 3}),
      text,
      'ICU clock formatting'
    )
    equal(
      clock(value.add(duration)),
      (expected + 1_000_000_001n) % day,
      'Arithmetic ignores date units'
    )
    equal(
      clock(value.subtract(duration)),
      (expected - 1_000_000_001n + day) % day,
      'Negative day wrap'
    )
    fields++
  }
  for (const [
    origin,
    unit,
    increment,
    mode,
    expected,
    unwrapped,
  ] of roundRows) {
    const value = from(BigInt(origin))
    const options = {
      smallestUnit: unit,
      roundingIncrement: Number(increment),
      roundingMode: mode,
    }
    equal(
      clock(value.round(options)),
      BigInt(expected),
      'ICU field-relative ' + [origin, unit, increment, mode]
    )
    equal(
      Temporal.PlainDateTime.from('1970-01-01T' + value.toString())
        .round(options)
        .toZonedDateTime('UTC').epochNanoseconds,
      BigInt(unwrapped),
      'ICU unwrapped day carry'
    )
    rounds++
  }
  for (const [kind, origin, unit, mode, expected] of signedRows) {
    const amount = BigInt(origin)
    if (kind !== 'round' || unit === 'day' || amount <= -day || amount >= day)
      continue
    const first = from(amount < 0n ? day - 1n : 0n),
      last = from((amount < 0n ? day - 1n : 0n) + amount)
    const options = {
      largestUnit: 'hour',
      smallestUnit: unit,
      roundingMode: mode,
    }
    equal(
      elapsed(first.until(last, options)),
      BigInt(expected),
      'ICU signed until'
    )
    equal(
      elapsed(last.since(first, options)),
      BigInt(expected),
      'ICU signed since'
    )
    differences++
  }
  equal(
    Temporal.PlainTime.from({hour: 1e100, nanosecond: -1e100}).toString(),
    '23:00:00',
    'Large finite fields constrain before narrowing'
  )
  for (const text of ['\ud800', '\udfff', '12:00[u-ca=\ud800]']) {
    let rejected = false
    try {
      Temporal.PlainTime.from(text)
    } catch (error) {
      rejected = error instanceof RangeError
    }
    equal(rejected, true, 'Invalid UTF-16 RangeError')
  }
  return {fields, rounds, differences}
}

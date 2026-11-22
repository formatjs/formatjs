import {checkISODateUntilPrefixes} from '#packages/temporal/tests/arithmetic-calendar-oracle.js'
import {
  calendarStartOfYear,
  monthsInYear,
  daysInMonth,
  calendarToEpochDayRaw,
  calendarFromEpochDayRaw,
  addCalendarDateRaw,
  calendarDateUntilRaw,
  calendarMonthSerial,
  calendarEra,
  calendarYearFromEra,
} from '#packages/temporal/calendar.js'
import {
  checkPublicCalendarOracle,
  checkCalendarDifferencePolicy,
  checkDifferenceOptionOrder,
  checkDateDifferenceUnitGroup,
} from '#packages/temporal/tests/public-calendar-oracle.js'
import {
  configureNativeTemporal,
  nativeTemporal,
  type NativeQuery,
} from '#packages/temporal/native.js'
import {installTemporal} from '#packages/temporal/install.js'
import {Temporal} from '#packages/temporal/index.js'
import {checkPlainTimeOracle} from '#packages/temporal/tests/plain-time-oracle.js'
import {addISODays} from '#packages/temporal/kernel.js'

declare const __formatjsArithmeticCalendarOracle: string
declare const __formatjsTableCalendarOracle: string
declare const __temporalISOOracle: number[][]
declare const __temporalInstantRoundingOracle: string[][]
declare const __temporalDurationOracle: string[][]
declare const __temporalPlainTimeOracle: string[][]
declare function print(value: string): void
const host = globalThis as typeof globalThis & {
  __formatjsTemporalISOQuery?: NativeQuery
}
const query = host.__formatjsTemporalISOQuery!
if (!query) throw new Error('Rust Temporal ISO bridge missing')
configureNativeTemporal(query)
delete host.__formatjsTemporalISOQuery
installTemporal(true)
function check(value: boolean, context: string): void {
  if (!value) throw new Error(context)
}
configureNativeTemporal(source => {
  const request = JSON.parse(source)
  delete request.clockSnapshot
  return query(JSON.stringify(request))
})
const legacyClock = nativeTemporal()!.roundPlainTimeResult(
  86399999999999n,
  'hour',
  1,
  'ceil'
)
check(
  legacyClock.nanoseconds === 0 &&
    legacyClock.fields.every(value => value === 0),
  'Legacy clock responses must balance midnight'
)
configureNativeTemporal(query)
checkDateDifferenceUnitGroup(Temporal, (actual, expected, context) => {
  if (actual !== expected) throw new Error(context)
})
checkDifferenceOptionOrder(Temporal, (actual, expected, context) => {
  if (actual !== expected) throw new Error(context)
})
checkCalendarDifferencePolicy(Temporal, (actual, expected, context) =>
  check(actual === expected, context)
)
checkISODateUntilPrefixes((actual, expected, context) =>
  check(actual === expected, context)
)
let count = 0
for (const row of __temporalISOOracle) {
  const [milliseconds, year, month, day, hour, minute, second, millisecond] =
    row
  if (Math.abs(milliseconds) > 8_640_000_000_000_000) continue
  const instant = Temporal.Instant.fromEpochMilliseconds(milliseconds)
  const pad = (value: number, digits = 2) => String(value).padStart(digits, '0')
  const expected =
    (year < 0
      ? '-' + pad(-year, 6)
      : year > 9999
        ? '+' + pad(year, 6)
        : pad(year, 4)) +
    `-${pad(month)}-${pad(day)}T${pad(hour)}:${pad(minute)}:${pad(second)}.${pad(millisecond, 3)}Z`
  check(
    instant.toString({fractionalSecondDigits: 3}) === expected,
    'ICU instant formatting: ' + row
  )
  check(
    Temporal.Instant.from(expected).epochNanoseconds ===
      BigInt(milliseconds) * 1_000_000n,
    'ICU instant parsing: ' + row
  )
  const date = instant.toZonedDateTimeISO('UTC').toPlainDateTime()
  check(
    [
      date.year,
      date.month,
      date.day,
      date.hour,
      date.minute,
      date.second,
      date.millisecond,
    ].join(',') === row.slice(1).join(','),
    'ICU fields: ' + row
  )
  check(
    Temporal.PlainDateTime.from({
      year,
      month,
      day,
      hour,
      minute,
      second,
      millisecond,
    }).toZonedDateTime('UTC').epochNanoseconds ===
      BigInt(milliseconds) * 1_000_000n,
    'ICU epoch: ' + row
  )
  count++
}
let rounds = 0
for (const [
  epoch,
  unit,
  increment,
  mode,
  expected,
] of __temporalInstantRoundingOracle) {
  const value = Temporal.Instant.fromEpochNanoseconds(BigInt(epoch))
  check(
    value.round({
      smallestUnit: unit,
      roundingIncrement: Number(increment),
      roundingMode: mode,
    }).epochNanoseconds === BigInt(expected),
    'ICU Instant rounding: ' + [epoch, unit, increment, mode]
  )
  rounds++
}
let differences = 0
const limit = 8_640_000_000_000_000_000_000n
for (const [kind, epoch, unit, mode, expected] of __temporalDurationOracle) {
  const amount = BigInt(epoch)
  if (
    kind !== 'round' ||
    unit === 'day' ||
    amount < -2n * limit ||
    amount > 2n * limit
  )
    continue
  const origin = amount < 0n ? limit : -limit
  const first = Temporal.Instant.fromEpochNanoseconds(origin)
  const last = Temporal.Instant.fromEpochNanoseconds(origin + amount)
  const options = {largestUnit: 'hour', smallestUnit: unit, roundingMode: mode}
  for (const duration of [
    first.until(last, options),
    last.since(first, options),
  ]) {
    const actual =
      BigInt(duration.hours) * 3_600_000_000_000n +
      BigInt(duration.minutes) * 60_000_000_000n +
      BigInt(duration.seconds) * 1_000_000_000n +
      BigInt(duration.milliseconds) * 1_000_000n +
      BigInt(duration.microseconds) * 1000n +
      BigInt(duration.nanoseconds)
    check(
      actual === BigInt(expected),
      'ICU signed Instant difference: ' + [epoch, unit, mode]
    )
  }
  differences++
}
const start = Temporal.Instant.from('2000-02-29T23:59:59.999999999Z')
for (const text of ['\ud800', '\udfff', '1970-01-01T00:00Z[foo=\ud800]']) {
  let rejected = false
  try {
    Temporal.Instant.from(text)
  } catch (error) {
    rejected = error instanceof RangeError
  }
  check(rejected, 'Invalid UTF-16 must produce RangeError')
}
const end = start.add({nanoseconds: 1})
check(
  end.toString() === '2000-03-01T00:00:00Z' &&
    end.subtract({nanoseconds: 1}).equals(start),
  'Rust Instant arithmetic'
)
check(
  start.until(end).nanoseconds === 1 && start.since(end).nanoseconds === -1,
  'Rust signed Instant difference'
)
check(
  Temporal.PlainDate.from('2020-02-28').add({days: 2}).toString() ===
    '2020-03-01',
  'Public day arithmetic'
)
check(
  addISODays({year: 0, month: 1, day: 1, nanosecond: 1}, -1).year === -1,
  'Rust kernel day arithmetic'
)
check(
  Temporal.PlainDateTime.from('1969-12-31T23:59:59.999999999').toZonedDateTime(
    'UTC'
  ).epochNanoseconds === -1n,
  'Negative fractional epoch'
)
let range = false
try {
  Temporal.Instant.fromEpochNanoseconds(8_640_000_000_000_000_000_001n)
} catch (error) {
  range = error instanceof RangeError
}
check(range, 'Instant upper bound')
const info = JSON.parse(query('{"op":"info"}') as string)
check(
  info.calls >= count * 2 && info.completeTemporalBackend === false,
  'Rust operations must execute'
)
const original = BigInt
try {
  ;(globalThis as any).BigInt = () => {
    throw new Error('Poisoned BigInt')
  }
  check(
    Temporal.PlainDateTime.from('1970-01-01T00:00').toZonedDateTime('UTC')
      .epochNanoseconds === 0n,
    'Captured BigInt'
  )
} finally {
  ;(globalThis as any).BigInt = original
}
const json = {parse: JSON.parse, stringify: JSON.stringify}
try {
  Object.defineProperty(Object.prototype, 'toJSON', {
    configurable: true,
    value: () => {
      throw new Error('Poisoned toJSON')
    },
  })
  JSON.parse = JSON.stringify = () => {
    throw new Error('Poisoned JSON')
  }
  check(
    Temporal.PlainDateTime.from(
      '1969-12-31T23:59:59.999999999'
    ).toZonedDateTime('UTC').epochNanoseconds === -1n,
    'Captured JSON and own records'
  )
} finally {
  delete (Object.prototype as any).toJSON
  JSON.parse = json.parse
  JSON.stringify = json.stringify
}
const date = Temporal.PlainDateTime.from('2020-02-28T12:00')
const instant = Temporal.Instant.fromEpochNanoseconds(0n)
const later = Temporal.Instant.fromEpochNanoseconds(1n)
const time = Temporal.PlainTime.from('23:59:59.999999999')
try {
  configureNativeTemporal(() => 1)
  let rejected = false
  try {
    date.toZonedDateTime('UTC')
  } catch (error) {
    rejected = error instanceof RangeError
  }
  check(rejected, 'Native error must not fall back to TS')
  for (const action of [
    () => Temporal.Instant.from('1970-01-01T00:00Z'),
    () => instant.toJSON(),
    () => instant.add({nanoseconds: 1}),
    () => instant.round('second'),
    () => instant.until(later),
    () => Temporal.PlainTime.from('12:00'),
    () => Temporal.PlainTime.from({hour: 12}),
    () => time.toJSON(),
    () => time.add({nanoseconds: 1}),
    () => time.round('hour'),
    () => time.until(time),
    () => calendarStartOfYear('hebrew', 5784),
    () => monthsInYear('hebrew', 5784),
    () => daysInMonth('hebrew', 5784, 6),
    () =>
      calendarToEpochDayRaw('hebrew', {year: 5784, monthCode: 'M05L', day: 1}),
    () => calendarFromEpochDayRaw('hebrew', 19763),
    () =>
      addCalendarDateRaw(
        'hebrew',
        {year: 5784, monthCode: 'M05L', day: 1},
        {years: 1}
      ),
    () => calendarDateUntilRaw('hebrew', 19763, 20118, 'year'),
    () => calendarMonthSerial('hebrew', 5784, 6),
    () => calendarEra('hebrew', 19763),
    () => calendarYearFromEra('hebrew', 'am', 5784),
  ]) {
    let rejected = false
    try {
      action()
    } catch (error) {
      rejected = error instanceof RangeError
    }
    check(rejected, 'Operation must require native backend')
  }
} finally {
  configureNativeTemporal(query)
}
print(
  'Rust PlainTime ICU: ' +
    JSON.stringify(
      checkPlainTimeOracle(
        Temporal,
        __temporalISOOracle,
        __temporalPlainTimeOracle,
        __temporalDurationOracle
      )
    )
)
print(
  'Rust ISO/Instant Hermes ICU rows: ' +
    count +
    '; rounding: ' +
    rounds +
    '; signed differences: ' +
    differences
)

for (const fixture of [
  __formatjsArithmeticCalendarOracle,
  __formatjsTableCalendarOracle,
]) {
  const counts = checkPublicCalendarOracle(
    Temporal,
    fixture,
    (actual, expected, context) => {
      if (!Object.is(actual, expected))
        throw new Error(
          context + ': ' + String(actual) + ' !== ' + String(expected)
        )
    }
  )
  const table = fixture === __formatjsTableCalendarOracle
  check(
    counts.fields === (table ? 15932 : 34366) &&
      counts.additions === (table ? 6720 : 32352) &&
      counts.differences === (table ? 6720 : 32352) &&
      counts.windows === (table ? 1248 : 5408),
    'Incomplete native calendar corpus'
  )
  print('Rust calendar ICU: ' + JSON.stringify(counts))
}

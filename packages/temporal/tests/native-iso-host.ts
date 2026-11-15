import {
  configureNativeISO,
  type NativeISOQuery,
} from '#packages/temporal/native-iso.js'
import {installTemporal} from '#packages/temporal/install.js'
import {Temporal} from '#packages/temporal/index.js'
import {addISODays} from '#packages/temporal/kernel.js'

declare const __temporalISOOracle: number[][]
declare function print(value: string): void
const host = globalThis as typeof globalThis & {
  __formatjsTemporalISOQuery?: NativeISOQuery
}
const query = host.__formatjsTemporalISOQuery!
if (!query) throw new Error('Rust Temporal ISO bridge missing')
configureNativeISO(query)
delete host.__formatjsTemporalISOQuery
installTemporal(true)
function check(value: boolean, context: string): void {
  if (!value) throw new Error(context)
}
let count = 0
for (const row of __temporalISOOracle) {
  const [milliseconds, year, month, day, hour, minute, second, millisecond] =
    row
  if (Math.abs(milliseconds) > 8_640_000_000_000_000) continue
  const instant = Temporal.Instant.fromEpochMilliseconds(milliseconds)
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
try {
  configureNativeISO(() => 1)
  let rejected = false
  try {
    date.toZonedDateTime('UTC')
  } catch (error) {
    rejected = error instanceof RangeError
  }
  check(rejected, 'Native error must not fall back to TS')
} finally {
  configureNativeISO(query)
}
print('Rust ISO Hermes ICU rows: ' + count)

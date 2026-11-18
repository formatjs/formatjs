import assert from 'node:assert/strict'
import {spawnSync} from 'node:child_process'
import {cpus} from 'node:os'
import {join} from 'node:path'
import {performance} from 'node:perf_hooks'
import {pathToFileURL} from 'node:url'
import {runfiles} from '@bazel/runfiles'

const resolve = (value: string) => runfiles.resolve(value)
const profile = process.env.FORMATJS_TEMPORAL_NATIVE_PROFILE
assert.ok(profile === undefined || profile === 'named')
const directory = resolve(process.argv[2])
const {Temporal} = await import(pathToFileURL(join(directory, 'index.js')).href)
const native = spawnSync(resolve(process.argv[3]), [], {encoding: 'utf8'})
assert.equal(native.status, 0, native.stderr)
interface NativeMeasurement {
  name: string
  iterations: number
  outputs: string[]
  formatjsNanoseconds: number
  formatjsSamples: number[]
  fullPrecision?: boolean
}
interface NativeRow extends NativeMeasurement {
  temporalRsNanoseconds: number
  temporalRsSamples: number[]
}
const rust = JSON.parse(native.stdout) as {
  rust: string
  architecture: string
  results: NativeRow[]
  namedZoneResults: NativeMeasurement[]
}
const instantTexts = [
  '2020-03-08T06:59:59.123456789Z',
  '1969-12-31T23:59:59.999999999Z',
  '2000-02-29T12:34:56.987654321+05:45',
  '2400-11-05T01:02:03.000000001-04:00',
]
const durationTexts = [
  'PT1H2M3.123456789S',
  'P1Y2M3DT4H5M6.000000007S',
  '-P2DT3H4M5.006007008S',
  'PT0S',
]
const dateTexts = ['2020-02-29', '2000-01-31', '1900-12-31', '2400-06-15']
const timeTexts = [
  '01:02:03.123456789',
  '23:59:59.999999999',
  '12:30:45.987654321',
  '00:00:00',
]
const dateTimeTexts = [
  '2020-02-29T01:02:03.123456789',
  '2000-01-31T23:59:59.999999999',
  '1900-12-31T12:30:45.987654321',
  '2400-06-15T00:00:00',
]
const monthTexts = ['2020-02', '2000-01', '1900-12', '2400-06']
const dayTexts = ['02-29', '01-31', '12-31', '06-15']
const zonedTexts = [
  '2020-03-08T06:59:59.123456789+00:00[UTC]',
  '1969-12-31T23:59:59.999999999+00:00[UTC]',
  '2000-02-29T12:34:56.987654321+05:45[+05:45]',
  '2400-11-05T01:02:03.000000001-04:00[-04:00]',
]
const instants = instantTexts.map(text => Temporal.Instant.from(text))
const durations = durationTexts.map(text => Temporal.Duration.from(text))
const dates = dateTexts.map(text => Temporal.PlainDate.from(text))
const times = timeTexts.map(text => Temporal.PlainTime.from(text))
const days = Temporal.Duration.from('P1Y2M3D')
const hours = Temporal.Duration.from('PT25H2M3.000000004S')
const month = Temporal.Duration.from('P1M')
function hash(text: string): number {
  let value = 0x811c9dc5
  // Benchmark outputs contain only ASCII.
  for (let index = 0; index < text.length; index++)
    value = Math.imul(value ^ text.charCodeAt(index), 0x01000193)
  return value >>> 0
}
function fields(value: {year: number; month: number; day: number}): number {
  return value.year * 512 + value.month * 32 + value.day
}
type Operation = (index: number) => number | bigint
const operations: Record<string, Operation> = {
  'instant.parse': i => Temporal.Instant.from(instantTexts[i]).epochNanoseconds,
  'instant.format': i => hash(instants[i].toString()),
  'instant.roundMicrosecond': i =>
    instants[i].round('microsecond').epochNanoseconds,
  'instant.addTime': i => instants[i].add(hours).epochNanoseconds,
  'duration.parseFormat': i =>
    hash(Temporal.Duration.from(durationTexts[i]).toString()),
  'duration.format': i => hash(durations[i].toString()),
  'date.parse': i => fields(Temporal.PlainDate.from(dateTexts[i])),
  'date.format': i => hash(dates[i].toString()),
  'date.add': i => fields(dates[i].add(days)),
  'time.parseFormat': i =>
    hash(Temporal.PlainTime.from(timeTexts[i]).toString()),
  'time.roundMicrosecond': i => hash(times[i].round('microsecond').toString()),
  'dateTime.parseFormat': i =>
    hash(Temporal.PlainDateTime.from(dateTimeTexts[i]).toString()),
  'yearMonth.parseFormat': i =>
    hash(Temporal.PlainYearMonth.from(monthTexts[i]).toString()),
  'monthDay.parseFormat': i =>
    hash(Temporal.PlainMonthDay.from(dayTexts[i]).toString()),
  'zoned.parseUtcOrOffset': i =>
    Temporal.ZonedDateTime.from(zonedTexts[i]).epochNanoseconds,
}
for (const calendar of [
  'hebrew',
  'persian',
  'chinese',
  'dangi',
  'islamic-umalqura',
]) {
  const values = ['2000-02-05', '2020-03-08', '2023-07-01', '2024-02-10'].map(
    text => Temporal.PlainDate.from(text).withCalendar(calendar)
  )
  operations[`calendar.${calendar}.fields`] = i => fields(values[i])
  operations[`calendar.${calendar}.addMonth`] = i =>
    fields(values[i].add(month))
}
assert.deepEqual(
  profile === 'named' ? [] : Object.keys(operations).sort(),
  rust.results.map(row => row.name).sort()
)
const iterations = 50000,
  warmup = 20000,
  samples = 9
let sink = 0
function sample(operation: Operation, count: number): number {
  let checksum = 0
  const start = performance.now()
  for (let index = 0; index < count; index++) {
    const value = operation(index & 3)
    checksum =
      (checksum +
        (typeof value === 'bigint'
          ? Number(BigInt.asUintN(32, value))
          : value)) >>>
      0
  }
  const elapsed = ((performance.now() - start) * 1e6) / count
  sink ^= checksum
  return elapsed
}
function measureRow<T extends NativeMeasurement>(row: T) {
  const operation = operations[row.name]
  const count = row.name === 'zoned.named.transitionNext' ? 5000 : iterations
  const warm = row.name === 'zoned.named.transitionNext' ? 1000 : warmup
  const outputs = [0, 1, 2, 3].map(i => {
    const value = operation(i)
    return typeof value === 'bigint' && !row.fullPrecision
      ? BigInt.asUintN(64, value).toString()
      : value.toString()
  })
  assert.deepEqual(outputs, row.outputs, row.name)
  sample(operation, warm)
  const typescriptSamples = Array.from({length: samples}, () =>
    sample(operation, count)
  )
  const typescriptNanoseconds = [...typescriptSamples].sort((a, b) => a - b)[
    samples >> 1
  ]
  return {
    ...row,
    typescriptIterations: count,
    typescriptWarmup: warm,
    typescriptNanoseconds,
    typescriptSamples,
    typescriptOverRust: typescriptNanoseconds / row.formatjsNanoseconds,
  }
}
const results = rust.results.map(measureRow)
const namedTexts = [
  '2020-03-08T06:59:59.123456789Z[America/New_York]',
  '2020-11-01T05:30:00.987654321Z[America/New_York]',
  '2020-10-03T15:15:00.000000001Z[Australia/Lord_Howe]',
  '2400-11-05T05:02:03.000000001Z[America/New_York]',
]
const namedDates = namedTexts.map(text => Temporal.ZonedDateTime.from(text))
const oneDay = Temporal.Duration.from('P1D')
const noon = Temporal.PlainTime.from('12:34:56.123456789')
const namedOperations: Record<string, Operation> = {
  'zoned.named.parse': i =>
    Temporal.ZonedDateTime.from(namedTexts[i]).epochNanoseconds,
  'zoned.named.offset': i => namedDates[i].offsetNanoseconds,
  'zoned.named.addDay': i => namedDates[i].add(oneDay).epochNanoseconds,
  'zoned.named.startOfDay': i => namedDates[i].startOfDay().epochNanoseconds,
  'zoned.named.hoursInDay': i => namedDates[i].hoursInDay * 2,
  'zoned.named.transitionNext': i =>
    namedDates[i].getTimeZoneTransition('next')!.epochNanoseconds,
  'zoned.named.withTime': i =>
    namedDates[i].withPlainTime(noon).epochNanoseconds,
}
assert.deepEqual(
  Object.keys(namedOperations).sort(),
  rust.namedZoneResults.map(row => row.name).sort()
)
Object.assign(operations, namedOperations)
const namedZoneResults = rust.namedZoneResults.map(measureRow)
console.log(
  JSON.stringify(
    {
      node: process.version,
      v8: process.versions.v8,
      icu: process.versions.icu,
      rust: rust.rust,
      architecture: rust.architecture,
      cpu: cpus()[0]?.model,
      method:
        'Original25: Bazel -c opt native Rust public API versus published default TypeScript public API on Node/V8. Same four inputs per workload, all per-input outputs checked before timing. Native run first, then TS; separate runtimes, no FFI/WASM. Native 256 warmup, nine alternating 16384-call samples against temporal_rs; TS 20000 warmup, nine 50000-call samples. Both consume outputs; strings use FNV-1a 32-bit, avoiding TS BigInt hashing. Rust black_box and integer sum; TS number sum with low-32-bit reduction for BigInt outputs. Parsed values and calendar registries initialized outside timing. Rust calendar fields are one aggregate; TS reads three getters. TS may cache fields. UTC/fixed-offset zoned parsing only; no named-zone, startup, Hermes binding or conformance speed claim. Native temporal_rs reference retained as separate comparison.',
      iterations,
      warmup,
      samples,
      sink,
      rustFaster: results.filter(row => row.typescriptOverRust > 1).length,
      workloads: results.length,
      results,
      namedZoneScope:
        'Seven additional Rust/TS public workloads, four matched inputs: New York spring gap and autumn fold, Lord Howe half-hour change, New York year2400 future rules. Rust uses compiled IANA data; TS uses host Intl. Full signed nanosecond outputs checked without truncation; hoursInDay consumes exact half-hours. Same native sample counts; TS transition uses1000 warmup,9x5000 calls. Registry setup excluded. No temporal_rs named-zone comparison: its benchmark provider supports UTC only. Separate from original25; no startup or Hermes binding speed claim.',
      namedZoneRustFaster: namedZoneResults.filter(
        row => row.typescriptOverRust > 1
      ).length,
      namedZoneWorkloads: namedZoneResults.length,
      namedZoneResults,
    },
    null,
    2
  )
)

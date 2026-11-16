import assert from 'node:assert/strict'
import {readFileSync} from 'node:fs'
import {join} from 'node:path'
import {pathToFileURL} from 'node:url'
import {runfiles} from '@bazel/runfiles'

const resolve = value => runfiles.resolve(value)
const directory = resolve(process.argv[2])
const load = name => import(pathToFileURL(join(directory, name)).href)
const globalBefore = Object.getOwnPropertyDescriptor(globalThis, 'Temporal')
const {Temporal} = await load('index.js')
const {configureWasmBackend, createWasmQuery} = await load('wasm.js')
const module = new WebAssembly.Module(readFileSync(resolve(process.argv[3])))
const instance = new WebAssembly.Instance(module, {})
const query = createWasmQuery(instance)
const identity = Temporal.Instant
const existing = Temporal.Instant.fromEpochNanoseconds(0n)
configureWasmBackend(instance)
const calls = JSON.parse(query('{"op":"info"}')).calls
assert.equal(Temporal.Instant.from('1970-01-01T00:00Z').epochNanoseconds, 0n)
assert(
  JSON.parse(query('{"op":"info"}')).calls > calls,
  'Published entries must share active Rust backend'
)
assert.equal(Temporal.Instant, identity)
assert.equal(existing.add({nanoseconds: 1}).epochNanoseconds, 1n)
assert.deepEqual(
  Object.getOwnPropertyDescriptor(globalThis, 'Temporal'),
  globalBefore
)
const rows = path =>
  readFileSync(resolve(path), 'utf8')
    .trim()
    .split('\n')
    .filter(line => !line.startsWith('#'))
    .map(line => line.split('\t'))
const pad = (value, length = 2) => String(value).padStart(length, '0')
const limit = 8_640_000_000_000_000_000_000n
let fields = 0,
  rounds = 0,
  differences = 0
for (const row of rows(process.argv[4])) {
  const [milliseconds, year, month, day, hour, minute, second, millisecond] =
    row.map(Number)
  const epoch = BigInt(milliseconds) * 1_000_000n
  if (epoch < -limit || epoch > limit) continue
  const text =
    (year < 0
      ? '-' + pad(-year, 6)
      : year > 9999
        ? '+' + pad(year, 6)
        : pad(year, 4)) +
    `-${pad(month)}-${pad(day)}T${pad(hour)}:${pad(minute)}:${pad(second)}.${pad(millisecond, 3)}Z`
  assert.equal(
    Temporal.Instant.from(text).epochNanoseconds,
    epoch,
    row.join('\t')
  )
  assert.equal(
    Temporal.Instant.fromEpochNanoseconds(epoch).toString({
      fractionalSecondDigits: 3,
    }),
    text,
    row.join('\t')
  )
  const date = Temporal.Instant.fromEpochNanoseconds(epoch)
    .toZonedDateTimeISO('UTC')
    .toPlainDateTime()
  assert.deepEqual(
    [
      date.year,
      date.month,
      date.day,
      date.hour,
      date.minute,
      date.second,
      date.millisecond,
    ],
    row.slice(1).map(Number)
  )
  fields++
}
for (const [epoch, unit, increment, mode, expected] of rows(process.argv[5])) {
  assert.equal(
    Temporal.Instant.fromEpochNanoseconds(BigInt(epoch)).round({
      smallestUnit: unit,
      roundingIncrement: Number(increment),
      roundingMode: mode,
    }).epochNanoseconds,
    BigInt(expected)
  )
  rounds++
}
for (const [kind, value, unit, mode, expected] of rows(process.argv[6])) {
  const amount = BigInt(value)
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
    assert.equal(actual, BigInt(expected))
  }
  differences++
}
for (const value of ['\ud800', '\udfff', '1970-01-01T00:00Z[foo=\ud800]'])
  assert.throws(() => Temporal.Instant.from(value), RangeError)
assert.throws(
  () =>
    configureWasmBackend(
      new WebAssembly.Instance(
        new WebAssembly.Module(new Uint8Array([0, 97, 115, 109, 1, 0, 0, 0])),
        {}
      )
    ),
  TypeError
)
assert.equal(Temporal.Instant.from('1970-01-01T00:00Z').epochNanoseconds, 0n)

// Old ABI fixture exports the expected names; rejection must check its version.
const section = (id, body) => [id, body.length, ...body]
const exported = (name, kind) => [
  name.length,
  ...new TextEncoder().encode(name),
  kind,
  0,
]
const oldABI = new WebAssembly.Module(
  new Uint8Array([
    0,
    97,
    115,
    109,
    1,
    0,
    0,
    0,
    ...section(1, [1, 96, 0, 1, 127]),
    ...section(3, [1, 0]),
    ...section(5, [1, 0, 1]),
    ...section(7, [
      5,
      ...exported('memory', 2),
      ...exported('temporal_abi_version', 0),
      ...exported('temporal_alloc', 0),
      ...exported('temporal_free', 0),
      ...exported('temporal_query', 0),
    ]),
    ...section(10, [1, 4, 0, 65, 7, 11]),
  ])
)
assert.throws(
  () => configureWasmBackend(new WebAssembly.Instance(oldABI, {})),
  TypeError
)
assert.equal(Temporal.PlainTime.from('12:00').toJSON(), '12:00:00')

const beforeGrowth = query.memoryBytes
assert.equal(
  Temporal.Instant.from('1970-01-01T00:00Z[foo=' + 'a'.repeat(2_000_000) + ']')
    .epochNanoseconds,
  0n
)
assert(
  query.memoryBytes > beforeGrowth,
  'Exercise memory growth during request and response allocation'
)
const invalid = JSON.stringify({op: 'parseInstant', text: 'x'.repeat(250_000)})
for (let index = 0; index < 32; index++) assert.equal(query(invalid), 1)
const warmed = query.memoryBytes
for (let index = 0; index < 32; index++) assert.equal(query(invalid), 1)
assert.equal(
  query.memoryBytes,
  warmed,
  'Error paths must release request/output allocations'
)

const changes = [
  [TextEncoder.prototype, 'encode'],
  [TextDecoder.prototype, 'decode'],
  [Object.getPrototypeOf(Uint8Array.prototype), 'set'],
  [Object.getPrototypeOf(Uint8Array.prototype), 'length'],
  [DataView.prototype, 'getUint32'],
  [WebAssembly.Memory.prototype, 'buffer'],
].map(([object, key]) => [
  object,
  key,
  Object.getOwnPropertyDescriptor(object, key),
])
try {
  for (const [object, key, descriptor] of changes)
    Object.defineProperty(
      object,
      key,
      descriptor.get
        ? {
            configurable: true,
            get() {
              throw new Error('Poisoned WASM intrinsic')
            },
          }
        : {
            ...descriptor,
            value() {
              throw new Error('Poisoned WASM intrinsic')
            },
          }
    )
  assert.equal(
    Temporal.Instant.from('1970-01-01T00:00Z').toJSON(),
    '1970-01-01T00:00:00Z'
  )
} finally {
  for (const [object, key, descriptor] of changes)
    Object.defineProperty(object, key, descriptor)
}
const core = instance.exports
assert.equal(core.temporal_alloc(-1), 0)
const slot = core.temporal_alloc(8)
try {
  assert.equal(core.temporal_query(0, 1, slot), 2)
  assert.equal(new DataView(core.memory.buffer, slot, 8).getUint32(0, true), 0)
} finally {
  core.temporal_free(slot, 8)
}
console.log(
  JSON.stringify({
    fields,
    rounds,
    differences,
    memoryBytes: query.memoryBytes,
    backend: JSON.parse(query('{"op":"info"}')),
  })
)

const {checkPlainTimeOracle} = await import(
  pathToFileURL(resolve(process.argv[8])).href
)
console.log(
  JSON.stringify({
    plainTime: checkPlainTimeOracle(
      Temporal,
      rows(process.argv[4]),
      rows(process.argv[7]),
      rows(process.argv[6])
    ),
  })
)

const {checkPublicCalendarOracle} = await import(
  pathToFileURL(resolve(process.argv[9])).href
)
for (const path of process.argv.slice(10, 12)) {
  console.log(
    JSON.stringify({
      calendars: checkPublicCalendarOracle(
        Temporal,
        readFileSync(resolve(path), 'utf8'),
        (actual, expected, context) => assert.equal(actual, expected, context)
      ),
    })
  )
}

const {checkTimezoneOracle} = await import(
  pathToFileURL(resolve(process.argv[12])).href
)
console.log(
  JSON.stringify({
    timezones: checkTimezoneOracle(
      Temporal,
      readFileSync(resolve(process.argv[15]), 'utf8'),
      readFileSync(resolve(process.argv[13]), 'utf8'),
      readFileSync(resolve(process.argv[14]), 'utf8'),
      (actual, expected, context) => assert.equal(actual, expected, context)
    ),
  })
)

const {checkDurationOracle} = await import(
  pathToFileURL(resolve(process.argv[16])).href
)
console.log(
  JSON.stringify({
    duration: checkDurationOracle(
      Temporal,
      rows(process.argv[6]),
      readFileSync(resolve(process.argv[17]), 'utf8'),
      readFileSync(resolve(process.argv[18]), 'utf8'),
      (actual, expected, context) => assert.equal(actual, expected, context)
    ),
  })
)

const {checkPlainArithmeticOracle} = await import(
  pathToFileURL(resolve(process.argv[19])).href
)
console.log(
  JSON.stringify({
    plainArithmetic: checkPlainArithmeticOracle(
      Temporal,
      readFileSync(resolve(process.argv[20]), 'utf8'),
      rows(process.argv[7]),
      rows(process.argv[6]),
      (actual, expected, context) => assert.equal(actual, expected, context)
    ),
  })
)

const {checkZonedArithmeticOracle} = await import(
  pathToFileURL(resolve(process.argv[21])).href
)
console.log(
  JSON.stringify({
    zonedArithmetic: checkZonedArithmeticOracle(
      Temporal,
      readFileSync(resolve(process.argv[18]), 'utf8'),
      readFileSync(resolve(process.argv[22]), 'utf8'),
      (actual, expected, context) => assert.equal(actual, expected, context)
    ),
  })
)

const {checkStringOracle} = await import(
  pathToFileURL(resolve(process.argv[23])).href
)
console.log(
  JSON.stringify({
    strings: checkStringOracle(
      Temporal,
      rows(process.argv[4]),
      readFileSync(resolve(process.argv[13]), 'utf8'),
      (actual, expected, context) => assert.equal(actual, expected, context)
    ),
  })
)

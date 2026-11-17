import assert from 'node:assert/strict'
import {readFileSync, writeFileSync} from 'node:fs'
import {join} from 'node:path'
import {pathToFileURL} from 'node:url'
import {runfiles} from '@bazel/runfiles'

const resolve = value => runfiles.resolve(value)
const directory = resolve(process.argv[2])
const load = name => import(pathToFileURL(join(directory, name)).href)
const globalBefore = Object.getOwnPropertyDescriptor(globalThis, 'Temporal')
const dateBefore = Object.getOwnPropertyDescriptor(
  Date.prototype,
  'toTemporalInstant'
)
const requests = new Map()
let wireOperations = []
let scalarArgumentsSupported = true
const exportsDescriptor = Object.getOwnPropertyDescriptor(
  WebAssembly.Instance.prototype,
  'exports'
)
const memoryBuffer = Object.getOwnPropertyDescriptor(
  WebAssembly.Memory.prototype,
  'buffer'
).get
const decode = TextDecoder.prototype.decode
const decoder = new TextDecoder()
const parse = JSON.parse
const apply = Reflect.apply
const Bytes = Uint8Array
Object.defineProperty(WebAssembly.Instance.prototype, 'exports', {
  ...exportsDescriptor,
  get() {
    const core = apply(exportsDescriptor.get, this, [])
    if (typeof core.temporal_query !== 'function') return core
    let inputInfo = 0
    return {
      ...core,
      temporal_input(capacity) {
        inputInfo = core.temporal_input(capacity)
        return inputInfo
      },
      temporal_round_instant(...args) {
        if (!scalarArgumentsSupported)
          throw new TypeError('i64 WebAssembly arguments unavailable')
        const result = core.temporal_round_instant(...args)
        if (result !== -9223372036854775808n)
          requests.set('roundInstant', (requests.get('roundInstant') ?? 0) + 1)
        return result
      },
      temporal_exchange(length) {
        const buffer = apply(memoryBuffer, core.memory, [])
        const pointer = new Uint32Array(buffer, inputInfo, 2)[0]
        const operation = wireOperations[new Bytes(buffer, pointer, 1)[0]]
        const result = core.temporal_exchange(length)
        if (
          new Uint32Array(
            apply(memoryBuffer, core.memory, []),
            result,
            2
          )[0] === 0
        )
          requests.set(operation, (requests.get(operation) ?? 0) + 1)
        return result
      },
      temporal_query(pointer, length, output) {
        let operation
        try {
          const bytes = new Bytes(
            apply(memoryBuffer, core.memory, []),
            pointer,
            length
          )
          operation = parse(apply(decode, decoder, [bytes])).op
        } catch {
          // Malformed requests still reach Rust.
        }
        const status = core.temporal_query(pointer, length, output)
        if (status === 0 && typeof operation === 'string')
          requests.set(operation, (requests.get(operation) ?? 0) + 1)
        return status
      },
    }
  },
})
const wasm = await load('wasm.js')
wireOperations = wasm.wasmOperations
const nativeData = process.env.FORMATJS_TEMPORAL_NATIVE_DATA_ONLY === '1'
const configureWasmBackend = nativeData
  ? (await load('wasm-native.js')).configureTemporalWasm
  : wasm.configureWasmBackend
const {createWasmQuery} = wasm
const module = new WebAssembly.Module(readFileSync(resolve(process.argv[3])))
const instance = new WebAssembly.Instance(module, {})
const Temporal = nativeData
  ? configureWasmBackend(instance)
  : (await load('index.js')).Temporal
const query = createWasmQuery(instance)
Object.defineProperty(
  WebAssembly.Instance.prototype,
  'exports',
  exportsDescriptor
)
const firstCall = wasm.createWasmCall(instance)
const secondCall = wasm.createWasmCall(instance)
scalarArgumentsSupported = false
const bufferedRound = wasm.createWasmCall(instance)
scalarArgumentsSupported = true
assert.equal(bufferedRound.roundInstantUnit(1n, 'nanosecond', 1, 'trunc'), 1n)

assert.equal(firstCall('parseInstant', {text: '1970-01-01T00:00Z'}), '0')
assert.throws(
  () => secondCall('parseInstant', {text: 'x'.repeat(250000)}),
  RangeError
)
assert.equal(
  firstCall('parseInstant', {text: '1970-01-01T00:00Z'}),
  '0',
  'Adapters share the current buffer descriptor after another adapter grows storage'
)
assert.deepEqual(
  JSON.parse(query('{"op":"info"}')).binaryStrings,
  wasm.wasmStrings
)
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
const inheritedHour = Object.getOwnPropertyDescriptor(Object.prototype, 'hour')
let dateTimeWithInheritedSetter
try {
  Object.defineProperty(Object.prototype, 'hour', {
    configurable: true,
    set() {
      throw new Error('Temporal must not invoke inherited clock setters')
    },
  })
  dateTimeWithInheritedSetter = Temporal.PlainDateTime.from(
    '2000-02-29T12:34:56.123456789'
  )
} finally {
  if (inheritedHour)
    Object.defineProperty(Object.prototype, 'hour', inheritedHour)
  else delete Object.prototype.hour
}
assert.equal(dateTimeWithInheritedSetter.hour, 12)
for (const name of ['era', 'eraYear']) {
  const inherited = Object.getOwnPropertyDescriptor(Object.prototype, name)
  try {
    Object.defineProperty(Object.prototype, name, {
      configurable: true,
      get() {
        throw new Error('Temporal must not read inherited era fields')
      },
    })
    assert.equal(Temporal.PlainDate.from('2000-02-29')[name], undefined)
    assert.equal(
      Temporal.PlainDateTime.from('2000-02-29T12:34:56')[name],
      undefined
    )
  } finally {
    if (inherited) Object.defineProperty(Object.prototype, name, inherited)
    else delete Object.prototype[name]
  }
}
const clockForInterop = Temporal.PlainTime.from('23:59:59.999999999')
const dateTimeForInterop = Temporal.PlainDateTime.from('2000-02-29T12:00')
const originalWeakMapGet = WeakMap.prototype.get
let combinedClock
try {
  WeakMap.prototype.get = () => {
    throw new Error('Temporal must use captured slot lookups')
  }
  combinedClock = dateTimeForInterop.withPlainTime(clockForInterop)
} finally {
  WeakMap.prototype.get = originalWeakMapGet
}
assert.equal(combinedClock.toString(), '2000-02-29T23:59:59.999999999')
const signedBoundary = 9223372036854775800n
for (const [value, expected] of [
  [signedBoundary + 7n, signedBoundary + 10n],
  [signedBoundary + 8n, signedBoundary + 10n],
  [-signedBoundary - 8n, -signedBoundary],
  [-signedBoundary - 9n, -signedBoundary],
  [8640000000000000000000n, 8640000000000000000000n],
  [-8640000000000000000000n, -8640000000000000000000n],
])
  assert.equal(
    Temporal.Instant.fromEpochNanoseconds(value).round({
      smallestUnit: 'nanosecond',
      roundingIncrement: 10,
      roundingMode: 'ceil',
    }).epochNanoseconds,
    expected
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
    ...section(10, [1, 4, 0, 65, 8, 11]),
  ])
)
assert.throws(
  () => configureWasmBackend(new WebAssembly.Instance(oldABI, {})),
  TypeError
)
assert.equal(Temporal.PlainTime.from('12:00').toJSON(), '12:00:00')

const clockBeforeGrowth = Temporal.PlainTime.from('23:59:59.999999999')
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
assert.deepEqual(
  [
    clockBeforeGrowth.hour,
    clockBeforeGrowth.minute,
    clockBeforeGrowth.second,
    clockBeforeGrowth.millisecond,
    clockBeforeGrowth.microsecond,
    clockBeforeGrowth.nanosecond,
  ],
  [23, 59, 59, 999, 999, 999],
  'Clock results survive later WASM calls and memory growth'
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
  [TextEncoder.prototype, 'encodeInto'],
  [TextDecoder.prototype, 'decode'],
  [Object.getPrototypeOf(Uint8Array.prototype), 'set'],
  [Object.getPrototypeOf(Uint8Array.prototype), 'length'],
  [DataView.prototype, 'getUint32'],
  [DataView.prototype, 'getBigInt64'],
  [DataView.prototype, 'getBigUint64'],
  [DataView.prototype, 'setBigInt64'],
  [DataView.prototype, 'setFloat64'],
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
  assert.equal(
    Temporal.Instant.from('1970-01-01T00:00Z').add({nanoseconds: 1})
      .epochNanoseconds,
    1n
  )
} finally {
  for (const [object, key, descriptor] of changes)
    Object.defineProperty(object, key, descriptor)
}
const arrayIterator = Array.prototype[Symbol.iterator]
let durationWithPoisonedIterator
let zonedWithPoisonedIterator
try {
  Array.prototype[Symbol.iterator] = function () {
    throw new Error('Temporal duration fields must not use array iteration')
  }
  durationWithPoisonedIterator = Temporal.Instant.fromEpochNanoseconds(0n).add({
    hours: 1,
    nanoseconds: 1,
  }).epochNanoseconds
  zonedWithPoisonedIterator = Temporal.ZonedDateTime.from(
    '1970-01-01T00:00:00.123456789[+05:45]'
  ).epochNanoseconds
} finally {
  Array.prototype[Symbol.iterator] = arrayIterator
}
assert.equal(durationWithPoisonedIterator, 3_600_000_000_001n)
assert.equal(zonedWithPoisonedIterator, -20_699_876_543_211n)
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

const {checkDateOutputOracle} = await import(
  pathToFileURL(resolve(process.argv[24])).href
)
console.log(
  JSON.stringify({
    dateOutput: checkDateOutputOracle(
      Temporal,
      readFileSync(resolve(process.argv[25]), 'utf8'),
      (actual, expected, context) => assert.equal(actual, expected, context)
    ),
  })
)

if (nativeData) {
  const map = JSON.parse(
    readFileSync(join(directory, 'wasm-native.js.map'), 'utf8')
  )
  assert(
    map.sources.length > 0,
    'Native facade sourcemap must identify its modules'
  )
  assert(
    !map.sources.some(source =>
      /@formatjs_generated[+/](?:icu\.calendar|tz)/.test(source)
    ),
    'Native facade must not ship TypeScript calendar or timezone tables'
  )
  const {installTemporalWasm} = await load('wasm-native.js')
  try {
    assert.throws(
      () => installTemporalWasm(new WebAssembly.Instance(oldABI, {}), true),
      TypeError
    )
    assert.deepEqual(
      Object.getOwnPropertyDescriptor(globalThis, 'Temporal'),
      globalBefore
    )
    installTemporalWasm(instance, true)
    assert.equal(globalThis.Temporal, Temporal)
    assert(new Date(1).toTemporalInstant() instanceof Temporal.Instant)
  } finally {
    if (globalBefore)
      Object.defineProperty(globalThis, 'Temporal', globalBefore)
    else Reflect.deleteProperty(globalThis, 'Temporal')
    if (dateBefore)
      Object.defineProperty(Date.prototype, 'toTemporalInstant', dateBefore)
    else Reflect.deleteProperty(Date.prototype, 'toTemporalInstant')
  }
}

const countRequests = () =>
  [...requests.values()].reduce((sum, value) => sum + value, 0)
const preparedDate = Temporal.PlainDate.from('2024-02-28')
const afterDateParse = countRequests()
assert.deepEqual(
  [
    preparedDate.year,
    preparedDate.month,
    preparedDate.monthCode,
    preparedDate.day,
    preparedDate.daysInMonth,
    preparedDate.monthsInYear,
    preparedDate.daysInYear,
    preparedDate.dayOfYear,
  ],
  [2024, 2, 'M02', 28, 29, 12, 366, 59]
)
assert.equal(
  countRequests(),
  afterDateParse,
  'Date getters reuse the complete Rust parse result'
)
const addedDate = preparedDate.add({days: 1})
assert.equal(
  countRequests(),
  afterDateParse + 1,
  'Date addition executes one Rust operation'
)
const afterDateAdd = countRequests()
assert.deepEqual(
  [addedDate.year, addedDate.month, addedDate.day, addedDate.daysInYear],
  [2024, 2, 29, 366]
)
assert.equal(
  countRequests(),
  afterDateAdd,
  'Date getters reuse the complete Rust addition result'
)
assert.deepEqual(
  JSON.parse(query('{"op":"info"}')).operations,
  wireOperations,
  'Binary operation identifiers match the Rust dispatcher'
)

for (const [source, fields, expected] of [
  [Temporal.PlainDate.from('2024-02-28'), {day: 29}, '2024-02-29'],
  [Temporal.PlainYearMonth.from('2024-02'), {month: 3}, '2024-03'],
  [Temporal.PlainMonthDay.from('02-28'), {day: 29}, '02-29'],
  [
    Temporal.PlainDateTime.from('2024-02-28T12:30'),
    {day: 29, hour: 20},
    '2024-02-29T20:30:00',
  ],
  [
    Temporal.ZonedDateTime.from('2024-03-09T12:30-05:00[America/New_York]'),
    {day: 10},
    '2024-03-10T12:30:00-04:00[America/New_York]',
  ],
]) {
  const before = countRequests(),
    beforeOperations = new Map(requests),
    result = source.with(fields)
  assert.equal(
    countRequests(),
    before + 1,
    'with-fields is one complete Rust operation: ' +
      source[Symbol.toStringTag] +
      ' ' +
      JSON.stringify(
        [...requests]
          .map(([op, count]) => [op, count - (beforeOperations.get(op) || 0)])
          .filter(([, count]) => count)
      )
  )
  const beforeGetters = countRequests()
  assert.equal(result.monthCode, expected.startsWith('2024-03') ? 'M03' : 'M02')
  if (
    result instanceof Temporal.PlainDateTime ||
    result instanceof Temporal.ZonedDateTime
  ) {
    assert.equal(result.minute, 30)
    assert.equal(result.second, 0)
  }
  if (result instanceof Temporal.ZonedDateTime) {
    assert.equal(result.offset, '-04:00')
    assert.equal(result.hoursInDay, 23)
  }
  assert.equal(
    countRequests(),
    beforeGetters,
    'Complete results cover calendar, clock and zone getters'
  )
  assert.equal(result.toString(), expected)
}

for (const calendar of ['iso8601', 'gregory']) {
  const result = Temporal.ZonedDateTime.from(
    '1970-01-01T00:00:00.123456789[utc][u-ca=' + calendar + ']'
  )
  const before = countRequests()
  assert.deepEqual(
    [
      result.epochNanoseconds,
      result.timeZoneId,
      result.calendarId,
      result.year,
      result.month,
      result.monthCode,
      result.day,
      result.hour,
      result.minute,
      result.second,
      result.millisecond,
      result.microsecond,
      result.nanosecond,
      result.dayOfWeek,
      result.dayOfYear,
      result.daysInWeek,
      result.daysInMonth,
      result.daysInYear,
      result.monthsInYear,
      result.inLeapYear,
      result.offset,
      result.offsetNanoseconds,
      result.hoursInDay,
      result.era,
      result.eraYear,
    ],
    [
      123456789n,
      'UTC',
      calendar,
      1970,
      1,
      'M01',
      1,
      0,
      0,
      0,
      123,
      456,
      789,
      4,
      1,
      7,
      31,
      365,
      12,
      false,
      '+00:00',
      0,
      24,
      calendar === 'gregory' ? 'ce' : undefined,
      calendar === 'gregory' ? 1970 : undefined,
    ]
  )
  assert.equal(
    countRequests(),
    before,
    'Parsed results contain all Rust fields'
  )
}
assert.equal(
  Temporal.ZonedDateTime.from('1970-01-01T00:00[us/eastern]').timeZoneId,
  'US/Eastern'
)
for (const input of [
  '1970-01-01T00:00[UTC][u-ca=invalid]',
  '1970-01-01T00:00[Invalid/Zone]',
  '1970-01-01T00:00[UTC]',
]) {
  const reads = []
  const options = new Proxy(
    {},
    {
      get(_target, key) {
        reads.push(key)
        return undefined
      },
    }
  )
  if (input.includes('invalid') || input.includes('Invalid')) {
    assert.throws(() => Temporal.ZonedDateTime.from(input, options), RangeError)
    assert.deepEqual(reads, [])
  } else {
    Temporal.ZonedDateTime.from(input, options)
    assert.deepEqual(reads, ['disambiguation', 'offset', 'overflow'])
  }
}

const historical = Temporal.ZonedDateTime.from({
  year: 1971,
  month: 1,
  day: 1,
  hour: 12,
  timeZone: 'Africa/Monrovia',
})
assert.equal(historical.offset, '-00:44:30')
assert.equal(historical.offsetNanoseconds, -2670000000000)
assert(historical.toString().includes('-00:45[Africa/Monrovia]'))
assert.equal(
  Temporal.ZonedDateTime.from('1900-01-01T12:00[Asia/Kathmandu]').offset,
  '+05:41:16'
)
const gregorianMonthDay = Temporal.PlainMonthDay.from({
  year: 2021,
  month: 1,
  day: 15,
  calendar: 'gregory',
})
assert.throws(() => gregorianMonthDay.with({month: 12}), TypeError)
assert.equal(gregorianMonthDay.with({monthCode: 'M12'}).monthCode, 'M12')
assert.equal(gregorianMonthDay.with({month: 12, year: 2021}).monthCode, 'M12')

const eraDate = Temporal.PlainDate.from('2024-02-28[u-ca=gregory]')
assert.throws(() => eraDate.with({eraYear: 2025}), TypeError)
assert.throws(
  () => eraDate.with({era: 'ce', month: 2, monthCode: 'M03'}),
  TypeError
)
assert.throws(
  () => eraDate.with({era: 'ce', eraYear: 2025, month: 2, monthCode: 'M03'}),
  RangeError
)

const duration = Temporal.Duration.from('P1DT1H')
assert.equal(duration.add('PT23H').toString(), 'P2D')
assert.equal(duration.subtract('PT25H').toString(), 'PT0S')
assert.equal(duration.negated().toString(), '-P1DT1H')
assert.equal(duration.negated().abs().toString(), duration.toString())

const operations = JSON.parse(query('{"op":"info"}')).operations.sort()
const primitiveOperations = [
  'timeZonePossibleInstants',
  'hoursInZonedDay',
  'timeZoneOffset',
  'calendarEra',
  'calendarMonthsInYear',
  'validateDuration',
  'addISODays',
  'calendarAdd',
  'calendarMonthSerial',
  'calendarUntil',
]
const publicOperations = new Map(requests)
assert.deepEqual(
  operations.filter(
    op => !primitiveOperations.includes(op) && !publicOperations.has(op)
  ),
  [],
  'Public corpus must successfully execute every facade operation'
)

// Higher-level Rust routes bypass these lower-level adapter operations.
const {configureNativeTemporal, nativeTemporal} = await load('native.js')
configureNativeTemporal(query)
const primitives = nativeTemporal()
const springDay = Temporal.ZonedDateTime.from(
  '2024-03-10T00:00-05:00[America/New_York]'
)
const springSlot = {
  epochNanoseconds: springDay.epochNanoseconds,
  calendar: 'iso8601',
  timeZone: 'America/New_York',
}
assert.equal(
  primitives.timeZonePossibleInstants('America/New_York', {
    year: 2024,
    month: 3,
    day: 10,
    hour: 0,
    minute: 0,
    second: 0,
    millisecond: 0,
    microsecond: 0,
    nanosecond: 0,
  }).length,
  1
)
assert.equal(primitives.hoursInZonedDay(springSlot), 23)
assert.equal(
  primitives.timeZoneOffset('America/New_York', springDay.epochNanoseconds),
  -18000000000000n
)
assert.deepEqual(primitives.calendarEra('gregory', 0), {
  era: 'ce',
  eraYear: 1970,
})
assert.equal(primitives.calendarMonthsInYear('hebrew', 5784), 13)
primitives.validateDuration({
  years: 0,
  months: 0,
  weeks: 0,
  days: 0,
  hours: 1,
  minutes: 0,
  seconds: 0,
  milliseconds: 0,
  microseconds: 0,
  nanoseconds: 0,
})
const dayRow = rows(process.argv[20]).find(
  row =>
    [1, 2, 3, 5].every(index => +row[index] === 0) &&
    +row[4] !== 0 &&
    BigInt(row[6]) >= -limit &&
    BigInt(row[6]) <= limit
)
assert(dayRow, 'Independent ICU day-addition control')
assert.equal(
  primitives.isoToEpochNanoseconds(
    primitives.addISODays(
      primitives.epochNanosecondsToISO(BigInt(dayRow[0])),
      +dayRow[4]
    )
  ),
  BigInt(dayRow[6])
)
const calendarIds = new Set(),
  additions = new Set(),
  serials = new Set(),
  untils = new Set()
for (const path of process.argv.slice(10, 12)) {
  for (const row of rows(path)) {
    const [kind, calendar] = row
    calendarIds.add(calendar)
    if (kind === 'D' && !untils.has(calendar)) {
      const result = primitives.calendarUntil(
        calendar,
        +row[2],
        +row[3],
        row[4]
      )
      for (const [index, unit] of [
        'years',
        'months',
        'weeks',
        'days',
      ].entries())
        assert.equal(result[unit] ?? 0, +row[index + 5], row.join('\t'))
      untils.add(calendar)
    }
    if (
      kind !== 'A' ||
      (additions.has(calendar) && (row[3] !== 'month' || serials.has(calendar)))
    )
      continue
    const fields = primitives.calendarFromEpochDay(calendar, +row[2])
    const result = primitives.calendarAdd(
      calendar,
      fields,
      {[row[3] + 's']: +row[4]},
      'constrain'
    )
    assert.equal(
      primitives.calendarToEpochDay(calendar, result, 'reject'),
      +row[5],
      row.join('\t')
    )
    additions.add(calendar)
    if (row[3] === 'month') {
      assert.equal(
        primitives.calendarMonthSerial(calendar, result.year, result.month) -
          primitives.calendarMonthSerial(calendar, fields.year, fields.month),
        +row[4],
        row.join('\t')
      )
      serials.add(calendar)
    }
  }
}
for (const covered of [additions, serials, untils])
  assert.deepEqual(covered, calendarIds)
assert.deepEqual(
  [...requests.keys()].filter(op => operations.includes(op)).sort(),
  operations,
  'Public and primitive oracle corpora must execute every declared Rust operation'
)
if (process.env.TEST_UNDECLARED_OUTPUTS_DIR)
  writeFileSync(
    join(
      process.env.TEST_UNDECLARED_OUTPUTS_DIR,
      'native-operation-coverage.json'
    ),
    JSON.stringify(
      {
        nativeData,
        publicOperations: Object.fromEntries(
          operations
            .filter(op => publicOperations.has(op))
            .map(op => [op, publicOperations.get(op)])
        ),
        primitiveOperations,
        operations: Object.fromEntries(
          operations.map(op => [op, requests.get(op)])
        ),
      },
      null,
      2
    ) + '\n'
  )

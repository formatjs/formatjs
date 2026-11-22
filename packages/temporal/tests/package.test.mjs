import assert from 'node:assert/strict'
import {spawnSync} from 'node:child_process'
import {join} from 'node:path'
import {pathToFileURL} from 'node:url'
import {runfiles} from '@bazel/runfiles'
import {Temporal as reference} from 'temporal-polyfill/implementation'

const directory = runfiles.resolve(process.argv[2])
const standalone = spawnSync(
  process.execPath,
  [
    '--input-type=module',
    '--eval',
    `
  import assert from 'node:assert/strict'
  globalThis.Intl = undefined
  const {Temporal} = await import(${JSON.stringify(pathToFileURL(join(directory, 'standalone.js')).href)})
  assert.equal(Temporal.PlainDate.from('2023-03-22').withCalendar('chinese').monthCode, 'M02L')
  assert.equal(Temporal.PlainDate.from('2024-03-11').withCalendar('islamic-umalqura').day, 1)
  assert.equal(Temporal.ZonedDateTime.from('2020-03-07T12:00-05:00[America/New_York]').add({days: 1}).toString(), '2020-03-08T12:00:00-04:00[America/New_York]')
`,
  ],
  {encoding: 'utf8'}
)
assert.equal(standalone.status, 0, standalone.stderr)
const load = name => import(pathToFileURL(join(directory, name)).href)
const nativeDateTimeFormat = Intl.DateTimeFormat
const before = Object.getOwnPropertyDescriptor(globalThis, 'Temporal')
const dateBefore = Object.getOwnPropertyDescriptor(
  Date.prototype,
  'toTemporalInstant'
)
const owned = await load('index.js')
const otherEntry = await load('standalone.js')
const epoch = 1_234_567_890_123_456_789n
for (const [source, target] of [
  [owned.Temporal, otherEntry.Temporal],
  [otherEntry.Temporal, owned.Temporal],
]) {
  const foreignInstant = source.Instant.fromEpochNanoseconds(epoch)
  const foreignZoned = new source.ZonedDateTime(epoch, '+00:00', 'gregory')
  for (const value of [foreignInstant, foreignZoned]) {
    const trace = []
    Object.setPrototypeOf(value, null)
    Object.defineProperty(value, Symbol.toPrimitive, {
      get() {
        trace.push(Symbol.toPrimitive)
        throw new Error('Unexpected conversion')
      },
    })
    Object.freeze(value)
    const copy = target.Instant.from(value)
    assert.notEqual(copy, value)
    assert.equal(Object.getPrototypeOf(copy), target.Instant.prototype)
    assert.equal(copy.epochNanoseconds, epoch)
    assert.deepEqual(trace, [])

    const hooks = []
    const proxy = new Proxy(value, {
      get(_, key) {
        hooks.push(key)
        throw new Error('Expected conversion')
      },
    })
    assert.throws(() => target.Instant.from(proxy), /Expected conversion/)
    assert.deepEqual(hooks, [Symbol.toPrimitive])
  }

  const prototype = {}
  const trace = []
  const newTarget = new Proxy(function () {}, {
    get(target, key, receiver) {
      trace.push(key)
      return key === 'prototype'
        ? prototype
        : Reflect.get(target, key, receiver)
    },
  })
  const epochInput = {
    [Symbol.toPrimitive](hint) {
      trace.push(hint)
      return epoch
    },
  }
  const custom = Reflect.construct(
    source.ZonedDateTime,
    [epochInput, 'America/New_York', 'gregory'],
    newTarget
  )
  assert.deepEqual(trace, ['number', 'prototype'])
  assert.equal(Object.getPrototypeOf(custom), prototype)
  assert.equal(target.Instant.from(custom).epochNanoseconds, epoch)

  trace.length = 0
  assert.throws(
    () =>
      Reflect.construct(
        source.ZonedDateTime,
        [epochInput, '+00:00', 'unknown'],
        newTarget
      ),
    RangeError
  )
  assert.deepEqual(trace, ['number'])
}
assert.deepEqual(
  Object.getOwnPropertyDescriptor(globalThis, 'Temporal'),
  before
)
assert.deepEqual(
  Object.getOwnPropertyDescriptor(Date.prototype, 'toTemporalInstant'),
  dateBefore
)
Object.defineProperty(globalThis, 'Temporal', {
  value: reference,
  configurable: true,
  writable: true,
})
Reflect.deleteProperty(Date.prototype, 'toTemporalInstant')
await load('polyfill.js')
assert.equal(globalThis.Temporal, reference)
assert(new Date(1).toTemporalInstant() instanceof reference.Instant)
await load('polyfill-force.js')
assert.equal(globalThis.Temporal, owned.Temporal)
assert.equal(Date.prototype.toTemporalInstant, owned.toTemporalInstant)
const value = new Date(1).toTemporalInstant()
assert(value instanceof owned.Instant)
assert(
  owned.Instant.prototype.equals.call(value, new owned.Instant(1_000_000n))
)
assert(Temporal.Now.instant() instanceof owned.Instant)
await load('polyfill-force.js')
assert.equal(globalThis.Temporal, owned.Temporal)
assert.equal(Date.prototype.toTemporalInstant, owned.toTemporalInstant)
const {shouldPolyfill} = await load('should-polyfill.js')
assert.equal(shouldPolyfill(), false)

const dateFormatter = new Intl.DateTimeFormat('en', {
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
  timeZone: 'UTC',
})
const firstDate = new owned.PlainDate(2020, 2, 3)
const lastDate = new owned.PlainDate(2020, 2, 5)
assert.equal(dateFormatter.format(firstDate), '02/03/2020')
assert.deepEqual(dateFormatter.formatToParts(firstDate), [
  {type: 'month', value: '02'},
  {type: 'literal', value: '/'},
  {type: 'day', value: '03'},
  {type: 'literal', value: '/'},
  {type: 'year', value: '2020'},
])
assert.equal(
  dateFormatter.formatRange(firstDate, lastDate),
  dateFormatter.formatRange(Date.UTC(2020, 1, 3), Date.UTC(2020, 1, 5))
)
assert.deepEqual(
  dateFormatter.formatRangeToParts(firstDate, lastDate),
  dateFormatter.formatRangeToParts(Date.UTC(2020, 1, 3), Date.UTC(2020, 1, 5))
)
assert.throws(() => dateFormatter.formatRange(firstDate, 0), TypeError)
assert.throws(
  () => dateFormatter.formatRange(firstDate, new owned.PlainTime(1)),
  TypeError
)
assert.throws(
  () => dateFormatter.format(new owned.ZonedDateTime(0n, 'UTC')),
  TypeError
)
assert.equal(dateFormatter.format, dateFormatter.format)
assert.equal(
  Object.prototype.toString.call(dateFormatter),
  '[object Intl.DateTimeFormat]'
)
assert(dateFormatter instanceof Intl.DateTimeFormat)
assert.equal(dateFormatter.constructor, Intl.DateTimeFormat)
let conversions = 0
const options = {
  year: {
    toString() {
      conversions++
      return 'numeric'
    },
  },
}
const snapshotFormatter = new Intl.DateTimeFormat('en', options)
assert.equal(conversions, 1)
options.year = '2-digit'
assert.equal(snapshotFormatter.format(firstDate), '2020')
assert.equal(snapshotFormatter.format(firstDate), '2020')
assert.equal(conversions, 1)
let numericConversions = 0
dateFormatter.format({
  valueOf() {
    numericConversions++
    return 0
  },
})
assert.equal(numericConversions, 1)
assert.throws(
  () =>
    dateFormatter.format({
      [Symbol.toStringTag]: 'Temporal.PlainDate',
      valueOf() {
        throw new SyntaxError('coercion')
      },
    }),
  SyntaxError
)
assert.equal(
  dateFormatter.formatRange(new owned.Instant(1n), new owned.Instant(0n)),
  dateFormatter.format(0)
)
let localeConversions = 0
assert.equal(
  firstDate.toLocaleString('en', {
    year: {
      toString() {
        localeConversions++
        return 'numeric'
      },
    },
  }),
  '2020'
)
assert.equal(localeConversions, 1)

const nativeResolvedOptions = nativeDateTimeFormat.prototype.resolvedOptions
const nativeFormatToParts = nativeDateTimeFormat.prototype.formatToParts
try {
  nativeDateTimeFormat.prototype.resolvedOptions = () => {
    throw new Error('replaced resolvedOptions')
  }
  nativeDateTimeFormat.prototype.formatToParts = () => {
    throw new Error('replaced formatToParts')
  }
  assert.equal(
    new Intl.DateTimeFormat('en', {year: 'numeric'}).format(firstDate),
    '2020'
  )
  assert.equal(
    new owned.PlainYearMonth(2020, 2, 'gregory').toLocaleString('en', {
      dateStyle: 'full',
    }),
    'February 2020'
  )
} finally {
  nativeDateTimeFormat.prototype.resolvedOptions = nativeResolvedOptions
  nativeDateTimeFormat.prototype.formatToParts = nativeFormatToParts
}

const temporalFormatter = new Intl.DateTimeFormat('en', {
  calendar: 'iso8601',
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
  hour: '2-digit',
})
const temporalDateTime = new owned.PlainDateTime(2020, 2, 3, 4, 5, 6)
const regexpStatics = () => [
  RegExp.input,
  RegExp.lastMatch,
  RegExp.lastParen,
  RegExp.leftContext,
  RegExp.rightContext,
  ...Array.from({length: 9}, (_, index) => RegExp[`$${index + 1}`]),
]
for (const format of [
  () => temporalFormatter.format(temporalDateTime),
  () => temporalFormatter.formatToParts(temporalDateTime),
  () => temporalFormatter.formatRange(temporalDateTime, temporalDateTime),
  () =>
    temporalFormatter.formatRangeToParts(temporalDateTime, temporalDateTime),
]) {
  ;/(sentinel)/.exec('before sentinel after')
  const before = regexpStatics()
  format()
  assert.deepEqual(regexpStatics(), before)
}

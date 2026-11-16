import assert from 'node:assert/strict'
import {join} from 'node:path'
import {pathToFileURL} from 'node:url'
import {runfiles} from '@bazel/runfiles'
import {Temporal as reference} from 'temporal-polyfill/implementation'

const directory = runfiles.resolve(process.argv[2])
const load = name => import(pathToFileURL(join(directory, name)).href)
const nativeDateTimeFormat = Intl.DateTimeFormat
const before = Object.getOwnPropertyDescriptor(globalThis, 'Temporal')
const dateBefore = Object.getOwnPropertyDescriptor(
  Date.prototype,
  'toTemporalInstant'
)
const owned = await load('index.js')
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

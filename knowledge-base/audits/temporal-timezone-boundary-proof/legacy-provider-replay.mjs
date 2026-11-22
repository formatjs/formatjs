import assert from 'node:assert/strict'
import {createHash} from 'node:crypto'
import {readFileSync} from 'node:fs'
import {registerHooks} from 'node:module'
import {resolve} from 'node:path'
import {pathToFileURL} from 'node:url'

const [mode, formatterPackage, temporalPackage, localeMatcher, memoize] =
  process.argv.slice(2)
const load = (directory, file) =>
  import(pathToFileURL(resolve(directory, file)).href)
const native = Intl.DateTimeFormat

if (mode === 'legacy') {
  for (const [file, hash] of [
    [
      'polyfill-force.js',
      '6b0cf18a501f61f6ef5c63de741ea1e0b41b006c39c2d86c2d68f697001ac34f',
    ],
    [
      'index.js',
      '1dcd6ab11ec9f951c77fcb941850b1edead7ed1ff48e856f77fa8ccd831a2005',
    ],
    [
      'locale-data/en.js',
      'ae2440a6911c42179833ade1c4a10bfc87c8411b1569e0553386e7a61a196cd2',
    ],
  ]) {
    const bytes = readFileSync(resolve(formatterPackage, file))
    assert.equal(createHash('sha256').update(bytes).digest('hex'), hash, file)
  }
} else {
  assert.equal(mode, 'owned')
  const packages = new Map([
    ['@formatjs/intl-localematcher', localeMatcher],
    ['@formatjs/fast-memoize', memoize],
  ])
  registerHooks({
    resolve(specifier, context, next) {
      const directory = packages.get(specifier)
      return next(
        directory
          ? pathToFileURL(resolve(directory, 'index.js')).href
          : specifier,
        context
      )
    },
  })
}
const installation = await load(formatterPackage, 'polyfill-force.js')
await load(formatterPackage, 'locale-data/en.js')
const formatter = Intl.DateTimeFormat
assert.notEqual(formatter, native)
const ponyfill =
  mode === 'legacy'
    ? (await load(formatterPackage, 'index.js')).DateTimeFormat
    : undefined
const initialData = formatter.tzData
if (ponyfill) {
  assert.deepEqual(Object.keys(installation), [])
  assert.notEqual(ponyfill, formatter)
  assert.notEqual(
    ponyfill.prototype.formatToParts,
    formatter.prototype.formatToParts
  )
  assert.deepEqual(Reflect.ownKeys(formatter.prototype.formatToParts), [
    'length',
    'name',
  ])
  assert.deepEqual(Object.getOwnPropertyDescriptor(formatter, 'tzData'), {
    value: initialData,
    writable: true,
    enumerable: true,
    configurable: true,
  })
  assert.notEqual(ponyfill.tzData, initialData)
}
const ownsQuery =
  typeof Object.getOwnPropertyDescriptor(
    formatter.prototype.formatToParts,
    Symbol.for('@formatjs/intl-datetimeformat/checkTemporalCandidates')
  )?.value === 'function'
assert.equal(ownsQuery, mode === 'owned')

const second = 1_000_000_000n
const hour = 3_600n
const max = 8_640_000_000_000n
const packed = (at, index) =>
  `${at === null ? '' : at.toString(36)},0,${index},0`
const fold = 'America/Phoenix'
const gap = 'America/Boise'
const upper = 'America/New_York'
const lower = 'America/Denver'
formatter.__addTZData({
  abbrvs: 'TEST',
  offsets: '0|xc0|b40|5k0',
  zones: [
    `${fold}|${packed(null, 0)}|${packed(0n, 1)}|${packed(6n * hour, 0)}`,
    `${gap}|${packed(null, 0)}|${packed(0n, 2)}|${packed(6n * hour, 0)}`,
    `${upper}|${packed(null, 3)}|${packed(max + 900n, 0)}`,
    `${lower}|${packed(null, 3)}|${packed(-max - 900n, 0)}`,
  ],
})
if (ponyfill) {
  assert.notEqual(formatter.tzData, initialData)
  assert.equal(Object.hasOwn(ponyfill.tzData, fold), false)

  const clipped = new formatter('en', {timeZone: upper})
  const maxMs = Number(max) * 1000
  for (const method of ['format', 'formatToParts']) {
    assert.throws(() => clipped[method](maxMs + 1), RangeError)
    assert.throws(() => clipped[method](-maxMs - 1), RangeError)
    assert.throws(() => clipped[method](0n), TypeError)
  }
  for (const method of ['formatRange', 'formatRangeToParts']) {
    assert.throws(() => clipped[method](maxMs, maxMs + 1), RangeError)
    assert.throws(() => clipped[method](-maxMs - 1, -maxMs), RangeError)
    assert.throws(() => clipped[method](0n, 1n), TypeError)
  }
  for (const outside of [max * second + 1n, -max * second - 1n]) {
    assert.throws(
      () => globalThis.Temporal.Instant.fromEpochNanoseconds(outside),
      RangeError
    )
    assert.throws(
      () => new globalThis.Temporal.ZonedDateTime(outside, upper),
      RangeError
    )
  }
}
const offset = (timeZone, t) => {
  const label = new formatter('en', {timeZone, timeZoneName: 'longOffset'})
    .formatToParts(Number(t) * 1000)
    .find(part => part.type === 'timeZoneName').value
  if (label === 'GMT') return 0
  const match = /^GMT([+-])(\d{1,2})(?::(\d{2}))?$/.exec(label)
  assert.ok(match, label)
  return (
    (match[1] === '-' ? -1 : 1) *
    (Number(match[2]) * 3600 + Number(match[3] || 0) * 60)
  )
}
assert.deepEqual(
  [offset(fold, -1n), offset(fold, 3n * hour), offset(fold, 6n * hour)],
  [0, 43_200, 0]
)
assert.deepEqual(
  [offset(gap, -1n), offset(gap, hour), offset(gap, 6n * hour)],
  [0, 14_400, 0]
)
assert.equal(offset(upper, max), 7200)
assert.equal(offset(lower, -max), 0)
assert.equal(formatter.tzData[upper].at(-1)[0], Number(max + 900n))
assert.equal(formatter.tzData[lower].at(-1)[0], Number(-max - 900n))
assert.throws(() => offset(upper, max + 1n), RangeError)
assert.throws(() => offset(lower, -max - 1n), RangeError)

const {Temporal} = await load(temporalPackage, 'index.js')
const modes = ['earlier', 'later', 'compatible', 'reject']
const rejected = 'RangeError'
const outcomes = local =>
  modes.map(disambiguation => {
    try {
      return Temporal.ZonedDateTime.from(local, {
        disambiguation,
      }).epochNanoseconds.toString()
    } catch (error) {
      if (error instanceof RangeError) return rejected
      throw error
    }
  })
const epoch = seconds => (seconds * second).toString()
const actual = {
  fold: outcomes(`1970-01-01T15:00[${fold}]`),
  gap: outcomes(`1970-01-01T01:00[${gap}]`),
  upper: outcomes(`+275760-09-13T00:30[${upper}]`),
  lower: outcomes(`-271821-04-20T00:30[${lower}]`),
}
const spec = {
  fold: [epoch(3n * hour), epoch(15n * hour), epoch(3n * hour), rejected],
  gap: [epoch(-3n * hour), epoch(hour), epoch(hour), rejected],
  upper: Array(4).fill(rejected),
  lower: Array(4).fill(rejected),
}
console.log(
  JSON.stringify({kind: mode, ownsQuery, modes, actual, spec}, null, 2)
)
assert.deepEqual(
  actual,
  mode === 'owned'
    ? spec
    : {
        fold: Array(4).fill(epoch(15n * hour)),
        gap: Array(4).fill(rejected),
        upper: Array(4).fill(epoch(max - 5400n)),
        lower: Array(4).fill(epoch(-max + 1800n)),
      }
)

if (mode === 'legacy') {
  const warm = 'America/Chicago'
  const cold = 'America/Los_Angeles'
  const local = zone => `1970-01-01T00:30[${zone}]`
  const reload = gap => ({
    abbrvs: 'TEST',
    offsets: '0|2s0',
    zones: [warm, cold].map(zone =>
      [zone, packed(null, 0), ...(gap ? [packed(0n, 1)] : [])].join('|')
    ),
  })
  formatter.__addTZData(reload(false))
  const stale = Array(4).fill(epoch(hour / 2n))
  assert.deepEqual(outcomes(local(warm)), stale)
  const original = formatter.tzData
  formatter.__addTZData(reload(true))
  assert.notEqual(formatter.tzData, original)
  assert.deepEqual([offset(warm, -1n), offset(warm, 0n)], [0, 3600])
  assert.deepEqual(outcomes(local(cold)), [
    epoch(-hour / 2n),
    epoch(hour / 2n),
    epoch(hour / 2n),
    rejected,
  ])
  // Record the legacy cache failure for the previously queried zone.
  assert.deepEqual(outcomes(local(warm)), stale)
}

import assert from 'node:assert/strict'
import {registerHooks} from 'node:module'
import {resolve} from 'node:path'
import {pathToFileURL} from 'node:url'

const [temporal, datetime, matcher, memoize] = process.argv.slice(2)
const moduleUrl = (directory, file) =>
  pathToFileURL(resolve(directory, file)).href
const dependencies = new Map([
  ['@formatjs/intl-localematcher', moduleUrl(matcher, 'index.js')],
  ['@formatjs/fast-memoize', moduleUrl(memoize, 'index.js')],
])
registerHooks({
  resolve(specifier, context, nextResolve) {
    return nextResolve(dependencies.get(specifier) ?? specifier, context)
  },
})
await import(moduleUrl(datetime, 'polyfill-force.js'))
await import(moduleUrl(datetime, 'locale-data/en.js'))

const hour = 3_600_000_000_000n
const max = 8_640_000_000_000_000_000_000n
const row = (hours, index) =>
  (hours === null ? '' : (BigInt(hours) * 3600n).toString(36)) +
  ',0,' +
  index +
  ',0'
Intl.DateTimeFormat.__addTZData({
  abbrvs: 'TEST',
  offsets: [23n, -23n, 17n, 12n, -5n, 21n]
    .map(offset => (offset * 3600n).toString(36))
    .join('|'),
  zones: [
    'America/Phoenix|' + [row(null, 0), row(72, 1)].join('|'),
    'America/Boise|' + [row(null, 1), row(-22, 2)].join('|'),
    'America/Denver|' + [row(null, 1), row(42, 3)].join('|'),
    'America/New_York|' + [row(null, 4), row(max / hour - 33n, 5)].join('|'),
  ],
})

const {Temporal} = await import(moduleUrl(temporal, 'index.js'))
for (const [zone, first, second, increment, endpoints, modes, expected] of [
  [
    'America/Phoenix',
    23n,
    73n,
    1,
    [47n, 71n, 141n],
    ['trunc', 'ceil', 'halfExpand'],
    ['P2D', 'P3D', 'P2D'],
  ],
  [
    'America/Boise',
    0n,
    -20n,
    1,
    [16n, -8n, -32n],
    ['trunc', 'floor', 'halfEven'],
    ['-P2D', '-P3D', '-P2D'],
  ],
  [
    'America/Denver',
    24n,
    61n,
    2,
    [48n, 72n, 61n],
    ['trunc', 'ceil', 'halfExpand'],
    ['PT0S', 'P2D', 'P2D'],
  ],
]) {
  const start = new Temporal.ZonedDateTime(first * hour, zone)
  const end = new Temporal.ZonedDateTime(second * hour, zone)
  const sign = second < first ? -1 : 1
  for (const [index, epochHour] of endpoints.entries()) {
    const days = (index + 1) * sign
    assert.equal(start.add({days}).epochNanoseconds, epochHour * hour)
  }
  const actual = modes.map(roundingMode =>
    start
      .until(end, {
        largestUnit: 'day',
        smallestUnit: 'day',
        roundingIncrement: increment,
        roundingMode,
      })
      .toString()
  )
  console.log(JSON.stringify({zone, actual}))
  assert.deepEqual(actual, expected)
}

const origin = new Temporal.ZonedDateTime(
  max - 190n * hour,
  'America/New_York',
  'gregory'
)
const duration = Temporal.Duration.from('PT167H')
const target = origin.add(duration)
assert.equal(target.epochNanoseconds, max - 23n * hour)
assert.equal(origin.add({weeks: 1}).epochNanoseconds, max - 22n * hour)
assert.equal(origin.until(target, {largestUnit: 'week'}).toString(), 'P1W1DT1H')
assert.throws(
  () => duration.total({relativeTo: origin, unit: 'week'}),
  RangeError
)
console.log(JSON.stringify({weekTotal: 'RangeError'}))

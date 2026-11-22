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
await load(formatterPackage, 'polyfill-force.js')
await load(formatterPackage, 'locale-data/en.js')
const formatter = Intl.DateTimeFormat
assert.notEqual(formatter, native)
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

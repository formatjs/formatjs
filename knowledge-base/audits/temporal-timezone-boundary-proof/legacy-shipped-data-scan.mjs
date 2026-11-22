import assert from 'node:assert/strict'
import {createHash} from 'node:crypto'
import {readFileSync} from 'node:fs'
import {resolve} from 'node:path'
import {pathToFileURL} from 'node:url'

const [directory, data] = process.argv.slice(2)
const releases = {
  'add-all-tz.js': {
    sha256: 'a7742ee85beefcdae55f60cafcab5caabf9d1101b6009d2c1415e06aece8ef2d',
    zones: 452,
    transitions: 43846,
  },
  'add-golden-tz.js': {
    sha256: '2c2094c54fc26c8b43f1afae3748e939d06520f6d327b7e81c08eac149c22e2d',
    zones: 246,
    transitions: 26726,
  },
}
assert.ok(
  Object.hasOwn(releases, data),
  'Pass add-all-tz.js or add-golden-tz.js'
)
const release = releases[data]
const load = file => import(pathToFileURL(resolve(directory, file)).href)
const sha256 = file =>
  createHash('sha256')
    .update(readFileSync(resolve(directory, file)))
    .digest('hex')
assert.equal(
  JSON.parse(readFileSync(resolve(directory, 'package.json'))).version,
  '7.8.1'
)
assert.equal(sha256(data), release.sha256)
assert.equal(
  sha256('polyfill-force.js'),
  '6b0cf18a501f61f6ef5c63de741ea1e0b41b006c39c2d86c2d68f697001ac34f'
)
assert.equal(
  sha256('locale-data/en.js'),
  'ae2440a6911c42179833ade1c4a10bfc87c8411b1569e0553386e7a61a196cd2'
)

const native = Intl.DateTimeFormat
await load('polyfill-force.js')
await load('locale-data/en.js')
await load(data)
const formatter = Intl.DateTimeFormat
assert.notEqual(formatter, native)
const day = 86_400
const limit = 8_640_000_000_000
const summary = {
  data,
  sha256: release.sha256,
  node: process.version,
  zones: 0,
  transitions: 0,
  nonIncreasingRows: 0,
  endpointTransitions: 0,
  minimumSpacingSeconds: Infinity,
  maximumOffsetSeconds: 0,
  maximumJumpSeconds: 0,
  publicProbes: 0,
}

// The release selects the row before the first timestamp strictly above the input.
// A non-increasing row therefore takes effect at the preceding maximum timestamp.
function collapseRows(rows) {
  assert.equal(rows[0][0], -Infinity)
  const effective = []
  let previous = -Infinity
  let threshold = -Infinity
  for (const [at, , offset] of rows) {
    assert.ok(at === -Infinity || Number.isSafeInteger(at * 1000))
    assert.ok(Number.isInteger(offset) && Math.abs(offset) < day)
    if (at !== -Infinity && at <= previous) summary.nonIncreasingRows++
    previous = at
    threshold = Math.max(threshold, at)
    if (effective.at(-1)?.[0] === threshold) effective.pop()
    effective.push([threshold, offset])
  }
  return effective
}

function probe(parts, milliseconds, offset) {
  const fields = Object.fromEntries(
    parts
      .formatToParts(milliseconds)
      .map(part => [part.type, Number(part.value)])
  )
  const local = new Date(milliseconds + offset * 1000)
  // Calendar getters apply TimeClip too. Shift outside endpoints by one
  // Gregorian cycle, whose days and clock fields repeat exactly.
  const cycle = 146_097 * day * 1000
  const shifted = Number.isNaN(local.getTime())
    ? new Date(milliseconds + offset * 1000 - Math.sign(milliseconds) * cycle)
    : local
  assert.deepEqual(
    [fields.day, fields.hour % 24, fields.minute, fields.second],
    [
      shifted.getUTCDate(),
      shifted.getUTCHours(),
      shifted.getUTCMinutes(),
      shifted.getUTCSeconds(),
    ],
    `${parts.resolvedOptions().timeZone} at ${milliseconds}`
  )
  summary.publicProbes++
}

const decoded = new Map()
for (const [zone, rows] of Object.entries(formatter.tzData)) {
  summary.zones++
  const offsets = collapseRows(rows)
  let previous = offsets[0][1]
  let lastChange = -Infinity
  const changes = []
  for (const [at, offset] of offsets) {
    summary.maximumOffsetSeconds = Math.max(
      summary.maximumOffsetSeconds,
      Math.abs(offset)
    )
    if (offset === previous) continue
    changes.push({at, previous, offset})
    summary.transitions++
    summary.minimumSpacingSeconds = Math.min(
      summary.minimumSpacingSeconds,
      at - lastChange
    )
    summary.maximumJumpSeconds = Math.max(
      summary.maximumJumpSeconds,
      Math.abs(offset - previous)
    )
    if (Math.abs(Math.abs(at) - limit) <= 2 * day) summary.endpointTransitions++
    lastChange = at
    previous = offset
  }
  decoded.set(zone, {first: offsets[0][1], last: previous, changes})
}

for (const zone of decoded.keys()) {
  const parts = new formatter('en-US-u-nu-latn', {
    timeZone: zone,
    calendar: 'iso8601',
    numberingSystem: 'latn',
    day: 'numeric',
    hour: 'numeric',
    minute: 'numeric',
    second: 'numeric',
    hour12: false,
  })
  // The formatter can resolve a table key through the baked alias map.
  const {first, last, changes} = decoded.get(
    parts.resolvedOptions().timeZone
  ) ?? {
    first: 0,
    last: 0,
    changes: [],
  }
  for (const [milliseconds, offset] of [
    [-limit * 1000, first],
    [(-limit + 2 * day) * 1000, first],
    [(limit - 2 * day) * 1000, last],
    [limit * 1000, last],
  ]) {
    probe(parts, milliseconds, offset)
  }
  for (const [index, {at, previous, offset}] of changes.entries()) {
    if (
      Math.abs(offset - previous) >= day ||
      at - (changes[index - 1]?.at ?? -Infinity) <= 7 * day ||
      (changes[index + 1]?.at ?? Infinity) - at <= 7 * day
    ) {
      probe(parts, at * 1000 - 1, previous)
      probe(parts, at * 1000, offset)
    }
  }
}
assert.equal(summary.zones, release.zones)
assert.equal(summary.transitions, release.transitions)
assert.ok(summary.minimumSpacingSeconds > 2 * day)
assert.ok(summary.maximumOffsetSeconds < day)
assert.ok(summary.maximumJumpSeconds <= day)
assert.equal(summary.endpointTransitions, 0)
console.log(JSON.stringify(summary, null, 2))

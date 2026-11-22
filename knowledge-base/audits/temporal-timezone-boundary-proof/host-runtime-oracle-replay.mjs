import assert from 'node:assert/strict'
import {existsSync, readFileSync, realpathSync} from 'node:fs'
import {createRequire, registerHooks} from 'node:module'
import {resolve} from 'node:path'
import {pathToFileURL} from 'node:url'

assert.ok(
  process.argv[2],
  'Pass the _main directory of the built test runfiles'
)
const root = resolve(process.argv[2])
registerHooks({
  resolve(specifier, context, next) {
    if (specifier.startsWith('#packages/')) {
      const path = resolve(root, specifier.slice(1))
      return next(
        pathToFileURL(existsSync(path) ? path : path.replace(/\.js$/, '.ts'))
          .href,
        context
      )
    }
    return next(specifier, context)
  },
})
const fromRoot = name => import(pathToFileURL(resolve(root, name)).href)
const {createHostTimeZone} = await fromRoot(
  'packages/temporal/host-timezone.ts'
)
const {checkHostTimezoneOracle} = await fromRoot(
  'packages/temporal/tests/host-timezone-oracle.ts'
)
const {timeZoneIdentifier} = await fromRoot('packages/temporal/zones.ts')
const require = createRequire(resolve(root, 'package.json'))
const {Temporal: Reference} = require(
  realpathSync(require.resolve('temporal-polyfill/full/implementation'))
)

const SECOND = 1_000_000_000n
function rawOffset(formatter, ms) {
  const timeZoneName = formatter
    .formatToParts(ms)
    .find(part => part.type === 'timeZoneName').value
  const match = /^GMT(?:([+-])(\d{2}):(\d{2})(?::(\d{2}))?)?$/.exec(
    timeZoneName
  )
  assert.ok(match, timeZoneName)
  return (
    BigInt(
      (match[1] === '-' ? -1 : 1) *
        (Number(match[2] ?? 0) * 3600 +
          Number(match[3] ?? 0) * 60 +
          Number(match[4] ?? 0))
    ) * SECOND
  )
}
function referenceZone(id) {
  timeZoneIdentifier(id)
  const resolve = (fields, disambiguation = 'compatible') =>
    Reference.PlainDateTime.from(fields).toZonedDateTime(id, {disambiguation})
      .epochNanoseconds
  return {
    offsetNanoseconds: instant =>
      BigInt(new Reference.ZonedDateTime(instant, id).offsetNanoseconds),
    resolve,
    possibleInstants: fields => {
      const local = Reference.PlainDateTime.from(fields)
      return [
        ...new Set([resolve(fields, 'earlier'), resolve(fields, 'later')]),
      ].filter(instant =>
        new Reference.ZonedDateTime(instant, id).toPlainDateTime().equals(local)
      )
    },
  }
}
const read = name =>
  readFileSync(resolve(root, 'conformance-tests/icu4j', name), 'utf8')
const identity = read('temporal-timezone-identity-fixtures.tsv')
const fixture = read('temporal-timezone-fixtures.tsv')
function run(create) {
  const mismatches = []
  const counts = checkHostTimezoneOracle(
    create,
    identity,
    fixture,
    (actual, expected, context) => {
      if (actual !== expected)
        mismatches.push({
          context,
          actual: String(actual),
          expected: String(expected),
        })
    }
  )
  assert.deepEqual(counts, {
    identities: 597,
    offsets: 17640,
    gapsAndFolds: 1900,
  })
  return {counts, mismatches}
}
const adapter = run(id => createHostTimeZone(timeZoneIdentifier(id)))
const reference = run(referenceZone)
assert.deepEqual(adapter, reference)
const intlFormatters = new Map()
const offsets = []
for (const line of fixture.trim().split('\n')) {
  if (line.startsWith('#')) continue
  const [id, epoch, expectedOffset] = line.split('\t')
  if (!intlFormatters.has(id)) {
    try {
      timeZoneIdentifier(id)
      intlFormatters.set(
        id,
        new Intl.DateTimeFormat('en-US-u-nu-latn', {
          timeZone: id,
          timeZoneName: 'longOffset',
        })
      )
    } catch (error) {
      if (!(error instanceof RangeError)) throw error
      intlFormatters.set(id, null)
    }
  }
  const formatter = intlFormatters.get(id)
  if (!formatter) continue
  const raw = rawOffset(formatter, Number(epoch))
  const expected = BigInt(expectedOffset) * SECOND
  offsets.push({context: line, actual: String(raw), expected: String(expected)})
}
assert.equal(offsets.length, adapter.counts.offsets)
const mismatches = offsets.filter(entry => entry.actual !== entry.expected)
const adapterOffsets = adapter.mismatches.filter(
  entry => !entry.context.includes(' ')
)
assert.deepEqual(adapterOffsets, mismatches)
console.log(
  JSON.stringify(
    {
      node: process.version,
      icu: process.versions.icu,
      tz: process.versions.tz,
      oracle: fixture.split('\n')[0],
      checkedRawOffsets: offsets.length,
      rawMismatches: mismatches.length,
      ...adapter,
    },
    null,
    2
  )
)

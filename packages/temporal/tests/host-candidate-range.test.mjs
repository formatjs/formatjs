import assert from 'node:assert/strict'
import {registerHooks} from 'node:module'
import {join} from 'node:path'
import {pathToFileURL} from 'node:url'
import {runfiles} from '@bazel/runfiles'

const [temporal, datetimeFormat, localeMatcher, memoize] = process.argv
  .slice(2)
  .map(path => runfiles.resolve(path))
const packages = new Map([
  ['@formatjs/intl-localematcher', localeMatcher],
  ['@formatjs/fast-memoize', memoize],
])
const hooks = registerHooks({
  resolve(specifier, context, nextResolve) {
    const path = packages.get(specifier)
    return path
      ? nextResolve(pathToFileURL(join(path, 'index.js')).href, context)
      : nextResolve(specifier, context)
  },
})
const load = (directory, name) =>
  import(pathToFileURL(join(directory, name)).href)

const maxSeconds = 8_640_000_000_000n
const maxNanoseconds = maxSeconds * 1_000_000_000n
const hour = 3_600_000_000_000n
const second = 1_000_000_000n
const twoHours = 2n * hour
const packedRow = (seconds, offsetIndex) =>
  `${seconds === null ? '' : seconds.toString(36)},0,${offsetIndex},0`

const upperMixed = 'America/New_York'
const upperControl = 'America/Chicago'
const lowerMixed = 'America/Denver'
const lowerControl = 'America/Los_Angeles'
const pulse = 'America/Phoenix'
const ordinaryGap = 'America/Detroit'

try {
  const nativeFormatter = Intl.DateTimeFormat
  await load(datetimeFormat, 'polyfill-force.js')
  await load(datetimeFormat, 'locale-data/en.js')
  const formatter = Intl.DateTimeFormat
  assert.notEqual(formatter, nativeFormatter)
  formatter.__addTZData({
    abbrvs: 'TEST',
    offsets: '0|5k0|xc0',
    zones: [
      `${upperMixed}|${packedRow(null, 1)}|${packedRow(maxSeconds + 900n, 0)}`,
      `${upperControl}|${packedRow(null, 0)}|${packedRow(maxSeconds - 10_800n, 1)}`,
      `${lowerMixed}|${packedRow(null, 1)}|${packedRow(-maxSeconds - 900n, 0)}`,
      `${lowerControl}|${packedRow(null, 0)}|${packedRow(-maxSeconds + 10_800n, 1)}`,
      `${pulse}|${packedRow(null, 0)}|${packedRow(0n, 2)}|${packedRow(21_600n, 0)}`,
      `${ordinaryGap}|${packedRow(null, 0)}|${packedRow(0n, 2)}`,
    ],
  })
  const {Temporal} = await load(temporal, 'index.js')

  const upperLocal = maxNanoseconds + 30n * 60n * second
  const lowerLocal = -maxNanoseconds + 30n * 60n * second
  for (const disambiguation of ['compatible', 'earlier', 'later', 'reject']) {
    const options = {disambiguation}
    assert.equal(
      Temporal.ZonedDateTime.from(
        `+275760-09-13T00:30:00.000000001[${upperControl}]`,
        options
      ).epochNanoseconds,
      upperLocal - twoHours + 1n
    )
    assert.equal(
      Temporal.ZonedDateTime.from(
        `-271821-04-20T00:30:00.000000001[${lowerControl}]`,
        options
      ).epochNanoseconds,
      lowerLocal + 1n
    )
    assert.throws(
      () =>
        Temporal.ZonedDateTime.from(
          `+275760-09-13T00:30:00[${upperMixed}]`,
          options
        ),
      RangeError,
      `upper mixed candidates, ${disambiguation}`
    )
    assert.throws(
      () =>
        Temporal.ZonedDateTime.from(
          `-271821-04-20T00:30:00[${lowerMixed}]`,
          options
        ),
      RangeError,
      `lower mixed candidates, ${disambiguation}`
    )
  }

  // A permanent forward jump keeps the usual gap disambiguation behavior.
  const gap = `1970-01-01T03:00:00[${ordinaryGap}]`
  assert.equal(
    Temporal.ZonedDateTime.from(gap, {disambiguation: 'earlier'})
      .epochNanoseconds,
    -9n * hour
  )
  for (const disambiguation of ['compatible', 'later'])
    assert.equal(
      Temporal.ZonedDateTime.from(gap, {disambiguation}).epochNanoseconds,
      3n * hour
    )
  assert.throws(
    () => Temporal.ZonedDateTime.from(gap, {disambiguation: 'reject'}),
    RangeError
  )

  // The +12:00 offset is active only from 00:00 to 06:00 UTC.
  const fold = `1970-01-01T15:00:00[${pulse}]`
  for (const disambiguation of ['compatible', 'earlier'])
    assert.equal(
      Temporal.ZonedDateTime.from(fold, {disambiguation}).epochNanoseconds,
      3n * hour,
      `interior short pulse fold, ${disambiguation}`
    )
  assert.equal(
    Temporal.ZonedDateTime.from(fold, {disambiguation: 'later'})
      .epochNanoseconds,
    15n * hour
  )
  assert.throws(
    () => Temporal.ZonedDateTime.from(fold, {disambiguation: 'reject'}),
    RangeError
  )
  assert.equal(
    Temporal.ZonedDateTime.from(`1970-01-01T15:00:00+12:00[${pulse}]`)
      .epochNanoseconds,
    3n * hour
  )
  assert.equal(
    Temporal.ZonedDateTime.from(`1970-01-01T17:59:59.999999999[${pulse}]`)
      .epochNanoseconds,
    6n * hour - 1n
  )
  assert.equal(
    Temporal.ZonedDateTime.from(`1970-01-01T18:00:00[${pulse}]`)
      .epochNanoseconds,
    18n * hour
  )
} finally {
  hooks.deregister()
}

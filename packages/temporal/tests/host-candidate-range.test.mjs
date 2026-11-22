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

try {
  const nativeFormatter = Intl.DateTimeFormat
  await load(datetimeFormat, 'polyfill-force.js')
  await load(datetimeFormat, 'locale-data/en.js')
  const formatter = Intl.DateTimeFormat
  assert.notEqual(formatter, nativeFormatter)
  formatter.__addTZData({
    abbrvs: 'TEST',
    offsets: '0|5k0',
    zones: [
      `${upperMixed}|${packedRow(null, 1)}|${packedRow(maxSeconds + 900n, 0)}`,
      `${upperControl}|${packedRow(null, 0)}|${packedRow(maxSeconds - 10_800n, 1)}`,
      `${lowerMixed}|${packedRow(null, 1)}|${packedRow(-maxSeconds - 900n, 0)}`,
      `${lowerControl}|${packedRow(null, 0)}|${packedRow(-maxSeconds + 10_800n, 1)}`,
    ],
  })
  const {Temporal} = await load(temporal, 'index.js')

  const upperLocal = maxNanoseconds + 30n * 60n * second
  const lowerLocal = -maxNanoseconds + 30n * 60n * second
  for (const disambiguation of ['compatible', 'earlier', 'later', 'reject']) {
    const options = {disambiguation}
    assert.equal(
      Temporal.ZonedDateTime.from(
        `+275760-09-13T00:30:00[${upperControl}]`,
        options
      ).epochNanoseconds,
      upperLocal - twoHours
    )
    assert.equal(
      Temporal.ZonedDateTime.from(
        `-271821-04-20T00:30:00[${lowerControl}]`,
        options
      ).epochNanoseconds,
      lowerLocal
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
} finally {
  hooks.deregister()
}

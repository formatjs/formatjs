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
const positiveShiftPulse = 'America/Boise'

try {
  const nativeFormatter = Intl.DateTimeFormat
  await load(datetimeFormat, 'polyfill-force.js')
  await load(datetimeFormat, 'locale-data/en.js')
  const formatter = Intl.DateTimeFormat
  assert.notEqual(formatter, nativeFormatter)
  formatter.__addTZData({
    abbrvs: 'TEST',
    offsets: '0|5k0|xc0|b40',
    zones: [
      `${upperMixed}|${packedRow(null, 1)}|${packedRow(maxSeconds + 900n, 0)}`,
      `${upperControl}|${packedRow(null, 0)}|${packedRow(maxSeconds - 10_800n, 1)}`,
      `${lowerMixed}|${packedRow(null, 1)}|${packedRow(-maxSeconds - 900n, 0)}`,
      `${lowerControl}|${packedRow(null, 0)}|${packedRow(-maxSeconds + 10_800n, 1)}`,
      `${pulse}|${packedRow(null, 0)}|${packedRow(0n, 2)}|${packedRow(21_600n, 0)}`,
      `${ordinaryGap}|${packedRow(null, 0)}|${packedRow(0n, 2)}`,
      `${positiveShiftPulse}|${packedRow(null, 0)}|${packedRow(0n, 3)}|${packedRow(21_600n, 0)}`,
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

  // Both nearest reachable boundaries have offset zero in this gap.
  for (const disambiguation of ['compatible', 'earlier', 'later', 'reject'])
    assert.throws(
      () =>
        Temporal.ZonedDateTime.from(`1970-01-01T03:00:00[${pulse}]`, {
          disambiguation,
        }),
      RangeError
    )

  // The +04:00 pulse leaves a gap from 00:00 to 04:00 local.
  for (const [localHour, earlier, later] of [
    ['01', -3n, 1n],
    ['03', -1n, 7n],
  ]) {
    const gap = `1970-01-01T${localHour}:00:00[${positiveShiftPulse}]`
    assert.equal(
      Temporal.ZonedDateTime.from(gap, {disambiguation: 'earlier'})
        .epochNanoseconds,
      earlier * hour,
      `short pulse gap, ${localHour}:00 earlier`
    )
    for (const disambiguation of ['compatible', 'later'])
      assert.equal(
        Temporal.ZonedDateTime.from(gap, {disambiguation}).epochNanoseconds,
        later * hour,
        `short pulse gap, ${localHour}:00 ${disambiguation}`
      )
    assert.throws(
      () => Temporal.ZonedDateTime.from(gap, {disambiguation: 'reject'}),
      RangeError
    )
  }
  // A warm zone must use the same reloaded offsets as owned candidates.
  const reloadZone = 'America/New_York'
  const registerZone = (initialOffset, transitionSecond) => {
    formatter.__addTZData({
      abbrvs: 'TEST',
      offsets: '0|2s0|5k0', // +00:00, +01:00, +02:00
      zones: [
        `${reloadZone}|${packedRow(null, initialOffset)}|${packedRow(transitionSecond, 2)}`,
      ],
    })
  }
  registerZone(0, 10_000n)
  const existing = new Temporal.ZonedDateTime(0n, reloadZone)
  const afterTransition = new Temporal.ZonedDateTime(
    30_000n * second,
    reloadZone
  )
  const dateTimeFormat = new formatter('en', {
    timeZone: reloadZone,
    hour: 'numeric',
    hourCycle: 'h23',
  })
  const formattedHour = () =>
    dateTimeFormat.formatToParts(0).find(part => part.type === 'hour').value
  const nextTransition = () =>
    existing.getTimeZoneTransition('next')?.epochNanoseconds
  const previousTransition = () =>
    afterTransition.getTimeZoneTransition('previous')?.epochNanoseconds
  assert.equal(formattedHour(), '00')
  assert.equal(existing.offset, '+00:00')
  assert.equal(nextTransition(), 10_000n * second)
  assert.equal(previousTransition(), 10_000n * second)

  registerZone(1, 20_000n)
  assert.equal(formattedHour(), '01')
  const candidate = Temporal.ZonedDateTime.from(
    `1970-01-01T01:00:00[${reloadZone}]`,
    {disambiguation: 'reject'}
  )
  assert.equal(candidate.epochNanoseconds, 0n)
  assert.deepEqual(
    [
      existing.offset,
      candidate.offset,
      candidate.hour,
      nextTransition(),
      previousTransition(),
    ],
    ['+01:00', '+01:00', 1, 20_000n * second, 20_000n * second]
  )
} finally {
  hooks.deregister()
}

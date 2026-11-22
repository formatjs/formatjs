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
const overlappingGap = 'America/Moncton'
const gapAtLowerLimit = 'America/Toronto'
const gapBelowLowerLimit = 'America/Vancouver'
const overlappingRows = (zone, shift) =>
  zone +
  '|' +
  [
    packedRow(null, 4),
    packedRow((shift - 86n) * 3600n, 5),
    packedRow((shift - 62n) * 3600n, 6),
    packedRow((shift - 58n) * 3600n, 7),
  ].join('|')

try {
  const nativeFormatter = Intl.DateTimeFormat
  await load(datetimeFormat, 'polyfill-force.js')
  await load(datetimeFormat, 'locale-data/en.js')
  const formatter = Intl.DateTimeFormat
  assert.notEqual(formatter, nativeFormatter)
  formatter.__addTZData({
    abbrvs: 'TEST',
    offsets: [0n, 2n, 12n, 4n, 7n, -4n, 16n, -3n]
      .map(offset => (offset * 3600n).toString(36))
      .join('|'),
    zones: [
      `${upperMixed}|${packedRow(null, 1)}|${packedRow(maxSeconds + 900n, 0)}`,
      `${upperControl}|${packedRow(null, 0)}|${packedRow(maxSeconds - 10_800n, 1)}`,
      `${lowerMixed}|${packedRow(null, 1)}|${packedRow(-maxSeconds - 900n, 0)}`,
      `${lowerControl}|${packedRow(null, 0)}|${packedRow(-maxSeconds + 10_800n, 1)}`,
      `${pulse}|${packedRow(null, 0)}|${packedRow(0n, 2)}|${packedRow(21_600n, 0)}`,
      `${ordinaryGap}|${packedRow(null, 0)}|${packedRow(0n, 2)}`,
      `${positiveShiftPulse}|${packedRow(null, 0)}|${packedRow(0n, 3)}|${packedRow(21_600n, 0)}`,
      overlappingRows(overlappingGap, 0n),
      overlappingRows(gapAtLowerLimit, -(maxNanoseconds / hour) + 81n),
      overlappingRows(gapBelowLowerLimit, -(maxNanoseconds / hour) + 80n),
    ],
  })
  const {Temporal} = await load(temporal, 'index.js')

  const transition = (zone, instant, direction) =>
    new Temporal.ZonedDateTime(instant, zone).getTimeZoneTransition(direction)
      ?.epochNanoseconds ?? null

  // Both endpoints of a host probe can have the same offset during a pulse.
  assert.deepEqual(
    [
      transition(pulse, -1n, 'next'),
      transition(pulse, 0n, 'next'),
      transition(pulse, 6n * hour, 'previous'),
      transition(pulse, 6n * hour + 1n, 'previous'),
    ],
    [0n, 6n * hour, 0n, 6n * hour]
  )

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

  // The nearest boundary offsets shift this clock into the same gap.
  const overlappingLocal = `1969-12-29T07:00:00[${overlappingGap}]`
  for (const [disambiguation, expected] of [
    ['earlier', -81n],
    ['compatible', -61n],
    ['later', -61n],
  ])
    assert.equal(
      Temporal.ZonedDateTime.from(overlappingLocal, {disambiguation})
        .epochNanoseconds,
      expected * hour
    )
  assert.throws(
    () =>
      Temporal.ZonedDateTime.from(overlappingLocal, {disambiguation: 'reject'}),
    RangeError
  )
  assert.equal(
    Temporal.ZonedDateTime.from(`-271821-04-20T16:00:00[${gapAtLowerLimit}]`, {
      disambiguation: 'earlier',
    }).epochNanoseconds,
    -maxNanoseconds
  )
  const belowLimitLocal = `-271821-04-20T15:00:00[${gapBelowLowerLimit}]`
  assert.throws(
    () =>
      Temporal.ZonedDateTime.from(belowLimitLocal, {disambiguation: 'earlier'}),
    /Instant out of range/
  )
  assert.equal(
    Temporal.ZonedDateTime.from(belowLimitLocal).epochNanoseconds,
    -maxNanoseconds + 19n * hour
  )
  const roundingOrigin = new Temporal.ZonedDateTime(562n * hour, overlappingGap)
  const roundingTarget = new Temporal.ZonedDateTime(-33n * hour, overlappingGap)
  assert.equal(
    roundingOrigin
      .until(roundingTarget, {
        largestUnit: 'day',
        smallestUnit: 'day',
        roundingIncrement: 2,
        roundingMode: 'floor',
      })
      .toString(),
    '-P26D'
  )

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

  const alias = 'US/Eastern'
  const aliasInstant = new Temporal.ZonedDateTime(3n * hour, alias)
  const aliasFormatter = new formatter('en', {
    timeZone: alias,
    timeZoneName: 'longOffset',
  })
  assert.equal(aliasInstant.offset, '+01:00')
  const registerAliasPulse = (offset, extraRows = []) =>
    formatter.__addTZData({
      abbrvs: 'TEST',
      offsets: '0|2s0|b40|xc0',
      zones: [
        `${reloadZone}|${packedRow(null, 0)}|${packedRow(0n, offset)}|${packedRow(21_600n, 0)}`,
        ...extraRows,
      ],
    })
  registerAliasPulse(3)
  const aliasFold = `1970-01-01T15:00[${alias}]`
  assert.equal(
    Temporal.ZonedDateTime.from(aliasFold).epochNanoseconds,
    3n * hour
  )
  assert.throws(
    () => Temporal.ZonedDateTime.from(aliasFold, {disambiguation: 'reject'}),
    RangeError
  )
  assert.equal(transition(alias, -1n, 'next'), 0n)
  assert.equal(transition(alias, 6n * hour + 1n, 'previous'), 6n * hour)

  registerAliasPulse(2, [`${alias}|${packedRow(null, 1)}`])
  const aliasOffset = aliasFormatter
    .formatToParts(3 * 3_600_000)
    .find(part => part.type === 'timeZoneName').value
  assert.equal(aliasOffset, 'GMT+04:00')
  assert.equal(aliasInstant.offset, '+04:00')
  assert.equal(aliasInstant.timeZoneId, alias)
  const aliasGap = `1970-01-01T01:00[${alias}]`
  for (const [disambiguation, expected] of [
    ['earlier', -3n * hour],
    ['later', hour],
  ]) {
    assert.equal(
      Temporal.ZonedDateTime.from(aliasGap, {disambiguation}).epochNanoseconds,
      expected
    )
  }

  // Keep the last explicit row until the footer actually takes over.
  formatter.__addTZData({
    abbrvs: 'TEST',
    offsets: '0|2s0',
    zones: [
      `${reloadZone}|${packedRow(null, 0)}|${packedRow(0n, 0)}`,
      `${upperControl}|${packedRow(null, 0)}|${packedRow(maxSeconds, 1)}`,
      `${lowerControl}|${packedRow(null, 0)}|${packedRow(-maxSeconds, 1)}`,
      `${pulse}|${packedRow(null, 0)}|${packedRow(0n, 0)}`,
    ],
    future: {
      [reloadZone]: {standardOffset: 3600},
      [pulse]: {
        standardOffset: 0,
        daylightOffset: 3600,
        start: {kind: 'month', month: 3, week: 2, weekday: 0, seconds: 7200},
        end: {kind: 'month', month: 11, week: 1, weekday: 0, seconds: 7200},
      },
    },
  })
  const seam = 1_000_000n
  assert.equal(transition(reloadZone, 0n, 'next'), seam)
  assert.equal(transition(reloadZone, seam, 'previous'), null)
  assert.equal(transition(reloadZone, seam + 1n, 'previous'), seam)
  assert.equal(
    new Temporal.ZonedDateTime(seam - 1n, reloadZone).offset,
    '+00:00'
  )
  assert.equal(new Temporal.ZonedDateTime(seam, reloadZone).offset, '+01:00')
  assert.equal(
    transition(upperControl, maxNanoseconds - 1n, 'next'),
    maxNanoseconds
  )
  assert.equal(transition(upperControl, maxNanoseconds, 'next'), null)
  assert.equal(
    transition(lowerControl, -maxNanoseconds + 1n, 'previous'),
    -maxNanoseconds
  )
  assert.equal(transition(lowerControl, -maxNanoseconds, 'previous'), null)
  const spring = 1_710_036_000n * second // 2024-03-10T02:00Z
  const autumn = 1_730_595_600n * second // 2024-11-03T01:00Z
  assert.equal(transition(pulse, spring - 1n, 'next'), spring)
  assert.equal(transition(pulse, spring, 'next'), autumn)
  assert.equal(transition(pulse, autumn, 'previous'), spring)

  // The actual neighbors of each pulse are valid, even within a day of a limit.
  formatter.__addTZData({
    abbrvs: 'TEST',
    offsets: '0|2s0|b40',
    zones: [
      `${pulse}|${packedRow(null, 0)}|${packedRow(maxSeconds - 10_800n, 1)}|${packedRow(maxSeconds - 3_600n, 0)}`,
      `${positiveShiftPulse}|${packedRow(null, 0)}|${packedRow(-maxSeconds + 3_600n, 1)}|${packedRow(-maxSeconds + 10_800n, 0)}`,
      `${ordinaryGap}|${packedRow(null, 0)}|${packedRow(maxSeconds - 7_200n, 2)}`,
    ],
  })
  for (const [local, start] of [
    [`+275760-09-12T21:30:00[${pulse}]`, maxNanoseconds - 3n * hour],
    [`-271821-04-20T01:30:00[${positiveShiftPulse}]`, -maxNanoseconds + hour],
  ]) {
    assert.equal(
      Temporal.ZonedDateTime.from(local, {disambiguation: 'earlier'})
        .epochNanoseconds,
      start - hour / 2n
    )
    for (const disambiguation of ['later', 'compatible'])
      assert.equal(
        Temporal.ZonedDateTime.from(local, {disambiguation}).epochNanoseconds,
        start + hour / 2n
      )
    assert.throws(
      () => Temporal.ZonedDateTime.from(local, {disambiguation: 'reject'}),
      RangeError
    )
  }
  // A shifted later candidate can still be outside the Instant range.
  const upperGap = `+275760-09-13T01:00:00[${ordinaryGap}]`
  assert.equal(
    Temporal.ZonedDateTime.from(upperGap, {disambiguation: 'earlier'})
      .epochNanoseconds,
    maxNanoseconds - 3n * hour
  )
  for (const disambiguation of ['later', 'compatible'])
    assert.throws(
      () => Temporal.ZonedDateTime.from(upperGap, {disambiguation}),
      RangeError
    )

  for (const [date, origin] of [
    ['1970-01-01', 0n],
    ['+275760-09-11', maxSeconds - 2n * 86_400n],
  ]) {
    formatter.__addTZData({
      abbrvs: 'TEST',
      offsets: 'dw0|-dw0|b40',
      zones: [
        `${pulse}|${packedRow(null, 0)}|${packedRow(origin - 18_000n, 1)}|${packedRow(origin - 10_800n, 2)}`,
      ],
    })
    const midnight = `${date}T00:00[${pulse}]`
    const center = origin * second
    assert.equal(
      Temporal.ZonedDateTime.from(midnight).epochNanoseconds,
      center - 6n * hour
    )
    const dayStart = center - 3n * hour
    const value = new Temporal.ZonedDateTime(center - 2n * hour, pulse)
    assert.equal(value.startOfDay().epochNanoseconds, dayStart)
    assert.equal(
      Temporal.ZonedDateTime.from(`${date}[${pulse}]`).epochNanoseconds,
      dayStart
    )
    assert.equal(
      Temporal.PlainDate.from(date).toZonedDateTime(pulse).epochNanoseconds,
      dayStart
    )
  }
} finally {
  hooks.deregister()
}

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
  offsets: [23n, -23n, 17n, 12n, -5n, 21n, 16n, -20n, 2n, -18n, -21n]
    .map(offset => (offset * 3600n).toString(36))
    .join('|'),
  zones: [
    'America/Phoenix|' + [row(null, 0), row(72, 1)].join('|'),
    'America/Boise|' + [row(null, 1), row(-22, 2)].join('|'),
    'America/Denver|' + [row(null, 1), row(42, 3)].join('|'),
    'America/New_York|' + [row(null, 4), row(max / hour - 33n, 5)].join('|'),
    'America/Los_Angeles|' + [row(null, 6), row(max / hour - 50n, 7)].join('|'),
    'America/Detroit|' + [row(null, 4), row(159, 5)].join('|'),
    'America/Chicago|' +
      [row(null, 8), row(-234, 9), row(46, 5), row(62, 10), row(111, 3)].join(
        '|'
      ),
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

const retainedOrigin = new Temporal.ZonedDateTime(
  max - 1131n * hour,
  'America/Los_Angeles',
  'gregory'
)
const retainedDuration = Temporal.Duration.from('PT1082H')
const retainedTarget = retainedOrigin.add(retainedDuration)
assert.equal(retainedTarget.epochNanoseconds, max - 49n * hour)
assert.equal(
  retainedOrigin.until(retainedTarget, {largestUnit: 'month'}).toString(),
  'P1M12DT50H'
)
const retainedUpper = retainedOrigin.add({months: 1, weeks: 2})
assert.equal(retainedUpper.epochNanoseconds, max - 51n * hour)
assert.equal(
  Temporal.ZonedDateTime.from(retainedUpper.toString({offset: 'never'}), {
    disambiguation: 'later',
  }).epochNanoseconds,
  max - 15n * hour
)
assert.throws(() => retainedOrigin.add({months: 1, weeks: 3}), RangeError)
const retainedOptions = {
  relativeTo: retainedOrigin,
  largestUnit: 'month',
  smallestUnit: 'week',
  roundingMode: 'ceil',
}
assert.throws(() => retainedDuration.round(retainedOptions), RangeError)
console.log(JSON.stringify({retainedWeekRound: 'RangeError'}))

const modes = [
  'trunc',
  'ceil',
  'floor',
  'expand',
  'halfCeil',
  'halfFloor',
  'halfExpand',
  'halfTrunc',
  'halfEven',
]
const negateMode = new Map([
  ['ceil', 'floor'],
  ['floor', 'ceil'],
  ['halfCeil', 'halfFloor'],
  ['halfFloor', 'halfCeil'],
])
for (const [zone, originHour, targetHour, lowerHour, upperHour, sign] of [
  ['America/Detroit', -574n, 169n, 98n, 170n, 1],
  ['America/Chicago', 812n, 63n, 140n, 59n, -1],
]) {
  const origin = new Temporal.ZonedDateTime(originHour * hour, zone, 'gregory')
  const target = new Temporal.ZonedDateTime(targetHour * hour, zone, 'gregory')
  const elapsed = Temporal.Duration.from({
    hours: Number(targetHour - originHour),
  })
  const lower = Temporal.Duration.from({weeks: sign * 4})
  const upper = Temporal.Duration.from({months: sign})
  assert.equal(origin.add(lower).epochNanoseconds, lowerHour * hour)
  assert.equal(origin.add(upper).epochNanoseconds, upperHour * hour)
  for (const roundingMode of modes) {
    const options = {largestUnit: 'month', smallestUnit: 'week', roundingMode}
    const expected =
      roundingMode === 'trunc' || roundingMode === (sign > 0 ? 'floor' : 'ceil')
        ? lower
        : upper
    assert.equal(origin.until(target, options).toString(), expected.toString())
    assert.equal(
      elapsed.round({...options, relativeTo: origin}).toString(),
      expected.toString()
    )
  }
  const increment = origin.until(target, {
    largestUnit: 'month',
    smallestUnit: 'week',
    roundingIncrement: 3,
    roundingMode: 'trunc',
  })
  assert.equal(
    increment.toString(),
    Temporal.Duration.from({weeks: sign * 3}).toString()
  )
  console.log(JSON.stringify({retainedWeekLowerBound: zone, sign}))

  const dayLower = Temporal.Duration.from({days: sign * 32})
  assert.equal(
    origin.add(dayLower).epochNanoseconds,
    (sign > 0 ? 168n : 77n) * hour
  )
  const dayOptions = {largestUnit: 'month', smallestUnit: 'day'}
  assert.equal(
    origin.until(target, dayOptions).toString(),
    Temporal.Duration.from({months: sign, days: sign}).toString()
  )
  const dayLowerModes =
    sign > 0 ? ['trunc', 'floor', 'halfFloor', 'halfTrunc'] : ['trunc', 'ceil']
  for (const roundingMode of modes) {
    const options = {...dayOptions, roundingMode, roundingIncrement: 2}
    const until = dayLowerModes.includes(roundingMode) ? dayLower : upper
    const since = dayLowerModes.includes(
      negateMode.get(roundingMode) ?? roundingMode
    )
      ? dayLower
      : upper
    assert.equal(origin.until(target, options).toString(), until.toString())
    assert.equal(
      origin.since(target, options).toString(),
      since.negated().toString()
    )
  }
  console.log(JSON.stringify({retainedDayLowerBound: zone, sign}))

  const yearOriginHour = sign > 0 ? -8590n : 8828n
  const yearOrigin = new Temporal.ZonedDateTime(
    yearOriginHour * hour,
    zone,
    'gregory'
  )
  const yearElapsed = Temporal.Duration.from({
    hours: Number(targetHour - yearOriginHour),
  })
  const monthLower = Temporal.Duration.from({months: sign * 11})
  const monthUpper = Temporal.Duration.from({years: sign})
  assert.equal(yearOrigin.add(monthLower).epochNanoseconds, originHour * hour)
  assert.equal(yearOrigin.add(monthUpper).epochNanoseconds, upperHour * hour)
  for (const roundingMode of modes) {
    const options = {largestUnit: 'year', smallestUnit: 'month', roundingMode}
    const expected =
      roundingMode === 'trunc' || roundingMode === (sign > 0 ? 'floor' : 'ceil')
        ? monthLower
        : monthUpper
    assert.equal(
      yearOrigin.until(target, options).toString(),
      expected.toString()
    )
    assert.equal(
      yearElapsed.round({...options, relativeTo: yearOrigin}).toString(),
      expected.toString()
    )
  }
  assert.equal(
    yearOrigin
      .until(target, {
        largestUnit: 'year',
        smallestUnit: 'month',
        roundingIncrement: 3,
        roundingMode: 'trunc',
      })
      .toString(),
    Temporal.Duration.from({months: sign * 9}).toString()
  )
  console.log(JSON.stringify({retainedMonthLowerBound: zone, sign}))
}

for (const [zone, calendar, startDate, months] of [
  ['America/Detroit', 'hebrew', Date.UTC(2023, 2, 5, 2), 12],
  ['America/Anchorage', 'chinese', Date.UTC(2023, 8, 20, 2), 11],
]) {
  const start = BigInt(startDate) * 1_000_000n
  const fixed = new Temporal.ZonedDateTime(start, '-05:00', calendar)
  const upperEpoch = fixed.add({years: 1}).epochNanoseconds
  Intl.DateTimeFormat.__addTZData({
    abbrvs: 'TEST',
    offsets: [(-5n * 3600n).toString(36), (21n * 3600n).toString(36)].join('|'),
    zones: [
      zone + '|' + [row(null, 0), row(upperEpoch / hour - 11n, 1)].join('|'),
    ],
  })
  const origin = new Temporal.ZonedDateTime(start, zone, calendar)
  const target = new Temporal.ZonedDateTime(upperEpoch - hour, zone, calendar)
  assert.equal(
    origin.until(target, {largestUnit: 'year'}).toString(),
    'P1Y1DT1H'
  )
  assert.equal(origin.add({years: 1}).epochNanoseconds, upperEpoch)
  assert.ok(origin.add({months}).epochNanoseconds <= target.epochNanoseconds)
  assert.ok(
    origin.add({months: months + 1}).epochNanoseconds > target.epochNanoseconds
  )
  assert.equal(
    origin
      .until(target, {largestUnit: 'year', smallestUnit: 'month'})
      .toString(),
    `P${months}M`
  )
  console.log(JSON.stringify({retainedMonthLowerBound: calendar, months}))
}

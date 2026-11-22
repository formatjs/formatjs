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
  offsets: [
    23n,
    -23n,
    17n,
    12n,
    -5n,
    21n,
    16n,
    -20n,
    2n,
    -18n,
    -21n,
    0n,
    -16n,
    11n,
  ]
    .map(offset => (offset * 3600n).toString(36))
    .join('|'),
  zones: [
    'America/Phoenix|' + [row(null, 0), row(72, 1)].join('|'),
    'America/Boise|' + [row(null, 1), row(-22, 2)].join('|'),
    'America/Denver|' + [row(null, 1), row(42, 3)].join('|'),
    'America/New_York|' + [row(null, 4), row(max / hour - 33n, 5)].join('|'),
    'America/Los_Angeles|' + [row(null, 6), row(max / hour - 50n, 7)].join('|'),
    'America/Detroit|' + [row(null, 4), row(159, 5)].join('|'),
    'America/Halifax|' + [row(null, 12), row(145, 8), row(724, 13)].join('|'),
    'America/Winnipeg|' + [row(null, 11), row(-30, 0), row(0, 1)].join('|'),
    'America/Chicago|' +
      [row(null, 8), row(-234, 9), row(46, 5), row(62, 10), row(111, 3)].join(
        '|'
      ),
  ],
})

const {Temporal} = await import(moduleUrl(temporal, 'index.js'))
for (const [backend, implementation] of [
  ['FormatJS', Temporal],
  ['native', globalThis.Temporal],
]) {
  if (!implementation) continue
  const target = implementation.ZonedDateTime.from('2023-02-28T12:00[UTC]')
  for (const [start, roundingMode, expected] of [
    ['2023-01-31T00:00[UTC]', 'ceil', 'P1M'],
    ['2023-03-31T00:00[UTC]', 'floor', '-P1M'],
  ]) {
    const origin = implementation.ZonedDateTime.from(start)
    const rounded = origin.until(target, {
      largestUnit: 'month',
      smallestUnit: 'day',
      roundingMode,
    })
    assert.equal(rounded.toString(), expected)
    const result = origin.add(rounded)
    assert.equal(result.epochNanoseconds, target.epochNanoseconds - 12n * hour)
    console.log(JSON.stringify({backend, start, roundingMode, expected}))
  }
}

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

const exactZone = 'America/Winnipeg'
const exactOrigin = new Temporal.ZonedDateTime(
  -45n * hour,
  exactZone,
  'gregory'
)
const exactTarget = new Temporal.ZonedDateTime(2n * hour, exactZone, 'gregory')
const exactElapsed = Temporal.Duration.from({hours: 47})
assert.equal(exactOrigin.add({days: 1}).epochNanoseconds, 2n * hour)
assert.equal(exactOrigin.add({days: 2}).epochNanoseconds, -20n * hour)
for (const roundingMode of modes) {
  const options = {largestUnit: 'day', smallestUnit: 'day', roundingMode}
  assert.equal(exactOrigin.until(exactTarget, options).toString(), 'P1D')
  assert.equal(exactOrigin.since(exactTarget, options).toString(), '-P1D')
  assert.equal(
    exactElapsed.round({...options, relativeTo: exactOrigin}).toString(),
    'P1D'
  )
}
assert.equal(exactElapsed.total({unit: 'day', relativeTo: exactOrigin}), 1)
console.log(
  JSON.stringify({
    exactFirstReversedSpan: exactZone,
    endpointHours: [2, -20],
    roundingModes: modes.length,
  })
)

const bubbleZone = 'America/Halifax'
const bubbleOrigin = new Temporal.ZonedDateTime(
  875n * hour,
  bubbleZone,
  'gregory'
)
const bubbleTarget = new Temporal.ZonedDateTime(
  148n * hour,
  bubbleZone,
  'gregory'
)
const bubbleElapsed = Temporal.Duration.from({hours: -727})
assert.equal(bubbleOrigin.add(bubbleElapsed).epochNanoseconds, 148n * hour)
assert.equal(
  bubbleOrigin.until(bubbleTarget, {largestUnit: 'month'}).toString(),
  '-P30DT16H'
)
for (const [fields, endpoint] of [
  [{days: -30}, 164n],
  [{days: -31}, 158n],
  [{days: -32}, 134n],
  [{months: -1}, 158n],
]) {
  assert.equal(bubbleOrigin.add(fields).epochNanoseconds, endpoint * hour)
}
for (const roundingMode of modes) {
  const options = {largestUnit: 'month', smallestUnit: 'day', roundingMode}
  assert.equal(bubbleOrigin.until(bubbleTarget, options).toString(), '-P1M')
  assert.equal(bubbleOrigin.since(bubbleTarget, options).toString(), 'P1M')
  assert.equal(
    bubbleElapsed.round({...options, relativeTo: bubbleOrigin}).toString(),
    '-P1M'
  )
}
console.log(
  JSON.stringify({
    bubbledCalendarEndpoint: bubbleZone,
    targetHour: 148,
    roundedFloorHour: 134,
    returnedHour: 158,
    roundingModes: modes.length,
  })
)

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

const foldedGapZone = 'America/New_York'
Intl.DateTimeFormat.__addTZData({
  abbrvs: 'TEST',
  offsets: [-3n, -4n, 4n]
    .map(offset => (offset * 3600n).toString(36))
    .join('|'),
  zones: [
    foldedGapZone + '|' + [row(null, 0), row(-4, 1), row(-3, 2)].join('|'),
  ],
})
const foldedGap = (local, disambiguation) =>
  Temporal.ZonedDateTime.from(`${local}[${foldedGapZone}]`, {disambiguation})
    .epochNanoseconds
const beforeGap = '1969-12-31T16:59:59.999999999'
const firstBeforeGap = foldedGap(beforeGap, 'earlier')
const lastBeforeGap = foldedGap(beforeGap, 'later')
assert.equal(firstBeforeGap, -4n * hour - 1n)
assert.equal(lastBeforeGap, -3n * hour - 1n)
assert.throws(() => foldedGap(beforeGap, 'reject'), RangeError)
assert.equal(foldedGap('1970-01-01T01:00', 'reject'), -3n * hour)
assert.throws(() => foldedGap('1970-01-01T00:00', 'reject'), RangeError)
assert.equal(foldedGap('1970-01-01T07:00', 'reject'), 3n * hour)
assert.equal(foldedGap('1970-01-01T08:00', 'reject'), 4n * hour)
console.log(
  JSON.stringify({
    foldedGapBoundary: foldedGapZone,
    beforeCandidates: [firstBeforeGap.toString(), lastBeforeGap.toString()],
    currentLater: foldedGap('1970-01-01T00:00', 'later').toString(),
  })
)

const auxiliaryGapZone = 'America/Moncton'
const maximumHour = max / hour
for (const hasOutsideReset of [false, true]) {
  const rows = [
    row(null, 0),
    row(maximumHour - 26n, 1),
    row(maximumHour, 2),
    row(maximumHour + 4n, 3),
  ]
  if (hasOutsideReset) rows.push(row(maximumHour + 5n, 4))
  Intl.DateTimeFormat.__addTZData({
    abbrvs: 'TEST',
    offsets: [2n, -4n, 16n, -3n, 18n]
      .map(offset => (offset * 3600n).toString(36))
      .join('|'),
    zones: [auxiliaryGapZone + '|' + rows.join('|')],
  })
  const disambiguate = (local, disambiguation) =>
    Temporal.ZonedDateTime.from(`${local}[${auxiliaryGapZone}]`, {
      disambiguation,
    }).epochNanoseconds
  // The actual nearest later boundary maps only to MAX + 4h.
  assert.throws(
    () => disambiguate('+275760-09-13T01:00:00', 'reject'),
    /Instant out of range/
  )
  const clippedBoundary = () => disambiguate('+275760-09-13T16:00:00', 'reject')
  if (hasOutsideReset) {
    assert.equal(clippedBoundary(), max)
    assert.throws(
      () => disambiguate('+275760-09-13T17:00:00', 'reject'),
      /Instant out of range/
    )
  } else {
    assert.throws(clippedBoundary, /Instant out of range/)
  }
  const gap = '+275760-09-12T21:00:00'
  assert.equal(disambiguate(gap, 'earlier'), max - 19n * hour)
  for (const mode of ['compatible', 'later'])
    assert.equal(disambiguate(gap, mode), max - 5n * hour)
  assert.throws(() => disambiguate(gap, 'reject'), RangeError)
  console.log(
    JSON.stringify({
      auxiliaryGapBoundary: auxiliaryGapZone,
      hasOutsideReset,
      earlierHoursFromMaximum: -19,
      laterHoursFromMaximum: -5,
    })
  )
}

const clockFoldCeil = {
  largestUnit: 'day',
  smallestUnit: 'hour',
  roundingMode: 'ceil',
}
function checkClockFold(origin, target, expected, addBack) {
  const unrounded = origin.until(target, {largestUnit: 'day'})
  const until = origin.until(target, clockFoldCeil)
  const since = origin.since(target, {...clockFoldCeil, roundingMode: 'floor'})
  const rounded = unrounded.round({...clockFoldCeil, relativeTo: origin})
  assert.equal(until.toString(), expected)
  assert.equal(since.toString(), `-${expected}`)
  assert.equal(rounded.toString(), expected)
  assert.equal(origin.add(until).epochNanoseconds, addBack)
  assert.equal(origin.subtract(since).epochNanoseconds, addBack)
  assert.equal(origin.add(rounded).epochNanoseconds, addBack)
}

const {Temporal: compact} = await import(moduleUrl(temporal, 'standalone.js'))
const havanaBackends = [['compact', compact, 'P1D']]
if (
  globalThis.Temporal &&
  process.versions.node === '26.8.1' &&
  process.versions.tz === '2026c'
)
  havanaBackends.push(['native', globalThis.Temporal, 'PT24H'])
for (const [backend, implementation, expected] of havanaBackends) {
  const earlier = implementation.ZonedDateTime.from(
    '2020-11-01T00:00-04:00[America/Havana]'
  )
  const later = implementation.ZonedDateTime.from(
    '2020-11-01T00:00-05:00[America/Havana]'
  )
  const target = implementation.ZonedDateTime.from(
    '2020-11-01T23:15-05:00[America/Havana]'
  )
  const next = implementation.ZonedDateTime.from(
    '2020-11-02T00:00-05:00[America/Havana]'
  )
  assert.equal(earlier.epochNanoseconds, 1604203200000000000n)
  assert.equal(later.epochNanoseconds, 1604206800000000000n)
  assert.equal(target.epochNanoseconds, 1604290500000000000n)
  assert.equal(next.epochNanoseconds, 1604293200000000000n)
  assert.equal(later.until(target, {largestUnit: 'day'}).toString(), 'PT23H15M')
  checkClockFold(earlier, target, 'P1D', next.epochNanoseconds)
  checkClockFold(later, target, expected, next.epochNanoseconds)
  console.log(JSON.stringify({clockFold: 'America/Havana', backend, expected}))
}

const clockFoldZone = 'America/Toronto'
Intl.DateTimeFormat.__addTZData({
  abbrvs: 'TEST',
  offsets: [3600, 0, 1800].map(offset => offset.toString(36)).join('|'),
  zones: [
    `${clockFoldZone}|${row(null, 0)}|${(-1800).toString(36)},0,1,0|${row(22n, 2)}`,
  ],
})
const foldClock = `1970-01-01T00:00[${clockFoldZone}]`
const clockEarlier = Temporal.ZonedDateTime.from(foldClock, {
  disambiguation: 'earlier',
})
const clockLater = Temporal.ZonedDateTime.from(foldClock, {
  disambiguation: 'later',
})
const clockTarget = new Temporal.ZonedDateTime((93n * hour) / 4n, clockFoldZone)
const clockNext = Temporal.ZonedDateTime.from(
  `1970-01-02T00:00[${clockFoldZone}]`,
  {disambiguation: 'reject'}
)
assert.equal(clockEarlier.epochNanoseconds, -hour)
assert.equal(clockLater.epochNanoseconds, 0n)
assert.equal(clockNext.epochNanoseconds, (47n * hour) / 2n)
assert.ok(clockTarget.toPlainDate().equals(clockLater.toPlainDate()))
assert.equal(
  clockLater.until(clockTarget, {largestUnit: 'day'}).toString(),
  'PT23H15M'
)
// §7.5.35 step 5's compatible anchor gives a 24.5h span. The actual receiver gives 23.5h.
assert.equal(
  clockNext.epochNanoseconds - clockEarlier.epochNanoseconds,
  (49n * hour) / 2n
)
checkClockFold(clockLater, clockTarget, 'P1DT1H', (49n * hour) / 2n)
assert.equal(clockLater.add('PT24H').epochNanoseconds, 24n * hour)
console.log(
  JSON.stringify({
    clockFold: clockFoldZone,
    current: 'P1DT1H',
    published: 'PT24H',
  })
)

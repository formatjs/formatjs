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
const hooks = registerHooks({
  resolve(specifier, context, nextResolve) {
    return nextResolve(dependencies.get(specifier) ?? specifier, context)
  },
})

try {
  await import(moduleUrl(datetime, 'polyfill-force.js'))
  await import(moduleUrl(datetime, 'locale-data/en.js'))
  const {Temporal} = await import(moduleUrl(temporal, 'index.js'))
  const zone = 'America/Moncton'
  const hour = 3_600_000_000_000n
  const center = BigInt(Date.UTC(2024, 2, 1)) * 1_000_000n
  const atHour = value => center + value * hour
  const resolveWall = (wall, disambiguation) =>
    Temporal.ZonedDateTime.from(`${wall}[${zone}]`, {disambiguation})
      .epochNanoseconds
  const install = (offsets, transitions) => {
    const rows = transitions.map((value, index) => {
      const second = atHour(value) / 1_000_000_000n
      return `${second.toString(36)},0,${index + 1},0`
    })
    Intl.DateTimeFormat.__addTZData({
      abbrvs: 'TEST',
      offsets: offsets.map(offset => (offset * 3600).toString(36)).join('|'),
      zones: [`${zone}|,0,0,0|${rows.join('|')}`],
    })
  }

  install([-23, 0, -22], [9n, 39n])
  assert.equal(
    resolveWall('2024-02-29T09:59:59.999999999', 'reject'),
    atHour(9n) - 1n
  )
  assert.equal(resolveWall('2024-03-01T09:00', 'reject'), atHour(9n))
  assert.equal(resolveWall('2024-03-01T23:00', 'earlier'), atHour(23n))
  assert.equal(resolveWall('2024-03-01T23:00', 'later'), atHour(45n))
  assert.equal(resolveWall('2024-03-01T00:00', 'compatible'), atHour(45n))
  console.log(JSON.stringify({spreadHours: 23, effectiveOffsetHours: -45}))

  install([-23, 0, 16, -22], [9n, 20n, 39n])
  const origin = Temporal.ZonedDateTime.from(`2024-02-01T00:00[${zone}]`)
  const target = new Temporal.ZonedDateTime(atHour(33n), zone)
  assert.equal(
    origin.until(target, {largestUnit: 'month'}).toString(),
    'P1M2DT1H'
  )
  assert.equal(origin.add({months: 1}).epochNanoseconds, atHour(45n))
  assert.equal(origin.add({months: 1, days: 3}).epochNanoseconds, atHour(94n))
  assert.equal(origin.add({days: 30}).epochNanoseconds, atHour(46n))
  assert.equal(origin.add({days: 27}).epochNanoseconds, atHour(-25n))
  const options = {
    largestUnit: 'month',
    smallestUnit: 'day',
    roundingIncrement: 3,
  }
  for (const [mode, expected, addBack] of [
    ['floor', 'P27D', -25n],
    ['trunc', 'P27D', -25n],
    ['ceil', 'P1M', 45n],
    ['halfEven', 'P1M', 45n],
  ]) {
    const result = origin.until(target, {...options, roundingMode: mode})
    assert.equal(result.toString(), expected)
    assert.equal(origin.add(result).epochNanoseconds, atHour(addBack))
    console.log(
      JSON.stringify({mode, result: expected, addBackHours: Number(addBack)})
    )
  }
  const since = origin.since(target, {...options, roundingMode: 'ceil'})
  assert.equal(since.toString(), '-P27D')
  assert.equal(origin.subtract(since).epochNanoseconds, atHour(-25n))
} finally {
  hooks.deregister()
}

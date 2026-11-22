import assert from 'node:assert/strict'
import {pathToFileURL} from 'node:url'

const {Temporal} = await import(pathToFileURL(process.argv[2]))
const native = globalThis.Temporal
assert.ok(native)
const limit = 8_640_000_000_000_000_000_000n
const day = 86_400_000_000_000n
const zones = [
  'UTC',
  'America/Santiago',
  'Pacific/Easter',
  'Pacific/Apia',
  'Asia/Kathmandu',
  'America/New_York',
  'Australia/Lord_Howe',
]
const prefixes = [
  {months: 1, weeks: 1},
  {years: 1, weeks: 1},
  {years: 1, months: 1, weeks: 1},
]
const modes = [
  'ceil',
  'floor',
  'expand',
  'trunc',
  'halfCeil',
  'halfFloor',
  'halfExpand',
  'halfTrunc',
  'halfEven',
]

function relativeTo(end, zone, fields) {
  const origin = new Temporal.ZonedDateTime(end, zone).subtract(fields)
  assert.equal(origin.add(fields).epochNanoseconds, end)
  return origin.toString()
}

let cases = 0
const errors = new Set()
for (const sign of [1, -1]) {
  const bound = BigInt(sign) * limit
  const inside = bound - BigInt(sign) * 14n * day
  for (const timeZone of zones) {
    for (const prefix of prefixes) {
      const fields = Object.fromEntries(
        Object.entries(prefix).map(([key, count]) => [key, sign * count])
      )
      const nearEnd = relativeTo(bound, timeZone, fields)
      const insideRange = relativeTo(inside, timeZone, fields)
      for (const largestUnit of ['month', 'year']) {
        for (const roundingMode of modes) {
          const options = {largestUnit, smallestUnit: 'week', roundingMode}
          for (const runtime of [Temporal, native]) {
            const duration = runtime.Duration.from(fields)
            assert.doesNotThrow(() =>
              duration.round({...options, relativeTo: insideRange})
            )
            assert.throws(
              () => duration.round({...options, relativeTo: nearEnd}),
              error => {
                errors.add(error.message)
                return error instanceof RangeError
              }
            )
          }
          cases++
        }
      }
    }
  }
}
assert.equal(cases, 756)
console.log(
  JSON.stringify({
    cases,
    outsidePerCase: 2,
    insidePerCase: 2,
    errors: [...errors].sort(),
  })
)

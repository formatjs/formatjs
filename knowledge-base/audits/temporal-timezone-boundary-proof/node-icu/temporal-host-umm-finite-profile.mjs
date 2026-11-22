import assert from 'node:assert/strict'
import {createHash} from 'node:crypto'
import {readFileSync} from 'node:fs'

const calendar = 'islamic-umalqura'
const major = process.versions.icu.split('.')[0]
assert.equal(major, '78')
const sha256 = createHash('sha256')
  .update(readFileSync(process.execPath))
  .digest('hex')
const civil = year =>
  -492148 + 354 * (year - 1) + Math.floor((3 + 11 * year) / 30)
const formatter = new Intl.DateTimeFormat('en-US-u-nu-latn', {
  __proto__: null,
  calendar,
  timeZone: 'UTC',
  year: 'numeric',
  month: 'numeric',
  day: 'numeric',
})
assert.equal(formatter.resolvedOptions().calendar, calendar)
const day = 86400000
const starts = new Map()
const tables = new Map()
const observations = createHash('sha256')
let last
let minLength = Infinity
let maxLength = -Infinity
let scanned = 0
for (let epoch = civil(1299) - 10; epoch <= civil(1603) + 10; epoch++) {
  const fields = Object.fromEntries(
    formatter
      .formatToParts(epoch * day)
      .filter(part => part.type !== 'literal')
      .map(part => [part.type, part.value])
  )
  const y = Number(fields.year),
    m = Number(fields.month),
    d = Number(fields.day)
  assert.ok(Number.isSafeInteger(y) && m >= 1 && m <= 12 && d >= 1 && d <= 30)
  if (last) {
    if (d !== 1) {
      assert.deepEqual([y, m, d], [last.y, last.m, last.d + 1], '' + epoch)
    } else {
      assert.deepEqual(
        [y, m],
        last.m === 12 ? [last.y + 1, 1] : [last.y, last.m + 1],
        '' + epoch
      )
      assert.ok(last.d === 29 || last.d === 30, '' + epoch)
      minLength = Math.min(minLength, last.d)
      maxLength = Math.max(maxLength, last.d)
    }
  }
  if (d === 1 && m === 1) starts.set(y, epoch)
  if (d === 1) {
    const months = tables.get(y) ?? []
    // The first partial scanned year is outside the target annual window.
    if (y >= 1299) assert.equal(months.length, m - 1)
    months.push(epoch)
    tables.set(y, months)
  }
  last = {y, m, d}
  observations.update(`${epoch}\t${y}\t${m}\t${d}\n`)
  scanned++
}
assert.equal(starts.get(1300), civil(1300))
assert.equal(starts.get(1601), civil(1601))
let maximumProbeSteps = 0
let minimumProbeDifference = Infinity
let maximumProbeDifference = -Infinity
for (let year = 1300; year <= 1601; year++) {
  assert.equal(tables.get(year).length, 12)
  // The shipping source's probe is already in the next year. The
  // backwards walk traverses scanned year partitions only.
  const probe = civil(year) + 400
  const nextStarts = tables.get(year + 1)
  assert.ok(probe >= nextStarts[0] && probe < starts.get(year + 2))
  const visited = nextStarts.filter(value => value <= probe).length + 12
  assert.ok(visited < 40)
  maximumProbeSteps = Math.max(maximumProbeSteps, visited)
  minimumProbeDifference = Math.min(
    minimumProbeDifference,
    probe - starts.get(year)
  )
  maximumProbeDifference = Math.max(
    maximumProbeDifference,
    probe - starts.get(year)
  )
}
const result = {
  runtime: {
    node: process.version,
    icu: process.versions.icu,
    tz: process.versions.tz,
  },
  runtimeSha256: sha256,
  calendar,
  scanned,
  minLength,
  maxLength,
  civilJoinEpochs: [starts.get(1300), starts.get(1601)],
  maximumProbeSteps,
  minimumProbeDifference,
  maximumProbeDifference,
  observationsSha256: observations.digest('hex'),
}
console.log(JSON.stringify(result, null, 2))

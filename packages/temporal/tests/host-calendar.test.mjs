import assert from 'node:assert/strict'
import {pathToFileURL} from 'node:url'
import {runfiles} from '@bazel/runfiles'

const {Temporal} = await import(
  pathToFileURL(runfiles.resolve(process.argv[2]))
)

// Hong Kong Observatory: 2023 leap second month; 2024 lunar new year.
for (const calendar of ['chinese', 'dangi']) {
  const leap = Temporal.PlainDate.from('2023-03-22').withCalendar(calendar)
  assert.deepEqual(
    [leap.year, leap.month, leap.monthCode, leap.day],
    [2023, 3, 'M02L', 1]
  )
  assert.equal(leap.daysInMonth, 29)
  assert.equal(leap.monthsInYear, 13)
  assert.equal(leap.add({months: -1}).toString().slice(0, 10), '2023-02-20')
  assert.equal(leap.add({months: 1}).toString().slice(0, 10), '2023-04-20')
  assert.equal(leap.add({years: 1}).monthCode, 'M02')
  assert.throws(() => leap.add({years: 1}, {overflow: 'reject'}), RangeError)
  const next = Temporal.PlainDate.from('2024-02-10').withCalendar(calendar)
  assert.deepEqual([next.year, next.monthCode, next.day], [2024, 'M01', 1])
  assert.equal(leap.until(next, {largestUnit: 'month'}).months, 11)
  assert.equal(next.until(leap, {largestUnit: 'month'}).months, -11)
  assert.equal(
    leap.add({months: 24}).subtract({months: 24}).toString(),
    leap.toString()
  )
}

const ummAlQura =
  Temporal.PlainDate.from('2024-03-11').withCalendar('islamic-umalqura')
assert.deepEqual([ummAlQura.year, ummAlQura.month, ummAlQura.day], [1445, 9, 1])
assert.equal(ummAlQura.daysInMonth, 30)
for (const year of [1200, 1700]) {
  const input = {year, month: 3, day: 11}
  assert.equal(
    Temporal.PlainDate.from({...input, calendar: 'islamic-umalqura'})
      .toString()
      .slice(0, 10),
    Temporal.PlainDate.from({...input, calendar: 'islamic-civil'})
      .toString()
      .slice(0, 10)
  )
}

const originalParts = Intl.DateTimeFormat.prototype.formatToParts
try {
  Intl.DateTimeFormat.prototype.formatToParts = () => {
    throw new Error('poisoned Intl')
  }
  assert.equal(
    Temporal.PlainDate.from('2028-01-26').withCalendar('chinese').day,
    1
  )
} finally {
  Intl.DateTimeFormat.prototype.formatToParts = originalParts
}
console.log(
  'Host calendar conversion, leap arithmetic, civil fallback and captured intrinsics pass'
)

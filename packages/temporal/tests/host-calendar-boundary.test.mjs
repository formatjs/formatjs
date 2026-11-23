import assert from 'node:assert/strict'
import {join} from 'node:path'
import {pathToFileURL} from 'node:url'
import {runfiles} from '@bazel/runfiles'

const {Temporal: Host} = await import(
  pathToFileURL(runfiles.resolve(process.argv[2]))
)
const {Temporal: Standalone} = await import(
  pathToFileURL(join(runfiles.resolve(process.argv[3]), 'standalone.js'))
)
const properties = [
  'year',
  'month',
  'monthCode',
  'day',
  'dayOfYear',
  'daysInMonth',
  'daysInYear',
  'monthsInYear',
]
let checked = 0
function yearMonth(value) {
  try {
    return value.toPlainYearMonth().toString()
  } catch (error) {
    if (!(error instanceof RangeError)) throw error
    return {error: error.name}
  }
}
function roundTrip(value) {
  assert.equal(
    Host.PlainDate.from({
      calendar: value.calendarId,
      year: value.year,
      monthCode: value.monthCode,
      day: value.day,
    }).toString(),
    value.toString()
  )
  assert.equal(value.add({days: 0}).toString(), value.toString())
  checked++
}
for (const calendar of ['chinese', 'dangi', 'islamic-umalqura']) {
  for (const iso of [
    '-271821-04-19',
    '-271821-04-20',
    '-271821-04-21',
    '+275760-09-12',
    '+275760-09-13',
  ]) {
    const value = Host.PlainDate.from(iso).withCalendar(calendar),
      control = Standalone.PlainDate.from(iso).withCalendar(calendar)
    for (const property of properties)
      assert.equal(
        value[property],
        control[property],
        `${iso} ${calendar} ${property}`
      )
    roundTrip(value)
    assert.deepEqual(yearMonth(value), yearMonth(control))
  }
}
// Reconstruct dates on both sides of compact/host data joins.
for (const calendar of ['chinese', 'dangi']) {
  const base = Host.PlainDate.from('2000-02-05').withCalendar(calendar),
    control = Standalone.PlainDate.from('2000-02-05').withCalendar(calendar)
  for (const months of [-3000000, -10000, 10000, 3000000])
    assert.equal(
      base.add({months}).toString(),
      control.add({months}).toString()
    )
  assert.throws(() => base.add({months: 4294967295}), RangeError)
  for (const year of [
    1899,
    calendar === 'chinese' ? 2102 : 2052,
    -271816,
    -271815,
    275755,
  ]) {
    const joinDate = Standalone.PlainDate.from({
      calendar,
      year,
      month: 1,
      day: 1,
    })
    for (let delta = -2; delta <= 2; delta++)
      roundTrip(Host.PlainDate.from(joinDate.add({days: delta}).toString()))
  }
}
// Host Umm range is1300..1600; pinned ICU starts match civil fallback at both joins.
const ummCalendar = 'islamic-umalqura'
for (const [iso, year, month, monthCode, day] of [
  ['1882-11-11', 1299, 12, 'M12', 29],
  ['1882-11-12', 1300, 1, 'M01', 1],
  ['1882-11-13', 1300, 1, 'M01', 2],
  ['2174-11-25', 1600, 12, 'M12', 30],
  ['2174-11-26', 1601, 1, 'M01', 1],
  ['2174-11-27', 1601, 1, 'M01', 2],
]) {
  const value = Host.PlainDate.from(iso).withCalendar(ummCalendar)
  assert.deepEqual(
    [value.year, value.month, value.monthCode, value.day],
    [year, month, monthCode, day],
    `Host Umm join ${iso}`
  )
  assert.equal(
    Host.PlainDate.from(
      {calendar: ummCalendar, year, month, monthCode, day},
      {overflow: 'reject'}
    ).toString(),
    `${iso}[u-ca=islamic-umalqura]`
  )
  checked++
}
for (const [before, after] of [
  ['1882-11-11', '1882-11-12'],
  ['2174-11-25', '2174-11-26'],
]) {
  assert.equal(
    Host.PlainDate.from(before)
      .withCalendar(ummCalendar)
      .add({days: 1})
      .toString(),
    `${after}[u-ca=islamic-umalqura]`
  )
  assert.equal(
    Host.PlainDate.from(after)
      .withCalendar(ummCalendar)
      .subtract({days: 1})
      .toString(),
    `${before}[u-ca=islamic-umalqura]`
  )
}
console.log(`Host calendar boundary and join cases: ${checked}`)

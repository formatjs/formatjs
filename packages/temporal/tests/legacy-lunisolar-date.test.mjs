import assert from 'node:assert/strict'
import {readFileSync} from 'node:fs'
import {join} from 'node:path'
import {pathToFileURL} from 'node:url'
import {runfiles} from '@bazel/runfiles'

const Native = Intl.DateTimeFormat
const nativeParts = Native.prototype.formatToParts
const directory = runfiles.resolve(process.argv[2])
const {Temporal} = await import(pathToFileURL(join(directory, 'index.js')))
const rows = readFileSync(runfiles.resolve(process.argv[3]), 'utf8')
  .trim()
  .split('\n')
  .filter(line => {
    const row = line.split('\t')
    return (
      row[0] === 'F' &&
      ['chinese', 'dangi'].includes(row[1]) &&
      +row[3] >= 1900 &&
      +row[3] <= (row[1] === 'chinese' ? 2100 : 2050)
    )
  })
  .map(line => line.split('\t'))
assert.equal(rows.length, 8708, 'Complete authority-range field selection')
const numericOptions = {
  timeZone: 'UTC',
  year: 'numeric',
  month: 'numeric',
  day: 'numeric',
}
const originals = new Map(
  ['chinese', 'dangi'].map(calendar => [
    calendar,
    new Native('en-US-u-nu-latn', {calendar, ...numericOptions}),
  ])
)
const map = parts =>
  Object.fromEntries(parts.map(part => [part.type, part.value]))
const expected = row => ({
  relatedYear: row[3],
  month: String(+row[5].slice(1, 3)) + (row[5].endsWith('L') ? 'bis' : ''),
  day: row[6],
})
const differences = rows.filter(row => {
  const actual = map(
    nativeParts.call(originals.get(row[1]), +row[2] * 86400000)
  )
  return Object.entries(expected(row)).some(
    ([key, value]) => actual[key] !== value
  )
})
await import(pathToFileURL(join(directory, 'polyfill-force.js')))
const formatters = new Map(
  ['chinese', 'dangi'].map(calendar => [
    calendar,
    new Intl.DateTimeFormat('en-US-u-nu-latn', {calendar, ...numericOptions}),
  ])
)
let checked = 0
for (const row of rows) {
  const milliseconds = +row[2] * 86400000
  const value = new Temporal.ZonedDateTime(
    BigInt(milliseconds) * 1000000n,
    'UTC',
    row[1]
  ).toPlainDate()
  const formatter = formatters.get(row[1])
  for (const input of [milliseconds, value]) {
    const parts = formatter.formatToParts(input),
      actual = map(parts)
    for (const [key, wanted] of Object.entries(expected(row)))
      assert.equal(actual[key], wanted, row.join('\t') + ' ' + key)
    assert.equal(
      formatter.format(input),
      parts.map(part => part.value).join('')
    )
    checked++
  }
}
for (const calendar of ['chinese', 'dangi']) {
  for (const locale of ['en-US', 'ar-EG', 'ja', 'bn', 'zh-Hans-u-nu-hanidec']) {
    for (const month of ['numeric', '2-digit', 'long', 'narrow']) {
      const options = {
        calendar,
        timeZone: 'UTC',
        year: 'numeric',
        month,
        day: '2-digit',
        weekday: 'long',
        hour: '2-digit',
        minute: '2-digit',
      }
      const formatter = new Intl.DateTimeFormat(locale, options)
      const native = new Native(locale, options)
      const candidates = differences
        .filter(row => row[1] === calendar)
        .slice(0, 16)
      for (const row of candidates) {
        const milliseconds = +row[2] * 86400000 + 12 * 3600000
        const value = new Temporal.ZonedDateTime(
          BigInt(milliseconds) * 1000000n,
          'UTC',
          calendar
        ).toPlainDateTime()
        const parts = formatter.formatToParts(value),
          actual = map(parts)
        const control = rows.find(
          candidate =>
            candidate[1] === calendar &&
            candidate[5] === row[5] &&
            candidate[6] === row[6] &&
            !differences.includes(candidate)
        )
        assert(control, 'Independent matching label control')
        const labels = map(
          nativeParts.call(native, +control[2] * 86400000 + 12 * 3600000)
        )
        assert.equal(actual.day, labels.day)
        assert.equal(actual.month, labels.month)
        const original = map(nativeParts.call(native, milliseconds))
        for (const key of ['weekday', 'hour', 'minute', 'dayPeriod'])
          assert.equal(actual[key], original[key])
        assert.equal(
          formatter.format(value),
          parts.map(part => part.value).join('')
        )
        const number = formatter.formatToParts(milliseconds)
        assert.deepEqual(number, parts)
        assert.equal(
          value.toLocaleString(locale, options),
          formatter.format(value)
        )
        const last = milliseconds + 86400000
        const range = formatter.formatRangeToParts(milliseconds, last)
        assert(range.some(part => part.source === 'startRange'))
        assert(range.some(part => part.source === 'endRange'))
        assert.equal(
          formatter.formatRange(milliseconds, last),
          range.map(part => part.value).join('')
        )
        for (const [source, instant] of [
          ['startRange', milliseconds],
          ['endRange', last],
        ]) {
          const expectedParts = map(formatter.formatToParts(instant))
          for (const part of range.filter(
            part => part.source === source && part.type !== 'literal'
          ))
            assert.equal(
              part.value,
              expectedParts[part.type],
              source + ' ' + part.type
            )
        }
        checked++
      }
    }
  }
}
for (const row of differences) {
  const milliseconds = +row[2] * 86400000 + 12 * 3600000
  for (const timeZone of [
    'America/New_York',
    'Asia/Shanghai',
    'Pacific/Honolulu',
  ]) {
    const formatter = new Intl.DateTimeFormat('en-US-u-nu-latn', {
      ...numericOptions,
      calendar: row[1],
      timeZone,
      weekday: 'long',
      hour: 'numeric',
    })
    const native = new Native('en-US-u-nu-latn', {
      ...numericOptions,
      calendar: row[1],
      timeZone,
      weekday: 'long',
      hour: 'numeric',
    })
    const actual = map(formatter.formatToParts(milliseconds))
    for (const [key, wanted] of Object.entries(expected(row)))
      assert.equal(actual[key], wanted, timeZone + ' ' + row.join('\t'))
    const original = map(nativeParts.call(native, milliseconds))
    assert.equal(actual.weekday, original.weekday)
    assert.equal(actual.hour, original.hour)
    checked++
  }
}
for (const calendar of ['chinese', 'dangi']) {
  const formatter = formatters.get(calendar)
  const before = Temporal.Now.plainDateISO('UTC').withCalendar(calendar)
  const current = formatter.format()
  const after = Temporal.Now.plainDateISO('UTC').withCalendar(calendar)
  assert([formatter.format(before), formatter.format(after)].includes(current))
}
for (const [calendar, dates, month, monthCodes, days] of [
  ['chinese', ['1954-02-04', '1954-02-05'], 'long', ['M01', 'M01'], [2, 3]],
  ['chinese', ['1954-02-04', '1954-03-06'], undefined, ['M01', 'M02'], [2, 2]],
  ['dangi', ['2017-02-27', '2017-02-28'], 'long', ['M02', 'M02'], [2, 3]],
  ['dangi', ['2017-02-27', '2017-03-29'], undefined, ['M02', 'M03'], [2, 2]],
]) {
  const options = {calendar, timeZone: 'UTC', month, day: 'numeric'}
  const numbers = dates.map(date => Date.parse(`${date}T00:00Z`))
  const plain = dates.map(date =>
    Temporal.PlainDate.from(date).withCalendar(calendar)
  )
  assert.deepEqual(
    plain.map(date => date.monthCode),
    monthCodes
  )
  assert.deepEqual(
    plain.map(date => date.day),
    days
  )
  const raw = new Native('en', options).formatRangeToParts(...numbers)
  assert.deepEqual(
    raw.filter(part => part.type === 'month').map(part => part.source),
    month ? ['shared'] : ['startRange', 'endRange']
  )
  const expected = raw.map(part => {
    if (part.type !== 'day') return part
    const end = part.source === 'endRange'
    assert.equal(part.value, end ? '2' : '1')
    return {...part, value: String(days[end ? 1 : 0])}
  })
  const formatter = new Intl.DateTimeFormat('en', options)
  for (const input of [numbers, plain]) {
    assert.deepEqual(formatter.formatRangeToParts(...input), expected)
    assert.equal(
      formatter.formatRange(...input),
      expected.map(part => part.value).join('')
    )
    checked++
  }
}
console.log(
  `${rows.length} independent lunar field rows; ${differences.length} native data differences; ${checked} formatting checks`
)

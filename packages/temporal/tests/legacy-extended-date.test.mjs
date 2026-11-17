import assert from 'node:assert/strict'
import {readFileSync} from 'node:fs'
import {join} from 'node:path'
import {pathToFileURL} from 'node:url'
import {runfiles} from '@bazel/runfiles'

const directory = runfiles.resolve(process.argv[2])
const rows = readFileSync(runfiles.resolve(process.argv[3]), 'utf8')
  .trim()
  .split('\n')
  .filter(line => !line.startsWith('#'))
  .map(line => {
    const [kind, ...values] = line.split('\t')
    const [
      milliseconds,
      year,
      month,
      day,
      hour,
      minute,
      second,
      millisecond,
      weekday,
      eraYear,
    ] = values.map(Number)
    return {
      kind,
      milliseconds,
      year,
      month,
      day,
      hour,
      minute,
      second,
      millisecond,
      weekday,
      eraYear,
    }
  })
assert.equal(rows.length, 19, 'Complete independent ICU boundary corpus')
const {Temporal} = await import(pathToFileURL(join(directory, 'index.js')).href)
const Native = Intl.DateTimeFormat
const options = {
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
  weekday: 'long',
  era: 'short',
  hour: '2-digit',
  minute: '2-digit',
  second: '2-digit',
  fractionalSecondDigits: 3,
  hourCycle: 'h23',
  timeZone: 'UTC',
}
const profiles = ['en', 'ar-EG', 'ja', 'bn', 'zh-Hans-u-nu-hanidec'].flatMap(
  locale =>
    ['iso8601', 'gregory'].map(calendar => {
      const weekday = new Native(locale, {weekday: 'long', timeZone: 'UTC'}),
        era = new Native(locale, {
          calendar,
          era: 'short',
          year: 'numeric',
          timeZone: 'UTC',
        })
      return {
        locale,
        calendar,
        weekdays: Array.from({length: 7}, (_, index) =>
          weekday.format((index + 4) * 86400000)
        ),
        eras: [-62167219200000, 946684800000].map(
          milliseconds =>
            era.formatToParts(milliseconds).find(part => part.type === 'era')
              ?.value
        ),
        numbers: [1, 2, 3].map(
          minimumIntegerDigits =>
            new Intl.NumberFormat(locale, {
              useGrouping: false,
              minimumIntegerDigits,
            }).format
        ),
      }
    })
)
function values(row, calendar) {
  if (row.kind === 'yearmonth')
    return [new Temporal.PlainYearMonth(row.year, row.month, calendar)]
  const dateTime = new Temporal.PlainDateTime(
    row.year,
    row.month,
    row.day,
    row.hour,
    row.minute,
    row.second,
    row.millisecond,
    0,
    123,
    calendar
  )
  return [dateTime, dateTime.toPlainDate()]
}
const before = profiles.map(profile =>
  rows.flatMap(row =>
    values(row, profile.calendar).map(value =>
      value.toLocaleString(profile.locale, {
        ...options,
        calendar: profile.calendar,
      })
    )
  )
)
await import(pathToFileURL(join(directory, 'polyfill-force.js')).href)

function expected(row, profile, type) {
  const {numbers, weekdays, eras} = profile
  if (type === 'year') return numbers[0](row.eraYear)
  if (type === 'month') return numbers[1](row.month)
  if (type === 'day') return numbers[1](row.day)
  if (type === 'hour') return numbers[1](row.hour)
  if (type === 'minute') return numbers[1](row.minute)
  if (type === 'second') return numbers[1](row.second)
  if (type === 'fractionalSecond') return numbers[2](row.millisecond)
  if (type === 'weekday') return weekdays[row.weekday - 1]
  if (type === 'era') return eras[Number(row.year > 0)]
  throw new Error('Unexpected field: ' + type)
}
let cases = 0,
  ranges = 0
for (const [index, profile] of profiles.entries()) {
  const formatter = new Intl.DateTimeFormat(profile.locale, {
    ...options,
    calendar: profile.calendar,
  })
  let position = 0
  for (const row of rows)
    for (const value of values(row, profile.calendar)) {
      const parts = formatter.formatToParts(value)
      for (const part of parts)
        if (part.type !== 'literal')
          assert.equal(
            part.value,
            expected(row, profile, part.type),
            `${profile.locale} ${row.milliseconds} ${part.type}`
          )
      const text = parts.map(part => part.value).join('')
      assert.equal(formatter.format(value), text)
      assert.equal(
        value.toLocaleString(profile.locale, {
          ...options,
          calendar: profile.calendar,
        }),
        before[index][position++]
      )
      assert.equal(text, before[index][position - 1])
      cases++
    }
  const datetimes = rows.filter(row => row.kind === 'datetime'),
    first = datetimes[0],
    last = datetimes[datetimes.length - 1],
    at = milliseconds =>
      datetimes.find(row => row.milliseconds === milliseconds),
    pairs = [
      [first, last],
      [first, at(-8639999999999999)],
      [first, at(first.milliseconds + 12622780800000)],
      [at(last.milliseconds - 12622780800000), last],
      [first, at(-62135640000000)],
      [at(-62135553600000), last],
      [first, first],
      [last, last],
    ]
  for (const [start, end] of pairs) {
    assert(start && end, 'Complete range fixture selection')
    const a = values(start, profile.calendar)[0],
      b = values(end, profile.calendar)[0],
      parts = formatter.formatRangeToParts(a, b)
    for (const part of parts)
      if (part.type !== 'literal') {
        const row = part.source === 'endRange' ? end : start
        const value = expected(row, profile, part.type),
          alternatives = ['month', 'day', 'hour', 'minute', 'second'].includes(
            part.type
          )
            ? [value, profile.numbers[0](row[part.type])]
            : [value]
        assert(
          alternatives.includes(part.value),
          `${profile.locale} ${part.source} ${part.type}: ${part.value} !== ${value}`
        )
        if (part.source === 'shared')
          assert.equal(
            expected(start, profile, part.type),
            expected(end, profile, part.type)
          )
      }
    assert.equal(
      formatter.formatRange(a, b),
      parts.map(part => part.value).join('')
    )
    ranges++
  }
  assert.throws(() => formatter.format(8640000000000001), RangeError)
  const a = new Temporal.PlainDateTime(2020, 1, 1, 0, 0, 0, 0, 0, 2),
    b = new Temporal.PlainDateTime(2020, 1, 1, 0, 0, 0, 0, 0, 1)
  assert.equal(formatter.formatRange(a, b), formatter.format(a))
  assert(
    formatter.formatRangeToParts(a, b).every(part => part.source === 'shared')
  )
  if (profile.locale === 'en') {
    const short = new Intl.DateTimeFormat('en', {
      calendar: profile.calendar,
      year: '2-digit',
      month: '2-digit',
      day: '2-digit',
    })
    for (const row of [first, last])
      assert.equal(
        short
          .formatToParts(values(row, profile.calendar)[0])
          .find(part => part.type === 'year').value,
        profile.numbers[1](row.eraYear % 100)
      )
  }
}
assert.equal(cases, 360)
assert.equal(ranges, 80)
console.log(
  JSON.stringify({
    icuGregorianFields: cases,
    ranges,
    locales: profiles.length / 2,
  })
)

import assert from 'node:assert/strict'
import {readFileSync} from 'node:fs'
import {join} from 'node:path'
import {pathToFileURL} from 'node:url'
import {runfiles} from '@bazel/runfiles'

const Native = Intl.DateTimeFormat
const directory = runfiles.resolve(process.argv[2])
let {Temporal} = await import(pathToFileURL(join(directory, 'index.js')))
if (process.env.FORMATJS_TEMPORAL_EXTENDED_WASM) {
  const instance = new WebAssembly.Instance(
    new WebAssembly.Module(
      readFileSync(join(directory, 'temporal-backend.wasm'))
    ),
    {}
  )
  if (process.env.FORMATJS_TEMPORAL_EXTENDED_WASM === 'native')
    Temporal = (
      await import(pathToFileURL(join(directory, 'wasm-native.js')))
    ).configureTemporalWasm(instance)
  else
    (
      await import(pathToFileURL(join(directory, 'wasm.js')))
    ).configureWasmBackend(instance)
}
const calendars = [
  'buddhist',
  'japanese',
  'roc',
  'coptic',
  'ethiopic',
  'ethioaa',
  'hebrew',
  'indian',
  'islamic-civil',
  'islamic-tbla',
  'persian',
  'chinese',
  'dangi',
  'islamic-umalqura',
]
const rows = readFileSync(runfiles.resolve(process.argv[3]), 'utf8')
  .trim()
  .split('\n')
  .filter(line => !line.startsWith('#'))
  .map(line => {
    const row = line.split('\t')
    return {
      kind: row[0],
      calendar: row[1],
      milliseconds: +row[2],
      iso: row.slice(3, 10).map(Number),
      year: +row[10],
      month: +row[11],
      day: +row[12],
      era: row[13],
      eraYear: +row[14],
      weekday: +row[15],
    }
  })
assert.equal(rows.length, 60, 'Complete independent ICU boundary corpus')
function value(row) {
  return row.kind === 'yearmonth'
    ? new Temporal.PlainYearMonth(
        row.iso[0],
        row.iso[1],
        row.calendar,
        row.iso[2]
      )
    : new Temporal.PlainDateTime(...row.iso, 0, 123, row.calendar)
}
const profiles = [
  'en',
  'ar-EG',
  'bn',
  'zh-Hans-u-nu-hanidec',
  'en-u-nu-mathsans',
].map(locale => ({
  locale,
  number: new Intl.NumberFormat(locale, {
    useGrouping: false,
    maximumFractionDigits: 0,
  }).format,
  two: new Intl.NumberFormat(locale, {
    useGrouping: false,
    minimumIntegerDigits: 2,
    maximumFractionDigits: 0,
  }).format,
  three: new Intl.NumberFormat(locale, {
    useGrouping: false,
    minimumIntegerDigits: 3,
    maximumFractionDigits: 0,
  }).format,
  weekdays: Array.from({length: 7}, (_, day) =>
    new Native(locale, {weekday: 'long', timeZone: 'UTC'}).format(
      (day + 4) * 86400000
    )
  ),
}))
const options = {
  year: 'numeric',
  month: 'numeric',
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
const before = profiles.map(profile =>
  rows.map(row =>
    value(row).toLocaleString(profile.locale, {
      ...options,
      calendar: row.calendar,
    })
  )
)
await import(pathToFileURL(join(directory, 'polyfill-force.js')))
Intl.DateTimeFormat.__addTemporalNamespace(Temporal)
let checked = 0
for (const [index, profile] of profiles.entries()) {
  for (const [position, row] of rows.entries()) {
    const input = value(row),
      formatter = new Intl.DateTimeFormat(profile.locale, {
        ...options,
        calendar: row.calendar,
      }),
      parts = formatter.formatToParts(input),
      actual = Object.fromEntries(parts.map(part => [part.type, part.value]))
    assert.equal(actual.year, profile.number(row.eraYear), JSON.stringify(row))
    if (row.era === 'bh' && profile.locale === 'en')
      assert.equal(actual.era, 'BH')
    assert(
      [profile.number(row.month), profile.two(row.month)].includes(
        actual.month
      ),
      JSON.stringify(row) + ' month'
    )
    if (row.kind === 'datetime') {
      assert.equal(actual.day, profile.two(row.day), JSON.stringify(row))
      assert.equal(actual.weekday, profile.weekdays[row.weekday - 1])
      assert.equal(actual.fractionalSecond, profile.three(row.iso[6]))
      for (const [field, value] of [
        ['hour', row.iso[3]],
        ['minute', row.iso[4]],
        ['second', row.iso[5]],
      ])
        assert.equal(actual[field], profile.two(value))
    } else
      assert(
        !parts.some(part =>
          ['day', 'weekday', 'hour', 'minute', 'second'].includes(part.type)
        )
      )
    assert.equal(
      formatter.format(input),
      parts.map(part => part.value).join('')
    )
    assert.equal(
      input.toLocaleString(profile.locale, {
        ...options,
        calendar: row.calendar,
      }),
      before[index][position]
    )
    assert.throws(
      () => formatter.format(row.milliseconds),
      RangeError,
      'Ordinary numeric Date input still clips'
    )
    const equal = formatter.formatRangeToParts(input, input)
    assert(equal.every(part => part.source === 'shared'))
    assert.equal(formatter.formatRange(input, input), formatter.format(input))
    const short = new Intl.DateTimeFormat(profile.locale, {
      calendar: row.calendar,
      year: '2-digit',
      month: 'numeric',
      timeZone: 'UTC',
    })
    assert.equal(
      short.formatToParts(input).find(part => part.type === 'year').value,
      Array.from(profile.two(row.eraYear)).slice(-2).join('')
    )
    checked += 2
  }
}
for (const calendar of calendars) {
  const start = Temporal.PlainDate.from('-271821-04-19').withCalendar(calendar)
  const end = Temporal.PlainDate.from('+275760-09-13').withCalendar(calendar)
  if (['hebrew', 'persian', 'chinese', 'dangi'].includes(calendar)) {
    const formatter = new Intl.DateTimeFormat('en-US', {
      calendar,
      year: 'numeric',
      month: 'numeric',
      day: 'numeric',
      timeZone: 'UTC',
    })
    for (const value of [start, end]) {
      const actual = Object.fromEntries(
        formatter.formatToParts(value).map(part => [part.type, part.value])
      )
      assert.equal(
        actual[
          calendar === 'chinese' || calendar === 'dangi'
            ? 'relatedYear'
            : 'year'
        ],
        String(value.eraYear ?? value.year)
      )
      assert.equal(actual.day, String(value.day))
      if (calendar !== 'hebrew')
        assert.equal(
          actual.month,
          String(+value.monthCode.slice(1, 3)) +
            (value.monthCode.endsWith('L') ? 'bis' : '')
        )
    }
  }
  for (const locale of ['en', 'ar-EG', 'ja', 'bn', 'zh-Hans-u-nu-hanidec']) {
    for (const dateStyle of ['full', 'short']) {
      const formatter = new Intl.DateTimeFormat(locale, {
        calendar,
        dateStyle,
        timeZone: 'America/New_York',
      })
      for (const [one, two] of [
        [start, start.add({days: 1})],
        [start, end],
        [end, start],
      ]) {
        const range = formatter.formatRangeToParts(one, two)
        assert.equal(
          formatter.formatRange(one, two),
          range.map(part => part.value).join('')
        )
        for (const [source, input] of [
          ['startRange', one],
          ['endRange', two],
        ]) {
          const expected = Object.fromEntries(
            formatter.formatToParts(input).map(part => [part.type, part.value])
          )
          const fields = range.filter(
            part => part.source === source && part.type !== 'literal'
          )
          assert(fields.length > 0, calendar + ' ' + source)
          for (const part of fields)
            assert.equal(part.value, expected[part.type])
        }
        checked++
      }
    }
  }
}
for (const calendar of calendars) {
  for (const locale of ['en', 'ar-EG', 'ja', 'bn', 'zh-Hans-u-nu-hanidec']) {
    for (const era of ['long', 'short', 'narrow']) {
      const options = {
        calendar,
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        era,
        timeZone: 'UTC',
      }
      const formatter = new Intl.DateTimeFormat(locale, options),
        native = new Native(locale, options)
      const dates =
        calendar === 'japanese'
          ? [
              '1900-01-01',
              '1920-01-01',
              '1970-01-01',
              '2000-01-01',
              '2019-05-01',
              '2020-02-29',
              '2024-02-10',
            ]
          : ['2020-02-29', '2024-02-10']
      for (const iso of dates) {
        const value = Temporal.PlainDate.from(iso).withCalendar(calendar)
        const milliseconds = Number(
          value.toZonedDateTime('UTC').epochMilliseconds
        )
        assert.equal(
          formatter.format(value),
          native.format(milliseconds),
          locale + ' ' + calendar + ' ' + iso + ' ' + era
        )
        checked++
      }
    }
  }
}
console.log(
  `60 independent ICU rows across 10 calendars; ${checked} checks including all 14 non-Gregorian calendars`
)

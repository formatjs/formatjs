import assert from 'node:assert/strict'
import {join} from 'node:path'
import {pathToFileURL} from 'node:url'
import {runfiles} from '@bazel/runfiles'

const directory = runfiles.resolve(process.argv[2])
const load = name => import(pathToFileURL(join(directory, name)).href)
const {Temporal} = await load('index.js')
const samples = [-544, -543, -542].map((year, index) => ({
  date: new Temporal.PlainDate(year, 1, 1, 'buddhist'),
  datetime: new Temporal.PlainDateTime(
    year,
    1,
    1,
    0,
    0,
    0,
    0,
    0,
    0,
    'buddhist'
  ),
  yearmonth: new Temporal.PlainYearMonth(year, 1, 'buddhist'),
  instant: Temporal.Instant.from(
    `${year === -544 ? '-000544' : year === -543 ? '-000543' : '-000542'}-01-01T00:00Z`
  ),
  expected: [2, 1, 1][index],
}))
for (const [index, sample] of samples.entries()) {
  assert.equal(sample.date.year, index - 1)
  assert.equal(sample.date.eraYear, index - 1)
}
let checked = 0
for (const locale of ['en', 'en-u-nu-mathsans']) {
  for (const width of ['numeric', '2-digit']) {
    const number = new Intl.NumberFormat(locale, {
      useGrouping: false,
      minimumIntegerDigits: width === '2-digit' ? 2 : 1,
    })
    const options = {
      calendar: 'buddhist',
      year: width,
      era: 'short',
      timeZone: 'UTC',
    }
    for (const sample of samples) {
      const expected = `${number.format(sample.expected)} BE`
      for (const value of [sample.date, sample.datetime, sample.yearmonth]) {
        assert.equal(value.toLocaleString(locale, options), expected)
        checked++
      }
      assert.equal(
        sample.instant
          .toZonedDateTimeISO('UTC')
          .withCalendar('buddhist')
          .toLocaleString(locale, {
            calendar: 'buddhist',
            year: width,
            era: 'short',
          }),
        expected
      )
      checked++
    }
  }
}
const NativeDateTimeFormat = Intl.DateTimeFormat
await load('polyfill-force.js')
for (const locale of ['en', 'en-u-nu-mathsans']) {
  for (const width of ['numeric', '2-digit']) {
    const number = new Intl.NumberFormat(locale, {
      useGrouping: false,
      minimumIntegerDigits: width === '2-digit' ? 2 : 1,
    })
    const options = {
      calendar: 'buddhist',
      year: width,
      era: 'short',
      timeZone: 'UTC',
    }
    const formatter = new Intl.DateTimeFormat(locale, options)
    const hostRange =
      width === 'numeric'
        ? new NativeDateTimeFormat(locale, options).formatRangeToParts(
            samples[1].instant.epochMilliseconds,
            samples[2].instant.epochMilliseconds
          )
        : undefined
    assert.equal(formatter.resolvedOptions().calendar, 'buddhist')
    for (const sample of samples) {
      const milliseconds = sample.instant.epochMilliseconds
      const year = number.format(sample.expected)
      const expected = `${year} BE`
      const expectedParts = [
        {type: 'year', value: year},
        {type: 'literal', value: ' '},
        {type: 'era', value: 'BE'},
      ]
      for (const value of [
        milliseconds,
        new Date(milliseconds),
        sample.instant,
        sample.date,
        sample.datetime,
        sample.yearmonth,
      ]) {
        for (let repeat = 0; repeat < 2; repeat++) {
          assert.equal(formatter.format(value), expected)
          assert.deepEqual(formatter.formatToParts(value), expectedParts)
          assert.equal(formatter.formatRange(value, value), expected)
          assert.deepEqual(
            formatter.formatRangeToParts(value, value),
            expectedParts.map(part => ({...part, source: 'shared'}))
          )
        }
        checked++
      }
    }
    // Calendar years 0 and 1 both render as 1 after year normalization.
    for (const [start, end] of [
      [samples[1].date, samples[2].date],
      [
        samples[1].instant.epochMilliseconds,
        samples[2].instant.epochMilliseconds,
      ],
    ]) {
      const parts = formatter.formatRangeToParts(start, end)
      if (hostRange)
        assert.deepEqual(
          parts,
          hostRange.map(part =>
            part.type === 'year' ? {...part, value: number.format(1)} : part
          )
        )
      assert.deepEqual(
        parts
          .filter(part => part.type === 'year')
          .map(({source, value}) => ({source, value})),
        [
          {source: 'startRange', value: number.format(1)},
          {source: 'endRange', value: number.format(1)},
        ]
      )
      assert.equal(
        formatter.formatRange(start, end),
        parts.map(part => part.value).join('')
      )
      checked++
    }
    const range = formatter.formatRangeToParts(samples[0].date, samples[1].date)
    for (const [source, expected] of [
      ['startRange', 2],
      ['endRange', 1],
    ]) {
      assert.equal(
        range.find(part => part.type === 'year' && part.source === source)
          ?.value,
        number.format(expected)
      )
    }
    assert.equal(
      formatter.formatRange(samples[0].date, samples[1].date),
      range.map(part => part.value).join('')
    )
    checked++
  }
}
for (const [locale, month, day, weekday] of [
  ['en', 'numeric', undefined],
  ['en', 'numeric', 'numeric'],
  ['en-u-nu-mathsans', 'numeric', undefined],
  ['en-u-nu-mathsans', 'numeric', 'numeric'],
  ['en', '2-digit', undefined],
  ['en', '2-digit', '2-digit'],
  ['en-u-nu-mathsans', '2-digit', '2-digit'],
  ['de', '2-digit', '2-digit'],
  ['en', 'numeric', 'numeric', 'short'],
  ['en-u-nu-mathsans', '2-digit', '2-digit', 'long'],
  ['en', 'long', undefined],
  ['ru', 'long', undefined],
  ['ru', 'long', 'numeric'],
]) {
  const options = {
    calendar: 'buddhist',
    year: 'numeric',
    month,
    day,
    weekday,
    era: 'short',
    timeZone: 'UTC',
  }
  const first = samples[1]
  const last = samples[2]
  const firstMilliseconds = first.instant.epochMilliseconds
  const lastMilliseconds = day
    ? Date.parse('-000542-01-02T00:00Z')
    : last.instant.epochMilliseconds
  const lastDate = day
    ? new Temporal.PlainDate(-542, 1, 2, 'buddhist')
    : last.date
  const number = new Intl.NumberFormat(locale, {useGrouping: false})
  const padded = new Intl.NumberFormat(locale, {
    useGrouping: false,
    minimumIntegerDigits: 2,
  })
  const expected = new NativeDateTimeFormat(locale, options)
    .formatRangeToParts(firstMilliseconds, lastMilliseconds)
    .map(part => {
      if (locale === 'ru' && part.type === 'month')
        assert.equal(part.value, day ? 'января' : 'январь')
      if (part.type === 'year') return {...part, value: number.format(1)}
      if (part.type === 'day') {
        const raw = part.source === 'endRange' ? 8 : 7
        const corrected = part.source === 'endRange' ? 2 : 1
        const width = part.value === padded.format(raw) ? padded : number
        assert.equal(part.value, width.format(raw))
        return {...part, value: width.format(corrected)}
      }
      return part
    })
  const formatter = new Intl.DateTimeFormat(locale, options)
  for (const [start, end] of [
    [firstMilliseconds, lastMilliseconds],
    [first.date, lastDate],
  ]) {
    assert.deepEqual(formatter.formatRangeToParts(start, end), expected)
    assert.equal(
      formatter.formatRange(start, end),
      expected.map(part => part.value).join('')
    )
    checked++
  }
}

// Native day 11 cannot distinguish numeric and two-digit interval widths.
const withDayOptions = {
  calendar: 'buddhist',
  year: 'numeric',
  month: 'numeric',
  day: 'numeric',
  era: 'short',
  timeZone: 'UTC',
}
const withDay = new Intl.DateTimeFormat('en', withDayOptions)
const fifth = [
  new Temporal.PlainDate(-543, 1, 5, 'buddhist'),
  new Temporal.PlainDate(-542, 1, 5, 'buddhist'),
]
const rawDays = new NativeDateTimeFormat('en', withDayOptions)
  .formatRangeToParts(
    Date.parse('-000543-01-05T00:00Z'),
    Date.parse('-000542-01-05T00:00Z')
  )
  .filter(part => part.type === 'day')
assert.ok(rawDays.length > 0)
assert.ok(rawDays.every(part => part.value === '11'))
const days = withDay
  .formatRangeToParts(...fifth)
  .filter(part => part.type === 'day')
assert.ok(days.length > 0)
assert.ok(days.every(part => part.value === '5'))
checked++

const narrowOptions = {...withDayOptions, month: 'narrow', day: undefined}
const nativeNarrow = new NativeDateTimeFormat('en', narrowOptions)
const nativeOrdinal = new NativeDateTimeFormat('en', {
  ...narrowOptions,
  month: 'numeric',
})
const narrow = new Intl.DateTimeFormat('en', narrowOptions)
const lateJune = [
  new Temporal.PlainDate(-543, 6, 26, 'buddhist'),
  new Temporal.PlainDate(-542, 6, 26, 'buddhist'),
]
const lateJuneMilliseconds = [
  Date.parse('-000543-06-26T00:00Z'),
  Date.parse('-000542-06-26T00:00Z'),
]
// Both month labels are J, but the native ordinal is July.
for (const [index, date] of lateJune.entries()) {
  const time = lateJuneMilliseconds[index]
  const month = (formatter, value) =>
    formatter.formatToParts(value).find(part => part.type === 'month')?.value
  assert.equal(date.month, 6)
  assert.equal(month(nativeOrdinal, time), '7')
  assert.equal(month(nativeNarrow, time), 'J')
  assert.equal(month(narrow, date), 'J')
}
for (const inputs of [lateJune, lateJuneMilliseconds]) {
  assert.deepEqual(
    narrow
      .formatRangeToParts(...inputs)
      .filter(part => part.type === 'era')
      .map(part => part.source),
    ['startRange', 'endRange']
  )
  checked++
}

for (const [style, start, end, referenceStart, referenceEnd] of [
  [{}, [6, 26], [7, 1], [6, 1], [7, 1]],
  [{}, [6, 1], [6, 26], [6, 1], [6, 1]],
  [{year: 'numeric', era: 'short'}, [6, 1], [7, 1], [6, 1], [7, 1]],
]) {
  const options = {
    calendar: 'buddhist',
    timeZone: 'UTC',
    month: 'narrow',
    ...style,
  }
  const toMilliseconds = ([month, day]) => Date.UTC(-543, month - 1, day)
  const toPlainDate = ([month, day]) =>
    new Temporal.PlainDate(-543, month, day, 'buddhist')
  const expected = new NativeDateTimeFormat('en', options)
    .formatRangeToParts(
      toMilliseconds(referenceStart),
      toMilliseconds(referenceEnd)
    )
    .map(part => (part.type === 'year' ? {...part, value: '1'} : part))
  const formatter = new Intl.DateTimeFormat('en', options)
  for (const convert of [toMilliseconds, toPlainDate]) {
    const first = convert(start)
    const last = convert(end)
    assert.deepEqual(formatter.formatRangeToParts(first, last), expected)
    assert.equal(
      formatter.formatRange(first, last),
      expected.map(part => part.value).join('')
    )
    checked++
  }
}

for (const locale of ['en', 'de', 'en-u-nu-mathsans']) {
  const options = {calendar: 'buddhist', timeZone: 'UTC', day: 'numeric'}
  const raw = new NativeDateTimeFormat(locale, options)
  const formatter = new Intl.DateTimeFormat(locale, options)
  const digits = new Intl.NumberFormat(locale, {useGrouping: false})
  for (const [start, end] of [
    [
      [-543, 6, 1],
      [-543, 7, 1],
    ],
    [
      [-543, 6, 1],
      [-542, 6, 1],
    ],
    [
      [-543, 6, 1],
      [-543, 6, 1],
    ],
    [
      [-401, 12, 31],
      [-400, 1, 1],
    ],
  ]) {
    const projected = ([year, month, day]) =>
      Date.UTC(year + 2800, month - 1, day)
    const expected = raw
      .formatRangeToParts(projected(start), projected(end))
      .map(part => {
        if (part.type !== 'year') return part
        const [year] = part.source === 'endRange' ? end : start
        const buddhist = year + 543
        return {
          ...part,
          value: digits.format(buddhist <= 0 ? 1 - buddhist : buddhist),
        }
      })
    const toMilliseconds = ([year, month, day]) =>
      Date.UTC(year, month - 1, day)
    const toPlain = ([year, month, day]) =>
      new Temporal.PlainDate(year, month, day, 'buddhist')
    for (const convert of [toMilliseconds, toPlain]) {
      const first = convert(start)
      const last = convert(end)
      assert.deepEqual(formatter.formatRangeToParts(first, last), expected)
      assert.equal(
        formatter.formatRange(first, last),
        expected.map(part => part.value).join('')
      )
      checked++
    }
  }
}

assert.equal(checked, 191)
console.log(
  '191 native bridge display-year controls, including cold/warm and range paths'
)

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
await load('polyfill-force.js')
for (const locale of ['en', 'en-u-nu-mathsans']) {
  for (const width of ['numeric', '2-digit']) {
    const number = new Intl.NumberFormat(locale, {
      useGrouping: false,
      minimumIntegerDigits: width === '2-digit' ? 2 : 1,
    })
    const formatter = new Intl.DateTimeFormat(locale, {
      calendar: 'buddhist',
      year: width,
      era: 'short',
      timeZone: 'UTC',
    })
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
assert.equal(checked, 124)
console.log(
  '124 native bridge display-year controls, including cold/warm and range paths'
)

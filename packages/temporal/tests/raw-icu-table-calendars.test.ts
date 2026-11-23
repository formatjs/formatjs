import {runfiles} from '@bazel/runfiles'
import {readFileSync} from 'node:fs'
import {expect, it} from 'vitest'
import {Temporal} from '#packages/temporal/index.js'

it('compares unfiltered raw ICU fields across official ranges', () => {
  const file = runfiles.resolve(
    `${process.env.TEST_WORKSPACE || '_main'}/conformance-tests/icu4j/temporal-table-calendar-raw-fixtures.tsv`
  )
  const byYear: Record<string, number> = {},
    samples: string[] = []
  let fields = 0
  for (const line of readFileSync(file, 'utf8').trim().split('\n')) {
    const row = line.split('\t')
    if (row[0] !== 'F') continue
    const value = new Temporal.PlainDate(1970, 1, 1)
      .add({days: +row[2]})
      .withCalendar(row[1])
    const actual = [
      value.year,
      value.month,
      value.monthCode,
      value.day,
      value.daysInMonth,
      value.monthsInYear,
      value.daysInYear,
    ]
    const expected = [
      +row[3],
      +row[4],
      row[5],
      +row[6],
      +row[7],
      +row[8],
      +row[9],
    ]
    if (actual.some((value, index) => value !== expected[index])) {
      const key = `${row[1]}/${row[3]}`
      byYear[key] = (byYear[key] ?? 0) + 1
      if (samples.length < 15)
        samples.push(`${line} actual=${JSON.stringify(actual)}`)
    }
    fields++
  }
  console.log(JSON.stringify({fields, byYear, samples}))
  expect(byYear).toEqual({})
}, 60_000)

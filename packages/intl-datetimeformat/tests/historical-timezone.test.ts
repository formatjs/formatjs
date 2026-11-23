import {readFileSync} from 'node:fs'
import {runfiles} from '@bazel/runfiles'
import {expect, it} from 'vitest'
import {DateTimeFormat} from '#packages/intl-datetimeformat/core.js'
import en from '#packages/intl-datetimeformat/tests/locale-data/en.json' with {type: 'json'}
import data from '@formatjs_generated/tz/all-tz.js'

it('preserves direct zone names and historical offset seconds against ICU', () => {
  DateTimeFormat.__addLocaleData(en as any)
  DateTimeFormat.__addTZData(data)
  const fixture = runfiles.resolve(
    `${process.env.TEST_WORKSPACE || '_main'}/conformance-tests/icu4j/historical-timezone-fixtures.tsv`
  )
  const rows = readFileSync(fixture, 'utf8').trim().split('\n')
  expect(rows).toHaveLength(64)
  for (const row of rows) {
    const [timeZone, epoch, width, expected] = row.split('\t')
    const formatter = new DateTimeFormat('en', {
      timeZone,
      timeZoneName: width as Intl.DateTimeFormatOptions['timeZoneName'],
    })
    expect(
      formatter
        .formatToParts(Number(epoch))
        .find(part => part.type === 'timeZoneName')?.value,
      row
    ).toBe(expected)
  }
})

import '@formatjs/intl-getcanonicallocales/polyfill-force.js'
import {
  DisplayNames,
  type DisplayNamesOptions,
} from '@formatjs/intl-displaynames'
import {runfiles} from '@bazel/runfiles'
import {spawnSync} from 'node:child_process'
import {readFileSync, readdirSync} from 'node:fs'
import {dirname, join} from 'node:path'
import {expect, it} from 'vitest'

const resolve = (path: string) =>
  runfiles.resolve(`${process.env.TEST_WORKSPACE || '_main'}/${path}`)
const codes = {
  language: [
    'en',
    'EN-gb',
    'zh-Hans-SG',
    'zh-Hant-HK',
    'xx-XY',
    'zh-Hans-XY',
    'iw',
    'sh',
    'de-1901',
    'und',
    'zzzzz',
    'root',
    'en-u-ca-gregory',
    'en\n',
  ],
  region: [
    'US',
    'us',
    'GB',
    'CN',
    'SG',
    'XY',
    '419',
    '001',
    'BU',
    'US\n',
    'U1',
  ],
  script: [
    'Latn',
    'latn',
    'CYRL',
    'Arab',
    'Hans',
    'Hant',
    'Zzzz',
    'zzzz',
    'Latn\n',
    'abc',
  ],
  currency: ['usd', 'EUR', 'JPY', 'XYZ', 'zzz', 'XXX', 'XTS', 'USD\n', 'US'],
  calendar: [
    'gregory',
    'GREGORY',
    'buddhist',
    'japanese',
    'ethiopic',
    'ethioaa',
    'islamic-civil',
    'islamicc',
    'abc_def',
    'gregory\n',
  ],
  dateTimeField: [
    'era',
    'year',
    'quarter',
    'month',
    'weekOfYear',
    'weekday',
    'day',
    'dayPeriod',
    'hour',
    'minute',
    'second',
    'timeZoneName',
    'YEAR',
    'year\n',
  ],
}
interface Case {
  options: DisplayNamesOptions
  codes: string[]
}
const cases: Case[] = []
for (const type of Object.keys(codes) as (keyof typeof codes)[]) {
  for (const style of ['long', 'short', 'narrow'] as const)
    for (const fallback of ['code', 'none'] as const) {
      for (const languageDisplay of type === 'language'
        ? (['dialect', 'standard'] as const)
        : (['standard'] as const)) {
        cases.push({
          options: {type, style, fallback, languageDisplay},
          codes: codes[type],
        })
      }
    }
}
it('matches every locale, type, style and fallback against public TS', () => {
  const directory = dirname(
    resolve('crates/intl_displaynames/locale-data/en.json')
  )
  const files = readdirSync(directory)
    .filter(file => file.endsWith('.json'))
    .sort()
  expect(files.length).toBeGreaterThan(600)
  const records = files.map(file => {
    const pack = readFileSync(join(directory, file), 'utf8')
    const raw = JSON.parse(
      readFileSync(
        resolve(`packages/intl-displaynames/cldr-raw/${file}`),
        'utf8'
      )
    )
    DisplayNames.__addLocaleData(raw)
    return {pack, locale: JSON.parse(pack).locale as string}
  })
  const result = spawnSync(
    resolve('crates/intl_displaynames/conformance'),
    [],
    {
      input:
        records
          .map(record => JSON.stringify({pack: record.pack, cases}))
          .join('\n') + '\n',
      encoding: 'utf8',
      maxBuffer: 128 * 1024 * 1024,
    }
  )
  if (result.error) throw result.error
  expect(result.status, result.stderr).toBe(0)
  const results = result.stdout
    .trim()
    .split('\n')
    .map(line => JSON.parse(line))
  expect(results.length).toBe(records.length)
  let comparisons = 0
  for (let index = 0; index < records.length; index++) {
    for (let j = 0; j < cases.length; j++) {
      const current = cases[j]
      const formatter = new DisplayNames(records[index].locale, {
        ...current.options,
        localeMatcher: 'lookup',
      })
      const values = current.codes.map(code => {
        comparisons++
        try {
          return {value: formatter.of(code) ?? null}
        } catch (error) {
          if (!(error instanceof RangeError)) throw error
          return {error: 'RangeError'}
        }
      })
      expect(
        results[index][j],
        records[index].locale + '/' + JSON.stringify(current.options)
      ).toEqual({
        options: JSON.parse(JSON.stringify(formatter.resolvedOptions())),
        values,
      })
    }
  }
  expect(comparisons).toBeGreaterThan(250_000)
}, 120_000)

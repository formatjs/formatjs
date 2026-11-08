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

it('matches script-name oracle fixtures with explicit ICU differences', () => {
  const rows = readFileSync(
    resolve('conformance-tests/icu4j/displaynames-script-fixtures.tsv'),
    'utf8'
  )
    .trimEnd()
    .split('\n')
    .slice(1)
  expect(rows.length).toBeGreaterThan(0)
  const grouped = new Map<
    string,
    {current: Case; expected: string | null; row: string}[]
  >()
  for (const row of rows) {
    const [locale, style, languageDisplay, fallback, code, expected] =
      row.split('\t')
    const group = grouped.get(locale) || []
    group.push({
      current: {
        options: {
          type: 'language',
          style: style as DisplayNamesOptions['style'],
          languageDisplay:
            languageDisplay as DisplayNamesOptions['languageDisplay'],
          fallback: fallback as DisplayNamesOptions['fallback'],
        },
        codes: [code],
      },
      expected: expected === '!NONE' ? null : expected,
      row,
    })
    grouped.set(locale, group)
  }
  const records = [...grouped].map(([locale, group]) => {
    DisplayNames.__addLocaleData(
      JSON.parse(
        readFileSync(
          resolve(`packages/intl-displaynames/cldr-raw/${locale}.json`),
          'utf8'
        )
      )
    )
    return {
      locale,
      group,
      pack: readFileSync(
        resolve(`crates/intl_displaynames/locale-data/${locale}.json`),
        'utf8'
      ),
    }
  })
  const result = spawnSync(
    resolve('crates/intl_displaynames/conformance'),
    [],
    {
      input:
        records
          .map(record =>
            JSON.stringify({
              pack: record.pack,
              cases: record.group.map(item => item.current),
            })
          )
          .join('\n') + '\n',
      encoding: 'utf8',
      maxBuffer: 16 * 1024 * 1024,
    }
  )
  if (result.error) throw result.error
  expect(result.status, result.stderr).toBe(0)
  const actual = result.stdout
    .trim()
    .split('\n')
    .map(line => JSON.parse(line))
  expect(actual.length).toBe(records.length)
  const mismatches: string[] = []
  records.forEach((record, index) =>
    record.group.forEach((item, j) => {
      const ts =
        new DisplayNames(record.locale, item.current.options).of(
          item.current.codes[0]
        ) ?? null
      const rust = actual[index][j].values[0].value
      if (ts !== item.expected || rust !== item.expected)
        mismatches.push(`${item.row}; TS=${ts}; Rust=${rust}`)
    })
  )
  expect(mismatches).toEqual([])
}, 120_000)
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
  if (result.error) throw new Error(String(result.error) + '\n' + result.stderr)
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

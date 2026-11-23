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
    'ETHIOPIC-AMETE-ALEM',
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

it('returns present empty names and ignores inherited entries', () => {
  const raw = JSON.parse(
    readFileSync(resolve('packages/intl-displaynames/cldr-raw/en.json'), 'utf8')
  )
  const pack = JSON.parse(
    readFileSync(
      resolve('crates/intl_displaynames/locale-data/en.json'),
      'utf8'
    )
  )
  for (const record of [raw, pack]) {
    record.data.types.currency.short.USD = ''
    delete record.data.types.currency.short.QZZ
    delete record.data.types.currency.long.QZZ
  }
  const options = {type: 'currency', style: 'short', fallback: 'none'} as const
  const codes = ['USD', 'QZZ']
  const previous = Object.getOwnPropertyDescriptor(Object.prototype, 'QZZ')
  let names: (string | undefined)[]
  try {
    DisplayNames.__addLocaleData(raw)
    const formatter = new DisplayNames('en', options)
    Object.defineProperty(Object.prototype, 'QZZ', {
      configurable: true,
      get() {
        throw new Error('read an inherited name')
      },
    })
    names = codes.map(code => formatter.of(code))
  } finally {
    if (previous) Object.defineProperty(Object.prototype, 'QZZ', previous)
    else Reflect.deleteProperty(Object.prototype, 'QZZ')
    DisplayNames.__addLocaleData(
      JSON.parse(
        readFileSync(
          resolve('packages/intl-displaynames/cldr-raw/en.json'),
          'utf8'
        )
      )
    )
  }
  expect(names).toEqual(['', undefined])

  const result = spawnSync(
    resolve('crates/intl_displaynames/conformance'),
    [],
    {
      input:
        JSON.stringify({
          pack: JSON.stringify(pack),
          cases: [{options, codes}],
        }) + '\n',
      encoding: 'utf8',
    }
  )
  if (result.error) throw result.error
  expect(result.status, result.stderr).toBe(0)
  expect(JSON.parse(result.stdout)[0].values).toEqual([
    {value: ''},
    {value: null},
  ])
})

it.each(['current', 'legacy'] as const)(
  'uses %s field labels and falls back for missing currency names',
  version => {
    const raw = JSON.parse(
      readFileSync(
        resolve('packages/intl-displaynames/cldr-raw/agq.json'),
        'utf8'
      )
    )
    const pack = JSON.parse(
      readFileSync(
        resolve('crates/intl_displaynames/locale-data/agq.json'),
        'utf8'
      )
    )
    if (version === 'legacy') {
      for (const record of [raw, pack]) {
        const fields = record.data.types.dateTimeField.long
        fields.dayperiod = fields.dayPeriod
        delete fields.dayPeriod
      }
    }
    DisplayNames.__addLocaleData(raw)
    const requests = [
      {
        options: {type: 'dateTimeField', fallback: 'none'},
        codes: ['dayPeriod'],
      },
      {options: {type: 'currency', fallback: 'code'}, codes: ['AFN']},
      {options: {type: 'currency', fallback: 'none'}, codes: ['AFN']},
    ] satisfies Case[]
    const expected = ['â tsɨ̀', 'AFN', null]
    expect(
      requests.map(
        ({options, codes}) =>
          new DisplayNames('agq', options).of(codes[0]) ?? null
      )
    ).toEqual(expected)
    const result = spawnSync(
      resolve('crates/intl_displaynames/conformance'),
      [],
      {
        input:
          JSON.stringify({pack: JSON.stringify(pack), cases: requests}) + '\n',
        encoding: 'utf8',
      }
    )
    if (result.error) throw result.error
    expect(result.status, result.stderr).toBe(0)
    expect(
      JSON.parse(result.stdout).map(
        ({values}: {values: {value: string | null}[]}) => values[0].value
      )
    ).toEqual(expected)
  }
)

it('looks up translated language variants and calendar aliases', () => {
  const raw = JSON.parse(
    readFileSync(resolve('packages/intl-displaynames/cldr-raw/en.json'), 'utf8')
  )
  DisplayNames.__addLocaleData(raw)
  const requests = [
    {
      options: {
        type: 'language',
        languageDisplay: 'standard',
        fallback: 'none',
      },
      codes: ['de-1901', 'en-Latn-GB-fonipa-scouse', 'en-abcde'],
    },
    {
      options: {type: 'language', languageDisplay: 'dialect', fallback: 'code'},
      codes: ['en-Latn-GB-fonipa-scouse', 'de-abcde'],
    },
    {
      options: {type: 'calendar', fallback: 'none'},
      codes: ['ethiopic-amete-alem', 'ethioaa', 'islamicc'],
    },
  ] satisfies Case[]
  const expected = [
    [
      'German (Traditional German orthography)',
      'English (Latin, United Kingdom, IPA Phonetics, Scouse)',
      null,
    ],
    ['British English (Latin, IPA Phonetics, Scouse)', 'German (abcde)'],
    ['Ethiopic Amete Alem Calendar', 'Ethiopic Amete Alem Calendar', null],
  ]
  expect(
    requests.map(({options, codes}) => {
      const formatter = new DisplayNames('en', options)
      return codes.map(code => formatter.of(code) ?? null)
    })
  ).toEqual(expected)

  const pack = readFileSync(
    resolve('crates/intl_displaynames/locale-data/en.json'),
    'utf8'
  )
  const result = spawnSync(
    resolve('crates/intl_displaynames/conformance'),
    [],
    {
      input: JSON.stringify({pack, cases: requests}) + '\n',
      encoding: 'utf8',
    }
  )
  if (result.error) throw result.error
  expect(result.status, result.stderr).toBe(0)
  expect(
    JSON.parse(result.stdout).map(
      ({values}: {values: {value: string | null}[]}) =>
        values.map(({value}) => value)
    )
  ).toEqual(expected)
})

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

import '@formatjs/intl-getcanonicallocales/polyfill-force.js'
import {PluralRules} from '@formatjs/intl-pluralrules'
import {runfiles} from '@bazel/runfiles'
import {spawnSync} from 'node:child_process'
import {readFileSync, readdirSync} from 'node:fs'
import {dirname, join} from 'node:path'
import {runInNewContext} from 'node:vm'
import {expect, it} from 'vitest'

interface Case {
  decimal: string
  exponent: number
  ordinal: boolean
}
const resolve = (path: string) =>
  runfiles.resolve(`${process.env.TEST_WORKSPACE || '_main'}/${path}`)

it('matches every CLDR locale pack against the TypeScript rule compiler', () => {
  const directory = dirname(
    resolve('crates/intl_pluralrules/locale-data/en.json')
  )
  const locales = readdirSync(directory)
    .filter(file => file.endsWith('.json'))
    .sort()
  expect(locales.length).toBeGreaterThan(200)
  const decimals = [
    ...Array.from({length: 201}, (_, index) => String(index)),
    '0.0',
    '0.00',
    '0.1',
    '0.5',
    '1.0',
    '1.00',
    '1.01',
    '1.1',
    '1.5',
    '2.0',
    '2.00',
    '2.1',
    '2.5',
    '3.0',
    '3.5',
    '5.5',
    '10.1',
    '11.5',
    '21.1',
    '100.5',
    '1000',
    '1000000',
    '2000000',
    '9007199254740991',
    '9007199254740992',
    '9007199254740993',
    '9999999999999999999999999999999999999999',
    '-0',
    '-1',
    '-2.5',
    'NaN',
    'Infinity',
    '-Infinity',
  ]
  const cases: Case[] = []
  for (const ordinal of [false, true])
    for (const decimal of decimals) cases.push({decimal, ordinal, exponent: 0})
  for (const decimal of ['1', '1000', '1000000', '2000000', '1.00'])
    for (const exponent of [3, 6])
      cases.push({decimal, ordinal: false, exponent})
  const records = locales.map(file => {
    const pack = readFileSync(join(directory, file), 'utf8')
    const locale = JSON.parse(pack).locale as string
    // Bazel generated this expression with the real TS rule compiler. Its
    // function remains the reference; Rust receives the original CLDR rules.
    const raw = runInNewContext(
      '(' +
        readFileSync(
          resolve(`packages/intl-pluralrules/cldr-raw/${locale}.js`),
          'utf8'
        ) +
        ')'
    )
    PluralRules.__addLocaleData(raw)
    return {pack, locale, raw}
  })
  const requests = records.map(record =>
    JSON.stringify({pack: record.pack, cases})
  )
  const result = spawnSync(resolve('crates/intl_pluralrules/conformance'), [], {
    input: requests.join('\n') + '\n',
    encoding: 'utf8',
    maxBuffer: 32 * 1024 * 1024,
  })
  if (result.error) throw result.error
  expect(result.status, result.stderr).toBe(0)
  const results = result.stdout
    .trim()
    .split('\n')
    .map(line => JSON.parse(line))
  expect(results.length).toBe(records.length)
  const mismatches: unknown[] = []
  let comparisons = 0
  for (let index = 0; index < records.length; index++) {
    const record = records[index],
      actual = results[index]
    for (const ordinal of [false, true]) {
      const type = ordinal ? 'ordinal' : 'cardinal'
      expect(actual[type], record.locale + ' ' + type).toEqual(
        new PluralRules(record.locale, {type}).resolvedOptions()
          .pluralCategories
      )
    }
    for (let sample = 0; sample < cases.length; sample++) {
      const input = cases[sample]
      const expected = ['NaN', 'Infinity', '-Infinity'].includes(input.decimal)
        ? 'other'
        : record.raw.data.fn(input.decimal, input.ordinal, input.exponent)
      comparisons++
      if (actual.values[sample] !== expected)
        mismatches.push({
          locale: record.locale,
          input,
          actual: actual.values[sample],
          expected,
        })
    }
  }
  expect(comparisons).toBeGreaterThan(100_000)
  if (mismatches.length)
    console.error(
      JSON.stringify({
        count: mismatches.length,
        examples: mismatches.slice(0, 30),
      })
    )
  expect(mismatches.length).toBe(0)
}, 60_000)

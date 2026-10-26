import '@formatjs/intl-getcanonicallocales/polyfill-force.js'
import {PluralRules} from '@formatjs/intl-pluralrules'
import {defaultContent} from '@formatjs_generated/cldr.supported-locales/default-content.js'
import {runfiles} from '@bazel/runfiles'
import {readFileSync} from 'node:fs'
import {spawnSync} from 'node:child_process'
import {runInNewContext} from 'node:vm'
import {expect, it} from 'vitest'

const resolve = (path: string) =>
  runfiles.resolve(`${process.env.TEST_WORKSPACE || '_main'}/${path}`)

it('matches TypeScript availability, aliases and late explicit registration', () => {
  const scenarios = [
    [],
    ['en'],
    ['en', 'en-US'],
    ['en-US', 'en'],
    ['pt-PT', 'pt'],
    ['sh'],
    ['sr', 'sh'],
    ['zh'],
    ['zh-Hant', 'zh'],
    ['fr', 'bn'],
    ['en', 'fr', 'en'],
  ]
  const queries = [
    'en',
    'en-US',
    'pt',
    'pt-PT',
    'sr',
    'sr-Latn',
    'sr-Latn-RS',
    'zh',
    'zh-Hant',
    'zh-TW',
    'fr',
    'bn',
  ]
  const records = scenarios.map(locales => {
    PluralRules.localeData = {}
    PluralRules.availableLocales = new Set()
    PluralRules.__defaultLocale = ''
    const packs = locales.map(locale => {
      const source =
        locale === 'en-US' ? 'en' : locale === 'zh-Hant' ? 'zh' : locale
      const raw = runInNewContext(
        '(' +
          readFileSync(
            resolve(`packages/intl-pluralrules/cldr-raw/${source}.js`),
            'utf8'
          ) +
          ')'
      )
      raw.locale = locale
      PluralRules.__addLocaleData(raw)
      const pack = JSON.parse(
        readFileSync(
          resolve(`crates/intl_pluralrules/locale-data/${source}.json`),
          'utf8'
        )
      )
      if (source !== locale) {
        pack.locale = locale
        pack.aliases = defaultContent[locale] || []
      }
      return JSON.stringify(pack)
    })
    const expected = {
      available: [...PluralRules.availableLocales],
      default: PluralRules.__defaultLocale || null,
      values: queries.map(locale => {
        if (!PluralRules.availableLocales.has(locale)) return {missing: true}
        const rules = new PluralRules(locale, {localeMatcher: 'lookup'})
        return {
          resolved: rules.resolvedOptions(),
          one: rules.select(1),
          five: rules.select(5),
          range: rules.selectRange(1, 2),
        }
      }),
    }
    return {locales, request: {packs, queries}, expected}
  })
  const result = spawnSync(
    resolve('crates/intl_pluralrules/registration'),
    [],
    {
      input:
        records.map(record => JSON.stringify(record.request)).join('\n') + '\n',
      encoding: 'utf8',
      maxBuffer: 4 * 1024 * 1024,
    }
  )
  if (result.error) throw result.error
  expect(result.status, result.stderr).toBe(0)
  const actual = result.stdout
    .trim()
    .split('\n')
    .map(line => JSON.parse(line))
  expect(actual).toHaveLength(records.length)
  records.forEach((record, index) =>
    expect(actual[index], JSON.stringify(record.locales)).toEqual(
      record.expected
    )
  )
})

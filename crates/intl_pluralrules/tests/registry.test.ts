import '@formatjs/intl-getcanonicallocales/polyfill-force.js'
import '@formatjs/intl-locale/polyfill-force.js'
import {PluralRules} from '@formatjs/intl-pluralrules'
import {match, LookupSupportedLocales} from '@formatjs/intl-localematcher'
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
    ['en-GB', 'en-US'],
    ['es', 'en', 'es-419'],
    ['zh-Hant', 'zh-MO'],
    ['de', 'ja'],
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
  const requested = [
    [],
    ['en-US'],
    ['en-GB'],
    ['en-CA'],
    ['es-KY'],
    ['pt-BR'],
    ['pt-AO'],
    ['zh-HK'],
    ['zh-TW'],
    ['sr-Latn-RS'],
    ['sr-Cyrl'],
    ['bn-BD'],
    ['de-DE', 'fr'],
    ['fr-XX', 'en'],
    ['en-GB', 'en-US', 'en'],
    ['qzz'],
    ['de-x-u-co-phonebk'],
    ['de-u-co-phonebk-x-private'],
    ['de-t-en-u-co-phonebk-x-u-kn'],
    ['en-u-nu-arab'],
  ].map(locales => Intl.getCanonicalLocales(locales))
  const records = scenarios.map(locales => {
    PluralRules.localeData = {}
    PluralRules.availableLocales = new Set()
    PluralRules.__defaultLocale = ''
    const packs = locales.map(locale => {
      const source =
        (
          {
            'en-US': 'en',
            'en-GB': 'en',
            'zh-Hant': 'zh',
            'zh-MO': 'zh',
            'es-419': 'es',
          } as Record<string, string>
        )[locale] || locale
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
      matches: requested.map(requested => ({
        lookup:
          match(
            requested,
            [...PluralRules.availableLocales],
            PluralRules.__defaultLocale,
            {algorithm: 'lookup'}
          ) || null,
        bestFit:
          match(
            requested,
            [...PluralRules.availableLocales],
            PluralRules.__defaultLocale,
            {algorithm: 'best fit'}
          ) || null,
        supported: LookupSupportedLocales(
          [...PluralRules.availableLocales],
          requested
        ),
      })),
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
    return {locales, request: {packs, queries, requested}, expected}
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

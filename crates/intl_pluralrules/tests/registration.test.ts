import '@formatjs/intl-getcanonicallocales/polyfill-force.js'
import {PluralRules} from '@formatjs/intl-pluralrules'
import {runfiles} from '@bazel/runfiles'
import {readFileSync, readdirSync} from 'node:fs'
import {dirname, join} from 'node:path'
import {runInNewContext} from 'node:vm'
import {expect, it} from 'vitest'

it('can construct and inspect every explicitly registered CLDR plural locale', () => {
  const directory = dirname(
    runfiles.resolve(
      `${process.env.TEST_WORKSPACE || '_main'}/packages/intl-pluralrules/cldr-raw/en.js`
    )
  )
  const records = readdirSync(directory)
    .filter(file => file.endsWith('.js'))
    .sort()
    .map(file =>
      runInNewContext('(' + readFileSync(join(directory, file), 'utf8') + ')')
    )
  for (const record of records) PluralRules.__addLocaleData(record)
  const failures = records.flatMap(record => {
    try {
      new PluralRules(record.locale).resolvedOptions()
      return []
    } catch (error) {
      return [
        {
          locale: record.locale,
          canonical: Intl.getCanonicalLocales(record.locale),
          supported: PluralRules.supportedLocalesOf([record.locale]),
          error: String(error),
        },
      ]
    }
  })
  if (failures.length) console.error(JSON.stringify(failures))
  expect(failures).toEqual([])
  expect(
    new PluralRules('en', {type: 'ordinal'}).select(
      '9007199254740993' as unknown as number
    )
  ).toBe('few')
  expect(new PluralRules('ak').select(0.5)).toBe('other')
  expect(
    new PluralRules('lv', {maximumFractionDigits: 100}).select(
      '0.0000000000000000000001' as unknown as number
    )
  ).toBe('one')
})

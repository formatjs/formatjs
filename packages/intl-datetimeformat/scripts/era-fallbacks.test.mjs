import assert from 'node:assert/strict'
import {readFileSync, readdirSync} from 'node:fs'
import {dirname, join} from 'node:path'
import {createRequire} from 'node:module'
import {beforeHijrah} from '@formatjs_generated/datetimeformat.calendars/fallback-eras.js'

const require = createRequire(import.meta.url)
const root = join(
  dirname(require.resolve('cldr-cal-islamic-full/package.json')),
  'main'
)
let count = 0
for (const locale of readdirSync(root)) {
  const source = JSON.parse(
    readFileSync(join(root, locale, 'ca-islamic.json'), 'utf8')
  ).main[locale].dates.calendars.islamic.eras
  let key = locale
  while (!beforeHijrah[key] && key.includes('-'))
    key = key.slice(0, key.lastIndexOf('-'))
  assert.deepEqual(
    beforeHijrah[key],
    [source.eraNames['1'], source.eraAbbr['1'], source.eraNarrow['1']],
    locale
  )
  count++
}
assert.equal(count, 657)
for (const locale of [
  'blt-Latn',
  'byn-Latn',
  'cu-Glag',
  'en-Dsrt',
  'en-Shaw',
  'iu-Latn',
  'kaa-Latn',
])
  assert.deepEqual(
    beforeHijrah[locale],
    beforeHijrah.und,
    locale + ' explicit root parent'
  )
console.log(`${count} CLDR locales preserve all three Before Hijrah widths`)

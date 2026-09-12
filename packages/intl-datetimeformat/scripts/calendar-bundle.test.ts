import {readFileSync} from 'node:fs'
import {execFileSync} from 'node:child_process'
import {fileURLToPath} from 'node:url'
import {expect, test} from 'vitest'

const pkg = new URL('../pkg/', import.meta.url)
const sources = (entry: string): string[] =>
  JSON.parse(readFileSync(new URL(`${entry}.js.map`, pkg), 'utf8')).sources

test('published core excludes optional calendar arithmetic and tables', () => {
  const manifest = JSON.parse(
    readFileSync(new URL('package.json', pkg), 'utf8')
  )
  expect(manifest.exports['./calendar-data/*']).toBe('./calendar-data/*')
  expect(manifest.exports['./add-all-calendars.js']).toBe(
    './add-all-calendars.js'
  )
  for (const entry of ['index', 'polyfill', 'polyfill-force']) {
    expect(
      sources(entry).filter(
        source =>
          source.includes('/calendars/') ||
          source.includes('icu.calendar') ||
          source.includes('temporal-polyfill') ||
          source.includes('LunisolarDateFromTime')
      )
    ).toEqual([])
  }
  const chinese = sources('calendar-data/chinese').join('\n')
  expect(chinese).toContain('LunisolarDateFromTime')
  expect(chinese).not.toContain('/dangi')
  expect(chinese).not.toContain('temporal-polyfill')
  expect(sources('calendar-data/hebrew').join('\n')).not.toContain(
    'icu.calendar'
  )
})

// Fresh processes exercise the actual npm ESM entries, including registration
// across separately bundled modules rather than shared source-module state.
for (const before of [false, true]) {
  test(`published calendar modules load ${before ? 'before' : 'after'} installation`, () => {
    const code = `
      import assert from 'node:assert/strict'
      const root = ${JSON.stringify(pkg.href)}
      const load = path => import('@formatjs/intl-datetimeformat/' + path)
      const addons = async () => {
        await load('calendar-data/hebrew/en.js')
        await load('calendar-data/hebrew.js')
      }
      if (${before}) await addons()
      await load('polyfill-force.js')
      await load('locale-data/en.js')
      const format = calendar => new Intl.DateTimeFormat('en', {
        calendar, timeZone: 'UTC', year: 'numeric', month: 'long', day: 'numeric',
      })
      if (!${before}) {
        assert.equal(format('hebrew').resolvedOptions().calendar, 'gregory')
        await addons()
      }
      assert.equal(format('hebrew').resolvedOptions().calendar, 'hebrew')
      assert.match(format('hebrew').format(Date.UTC(2024, 2, 11)), /Adar II/)
      assert.equal(format('chinese').resolvedOptions().calendar, 'gregory')
      assert.equal(format('gregory').format(Date.UTC(2024, 2, 11)), 'March 11, 2024')
      // Custom providers use the same registration API as shipped add-ons.
      const {readFileSync} = await import('node:fs')
      const {runInNewContext} = await import('node:vm')
      let base
      runInNewContext(readFileSync(new URL('locale-data/en.js', root), 'utf8'), {
        Intl: {DateTimeFormat: {__addLocaleData(data) {base = data}}},
      })
      Intl.DateTimeFormat.__addCalendarLocaleData({
        locale: 'en', calendar: 'custom', data: base.data, formats: base.data.formats.gregory,
      })
      assert.equal(format('custom').resolvedOptions().calendar, 'gregory')
      Intl.DateTimeFormat.__addCalendarData({calendar: 'custom', dateFromTime(t) {
        const d = new Date(t)
        return {era: 'AD', year: d.getUTCFullYear() + 1000, month: d.getUTCMonth(), day: d.getUTCDate()}
      }})
      assert.equal(format('custom').resolvedOptions().calendar, 'custom')
      assert.equal(format('custom').format(Date.UTC(2024, 0, 1)), 'January 1, 3024')
      assert.match(format('custom').formatRange(Date.UTC(2024, 0, 1), Date.UTC(2024, 0, 2)), /3024/)
      assert.equal(globalThis.__FORMATJS_DATETIMEFORMAT_CALENDAR_DATA__, undefined)
      assert.equal(globalThis.__FORMATJS_DATETIMEFORMAT_CALENDAR_LOCALE_DATA__, undefined)
    `
    expect(() =>
      execFileSync(process.execPath, ['--input-type=module', '-e', code], {
        encoding: 'utf8',
        timeout: 30000,
        cwd: fileURLToPath(pkg),
      })
    ).not.toThrow()
  })
}

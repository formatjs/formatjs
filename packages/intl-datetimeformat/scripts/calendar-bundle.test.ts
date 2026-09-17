import {
  readFileSync,
  readdirSync,
  statSync,
  existsSync,
  mkdtempSync,
  mkdirSync,
  symlinkSync,
  rmSync,
} from 'node:fs'
import {tmpdir} from 'node:os'
import {join} from 'node:path'
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
  expect(manifest.exports['./calendar-data/*']).toBeUndefined()
  expect(existsSync(new URL('calendar-data/hebrew/en.js', pkg))).toBe(false)
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
        await import('@formatjs/intl-datetimeformat-calendar-hebrew/locale-data/en.js')
        await import('@formatjs/intl-datetimeformat-calendar-hebrew')
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
    const project = mkdtempSync(join(tmpdir(), 'formatjs-calendars-'))
    try {
      const scope = join(project, 'node_modules', '@formatjs')
      mkdirSync(scope, {recursive: true})
      symlinkSync(fileURLToPath(pkg), join(scope, 'intl-datetimeformat'))
      symlinkSync(
        fileURLToPath(
          new URL(
            '../../intl-datetimeformat-calendar-hebrew/pkg/',
            import.meta.url
          )
        ),
        join(scope, 'intl-datetimeformat-calendar-hebrew')
      )
      expect(() =>
        execFileSync(process.execPath, ['--input-type=module', '-e', code], {
          encoding: 'utf8',
          timeout: 30000,
          cwd: project,
        })
      ).not.toThrow()
    } finally {
      rmSync(project, {recursive: true, force: true})
    }
  })
}

const calendars = [
  'buddhist',
  'coptic',
  'ethiopic',
  'ethioaa',
  'roc',
  'japanese',
  'indian',
  'islamic-civil',
  'islamic-tbla',
  'persian',
  'hebrew',
  'islamic-umalqura',
  'chinese',
  'dangi',
]

function packageSize(root: URL): {bytes: number; files: number} {
  let bytes = 0
  let files = 0
  for (const name of readdirSync(root, {recursive: true})) {
    const stat = statSync(new URL(String(name), root))
    if (stat.isFile()) {
      bytes += stat.size
      files++
    }
  }
  return {bytes, files}
}

test('published packages keep optional locale data out of base and within install budgets', () => {
  const base = packageSize(pkg)
  expect(base.bytes).toBeLessThan(250_000_000)
  expect(base.files).toBeLessThan(1700)
  for (const calendar of calendars) {
    const root = new URL(
      `../../intl-datetimeformat-calendar-${calendar}/pkg/`,
      import.meta.url
    )
    const size = packageSize(root)
    expect(size.bytes, calendar).toBeLessThan(200_000_000)
    expect(size.files, calendar).toBeLessThan(1600)
    const manifest = JSON.parse(
      readFileSync(new URL('package.json', root), 'utf8')
    )
    expect(manifest.name).toBe(
      `@formatjs/intl-datetimeformat-calendar-${calendar}`
    )
    expect(existsSync(new URL('locale-data/en.js', root))).toBe(true)
    expect(existsSync(new URL('locale-data/en.d.ts', root))).toBe(true)
    expect(
      Object.keys(
        JSON.parse(readFileSync(new URL('package.json', pkg), 'utf8'))
          .dependencies ?? {}
      ).some(name => name.includes('-calendar-'))
    ).toBe(false)
  }
})

// Pack the complete publishable artifact, including declarations and source maps.
// Keep this in the default test suite so install-size regressions fail CI.
test.each([
  {name: 'intl-datetimeformat', budget: 25_000_000},
  ...calendars.map(calendar => ({
    name: `intl-datetimeformat-calendar-${calendar}`,
    budget: 15_000_000,
  })),
])(
  '$name compressed tarball stays within download budget',
  ({name, budget}) => {
    const directory = mkdtempSync(join(tmpdir(), 'formatjs-tar-size-'))
    try {
      const root = new URL(`../../${name}/pkg/`, import.meta.url)
      symlinkSync(fileURLToPath(root), join(directory, 'package'), 'dir')
      const archive = join(directory, 'package.tgz')
      // Dereference the staging link to include every file, as npm publishing does.
      execFileSync('tar', ['-czhf', archive, '-C', directory, 'package'], {
        timeout: 30000,
      })
      const bytes = statSync(archive).size
      console.log(`${name}: ${bytes} compressed bytes (budget ${budget})`)
      expect(bytes, `${name} compressed tarball`).toBeLessThan(budget)
    } finally {
      rmSync(directory, {recursive: true, force: true})
    }
  },
  40000
)

import {runfiles} from '@bazel/runfiles'
import {spawnSync} from 'node:child_process'
import {readFileSync, writeFileSync} from 'node:fs'
import {join} from 'node:path'
function main() {
  const resolve = (path: string) =>
    runfiles.resolve(`${process.env.TEST_WORKSPACE || '_main'}/${path}`)
  const locales = ['en', 'fr', 'ar', 'ja', 'zh-Hans', 'ru', 'hi', 'he']
  const packs = locales.map(locale =>
    readFileSync(
      resolve(`crates/intl_datetimeformat/locale-data/${locale}.json`),
      'utf8'
    )
  )
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
  const arithmetic = calendars.map(calendar =>
    readFileSync(
      resolve(
        `crates/intl_datetimeformat_calendars/calendar-data/${calendar}.json`
      ),
      'utf8'
    )
  )
  const patches = calendars.flatMap(calendar =>
    locales.map(locale =>
      readFileSync(
        resolve(
          `packages/intl-datetimeformat-calendar-${calendar}/locale-data-json/${locale}.json`
        ),
        'utf8'
      )
    )
  )
  const timezone = readFileSync(
    resolve('packages/intl-datetimeformat/tz-all.json'),
    'utf8'
  )
  const fixture = join(process.env.TEST_TMPDIR!, 'datetimeformat-input.js')
  writeFileSync(
    fixture,
    `globalThis.__DATETIME_FIXTURES = ${JSON.stringify({locales, packs, calendars, arithmetic, patches, timezone})};\n`
  )
  for (const mode of ['source', 'bytecode']) {
    const result = spawnSync(
      resolve('native/hermes/hermes_runner'),
      [
        '--es6-block-scoping',
        `--prelude=${resolve('native/hermes/tests/formatter_prelude.js')}`,
        `--prelude=${resolve('native/hermes/tests/datetimeformat_prelude.js')}`,
        mode === 'source'
          ? '--native-datetimeformat'
          : `--extensions=${resolve('native/hermes/extensions.hbc')}`,
        fixture,
        resolve('native/hermes/tests/datetimeformat_suite.js'),
      ],
      {encoding: 'utf8', timeout: 300_000, maxBuffer: 4 * 1024 * 1024}
    )
    if (result.error) throw result.error
    process.stdout.write(result.stdout || '')
    process.stderr.write(result.stderr || '')
    if (result.status !== 0)
      throw new Error(
        `Hermes DateTimeFormat ${mode} failed: ${result.status ?? result.signal}`
      )
    const report = JSON.parse(result.stdout.trim())
    if (
      report.type !== 'DateTimeFormat-conformance' ||
      report.candidate !== 'Rust JSI installed API' ||
      report.reference !== 'TypeScript implementation' ||
      report.onDemand !== true ||
      report.cases < 9000 ||
      report.assertions < 40000
    )
      throw new Error('Incomplete DateTimeFormat integration coverage')
  }
}
if (import.meta.filename === process.argv[1]) main()

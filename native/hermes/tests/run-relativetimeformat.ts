import {runfiles} from '@bazel/runfiles'
import {spawnSync} from 'node:child_process'
import {readFileSync, writeFileSync} from 'node:fs'
import {join} from 'node:path'

function main() {
  const resolve = (path: string) =>
    runfiles.resolve(`${process.env.TEST_WORKSPACE || '_main'}/${path}`)
  const locales = [
    'en',
    'fr',
    'ru',
    'ar',
    'lv',
    'pt',
    'pt-PT',
    'cy',
    'sl',
    'cs',
    'it',
    'es',
    'ja',
    'de',
    'pl',
    'hi',
    'zh',
    'ko',
    'bn',
    'sw',
    'sr-Latn',
    'gsw',
    'my',
    'ne',
  ]
  const packs = locales.map(locale =>
    readFileSync(
      resolve(`crates/intl_relativetimeformat/locale-data/${locale}.json`),
      'utf8'
    )
  )
  const plurals = locales.map(locale =>
    readFileSync(
      resolve(
        `packages/intl-pluralrules/cldr-raw/${locale === 'sr-Latn' ? 'sh' : locale}.js`
      ),
      'utf8'
    )
  )
  const fixture = join(process.env.TEST_TMPDIR!, 'relativetimeformat-input.js')
  writeFileSync(
    fixture,
    `globalThis.__RELATIVE_FIXTURES = {packs:${JSON.stringify(packs)},plurals:[${plurals.join(',')}]};\n`
  )
  for (const mode of ['source', 'bytecode']) {
    const result = spawnSync(
      resolve('native/hermes/hermes_runner'),
      [
        mode === 'source'
          ? '--native-relativetimeformat'
          : `--extensions=${resolve('native/hermes/extensions.hbc')}`,
        fixture,
        resolve('native/hermes/tests/relativetimeformat_suite.js'),
      ],
      {encoding: 'utf8', timeout: 300_000, maxBuffer: 4 * 1024 * 1024}
    )
    if (result.error) throw result.error
    process.stdout.write(result.stdout || '')
    process.stderr.write(result.stderr || '')
    if (result.status !== 0)
      throw new Error(
        `Hermes RelativeTimeFormat ${mode} failed: ${result.status ?? result.signal}`
      )
    const report = JSON.parse(result.stdout.trim())
    if (
      report.type !== 'RelativeTimeFormat-conformance' ||
      report.candidate !== 'Rust JSI installed API' ||
      report.reference !== 'TypeScript implementation' ||
      report.onDemand !== true ||
      report.cases < 10_000 ||
      report.assertions < 20_000
    )
      throw new Error('Incomplete RelativeTimeFormat integration coverage')
  }
}
if (import.meta.filename === process.argv[1]) main()

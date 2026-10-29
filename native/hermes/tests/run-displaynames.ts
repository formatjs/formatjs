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
    'zh',
    'aa',
    'agq',
  ]
  const packs = locales.map(locale =>
    readFileSync(
      resolve(`crates/intl_displaynames/locale-data/${locale}.json`),
      'utf8'
    )
  )
  const tsData = locales.map(locale =>
    readFileSync(
      resolve(`packages/intl-displaynames/cldr-raw/${locale}.json`),
      'utf8'
    )
  )
  const fixture = join(process.env.TEST_TMPDIR!, 'displaynames-input.js')
  writeFileSync(
    fixture,
    `globalThis.__DISPLAY_FIXTURES = {packs:${JSON.stringify(packs)},tsData:[${tsData.join(',')}]};\n`
  )
  for (const mode of ['source', 'bytecode']) {
    const result = spawnSync(
      resolve('native/hermes/hermes_runner'),
      [
        mode === 'source'
          ? '--native-displaynames'
          : `--extensions=${resolve('native/hermes/extensions.hbc')}`,
        fixture,
        resolve('native/hermes/tests/displaynames_suite.js'),
      ],
      {encoding: 'utf8', timeout: 180_000, maxBuffer: 4 * 1024 * 1024}
    )
    if (result.error) throw result.error
    process.stdout.write(result.stdout || '')
    process.stderr.write(result.stderr || '')
    if (result.status !== 0)
      throw new Error(
        `Hermes DisplayNames ${mode} failed: ${result.status ?? result.signal}`
      )
    const report = JSON.parse(result.stdout.trim())
    if (
      report.type !== 'DisplayNames-conformance' ||
      report.candidate !== 'Rust JSI installed API' ||
      report.reference !== 'TypeScript implementation' ||
      report.onDemand !== true ||
      report.cases < 6_000 ||
      report.assertions < 6_000
    )
      throw new Error('Incomplete DisplayNames integration coverage')
  }
}
if (import.meta.filename === process.argv[1]) main()

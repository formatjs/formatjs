import {runfiles} from '@bazel/runfiles'
import {spawnSync} from 'node:child_process'
import {readFileSync, writeFileSync} from 'node:fs'
import {join} from 'node:path'
function main() {
  const resolve = (path: string) =>
    runfiles.resolve(`${process.env.TEST_WORKSPACE || '_main'}/${path}`)
  const read = (path: string) => readFileSync(resolve(path), 'utf8')
  const locales = ['en', 'fr', 'ar', 'de', 'ja', 'ru', 'zh', 'fa', 'da', 'fi']
  const fixture = join(process.env.TEST_TMPDIR!, 'durationformat-input.js')
  writeFileSync(
    fixture,
    'globalThis.__DURATION_FIXTURES = ' +
      JSON.stringify({
        locales,
        numbers: locales.map(locale =>
          read(`crates/intl_numberformat/locale-data/${locale}.json`)
        ),
        lists: locales.map(locale =>
          read(`crates/intl_listformat/locale-data/${locale}.json`)
        ),
      }).slice(0, -1) +
      ',"rawLists":[' +
      locales
        .map(locale => read(`packages/intl-listformat/cldr-raw/${locale}.json`))
        .join(',') +
      '],"plurals":[' +
      locales
        .map(locale => read(`packages/intl-pluralrules/cldr-raw/${locale}.js`))
        .join(',') +
      ']};\n'
  )
  for (const mode of ['source', 'bytecode']) {
    const install =
      mode === 'source'
        ? '--native-durationformat'
        : '--extensions=' + resolve('native/hermes/extensions.hbc')
    const smoke = spawnSync(
      resolve('native/hermes/hermes_runner'),
      [
        install,
        fixture,
        resolve('native/hermes/tests/durationformat-smoke.js'),
      ],
      {encoding: 'utf8', timeout: 60_000, maxBuffer: 1024 * 1024}
    )
    if (smoke.error) throw smoke.error
    if (
      smoke.status !== 0 ||
      !smoke.stdout.includes('Hermes DurationFormat default runtime passed')
    )
      throw new Error(
        'DurationFormat default-runtime smoke failed: ' + smoke.stderr
      )
    process.stdout.write(smoke.stdout)

    const result = spawnSync(
      resolve('native/hermes/hermes_runner'),
      [
        '--es6-block-scoping',
        `--prelude=${resolve('native/hermes/tests/datetimeformat_prelude.js')}`,
        mode === 'source'
          ? '--native-durationformat'
          : `--extensions=${resolve('native/hermes/extensions.hbc')}`,
        fixture,
        resolve('native/hermes/tests/durationformat_suite.js'),
      ],
      {encoding: 'utf8', timeout: 180_000, maxBuffer: 4 * 1024 * 1024}
    )
    if (result.error) throw result.error
    process.stdout.write(result.stdout || '')
    process.stderr.write(result.stderr || '')
    if (result.status !== 0)
      throw new Error(
        `Hermes DurationFormat ${mode} failed: ${result.status ?? result.signal}`
      )
    const report = JSON.parse(result.stdout.trim())
    if (
      report.type !== 'DurationFormat-conformance' ||
      report.candidate !== 'Rust JSI installed API' ||
      report.reference !== 'TypeScript implementation' ||
      report.cases < 3000 ||
      report.assertions < 10_000 ||
      report.onDemand !== true
    )
      throw new Error('Incomplete DurationFormat integration coverage')
  }
}
if (import.meta.filename === process.argv[1]) main()

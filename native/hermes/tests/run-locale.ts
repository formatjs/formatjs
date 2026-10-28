import {runfiles} from '@bazel/runfiles'
import {spawnSync} from 'node:child_process'

function main() {
  const resolve = (path: string) =>
    runfiles.resolve(`${process.env.TEST_WORKSPACE || '_main'}/${path}`)
  const result = spawnSync(
    resolve('native/hermes/hermes_runner'),
    [
      `--prelude=${resolve('native/hermes/tests/formatter_prelude.js')}`,
      resolve('native/hermes/tests/locale_suite.js'),
      resolve('native/hermes/tests/locale_late_data.js'),
    ],
    {encoding: 'utf8', timeout: 120_000}
  )
  if (result.error) throw result.error
  process.stdout.write(result.stdout || '')
  process.stderr.write(result.stderr || '')
  if (result.status !== 0)
    throw new Error(
      `Hermes Locale conformance failed: ${result.status ?? result.signal}`
    )
  const report = JSON.parse(result.stdout.trim())
  if (
    report.type !== 'Locale-conformance' ||
    report.cases <= 250 ||
    report.assertions <= 1000 ||
    report.candidate !== 'Rust JSI installed API' ||
    report.backend !== 'TypeScript formatters' ||
    report.onDemand !== true
  )
    throw new Error('Incomplete Locale integration coverage')
}
if (import.meta.filename === process.argv[1]) main()
